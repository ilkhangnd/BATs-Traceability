import { describe, expect, it } from "vitest";
import { BatsService } from "./bats.service.js";
import { MerkleService } from "./merkle.service.js";
import { StoreService } from "./store.service.js";
import { ValidationService } from "./validation.service.js";

function service() {
  const store = new StoreService();
  return {
    store,
    bats: new BatsService(store, new ValidationService(), new MerkleService())
  };
}

describe("BatsService operational safeguards", () => {
  it("replays the same idempotent harvest without creating a duplicate", async () => {
    const { bats, store } = service();
    await bats.onModuleInit();
    const input = {
      farmPlotId: "plot-dlk-0001",
      actorId: "FARMER-0001",
      variety: "Ri6",
      quantityKg: 500,
      eventTime: "2026-07-05T08:00:00+07:00",
      location: { latitude: 12.6789, longitude: 108.1234 }
    };
    const first = await bats.createHarvest(input, "harvest-key-0001");
    const second = await bats.createHarvest(input, "harvest-key-0001");
    expect(second.id).toBe(first.id);
    expect(store.batches.size).toBe(2);
    await expect(
      bats.createHarvest({ ...input, quantityKg: 501 }, "harvest-key-0001")
    ).rejects.toThrow("Idempotency key đã được dùng");
  });

  it("allows only one concurrent request to claim an idempotency key", async () => {
    const { bats, store } = service();
    await bats.onModuleInit();
    const input = {
      farmPlotId: "plot-dlk-0001",
      actorId: "FARMER-0001",
      variety: "Ri6",
      quantityKg: 450,
      eventTime: "2026-07-05T08:30:00+07:00",
      location: { latitude: 12.6789, longitude: 108.1234 }
    };
    const results = await Promise.allSettled([
      bats.createHarvest(input, "concurrent-harvest-001"),
      bats.createHarvest(input, "concurrent-harvest-001")
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(store.batches.size).toBe(2);
    await expect(
      bats.createHarvest(input, "concurrent-harvest-001")
    ).resolves.toMatchObject({ quantityKg: 450 });
  });

  it("releases a reservation after validation fails", async () => {
    const { bats } = service();
    await bats.onModuleInit();
    const base = {
      farmPlotId: "missing",
      actorId: "FARMER-0001",
      variety: "Ri6",
      quantityKg: 450,
      eventTime: "2026-07-05T08:40:00+07:00",
      location: { latitude: 12.6789, longitude: 108.1234 }
    };
    await expect(bats.createHarvest(base, "recoverable-key-001")).rejects.toThrow(
      "Không tìm thấy vùng trồng"
    );
    await expect(
      bats.createHarvest(
        { ...base, farmPlotId: "plot-dlk-0001" },
        "recoverable-key-001"
      )
    ).resolves.toMatchObject({ quantityKg: 450 });
  });

  it("puts a mobile-created plot into pending review instead of accepting its first harvest", async () => {
    const { bats, store } = service();
    await bats.onModuleInit();
    const input = {
      id: "SR-20260705-MOBILE",
      batchId: "SR-20260705-MOBILE",
      farmPlotId: "manual-farmer-0001-vuon-tay-ninh",
      farmPlotName: "HTX Tây Ninh - Vườn thu hoạch",
      actorId: "FARMER-0001",
      variety: "Sầu riêng Ri6",
      quantityKg: 620,
      eventTime: "2026-07-05T09:00:00+07:00",
      location: { latitude: 11.315, longitude: 106.1 }
    };

    await expect(bats.createHarvest(input, "mobile-harvest-001")).rejects.toThrow();
    expect(store.plots.get("manual-farmer-0001-vuon-tay-ninh")).toMatchObject({
      farmerId: "FARMER-0001",
      province: "HTX Tây Ninh - Vườn thu hoạch",
      status: "pending"
    });
  });

  it("rejects a client batch prefix that conflicts with the registered crop", async () => {
    const { bats } = service();
    await bats.onModuleInit();
    await expect(
      bats.createHarvest({
        id: "SR-20260705-COFFEE",
        farmPlotId: "plot-dlk-0003",
        actorId: "FARMER-0001",
        variety: "Robusta Sẻ",
        quantityKg: 500,
        eventTime: "2026-07-05T09:00:00+07:00",
        location: { latitude: 12.822, longitude: 108.082 }
      })
    ).rejects.toThrow("Mã lô phải bắt đầu bằng CP-");
  });

  it("preserves collector location, evidence and device data in the transfer event", async () => {
    const { bats } = service();
    await bats.onModuleInit();
    const result = await bats.transfer(
      "SR-20260704-000001",
      {
        actorId: "COLLECTOR-0001",
        status: "collected",
        eventTime: "2026-07-05T09:00:00+07:00",
        actualWeightKg: 1240,
        location: { latitude: 12.68, longitude: 108.12 },
        evidenceHashes: ["sha256:collector-weight-slip"],
        device: { deviceId: "ZMP-COLLECTOR-0001", integrity: "trusted" }
      },
      "transfer-evidence-001",
      "COLLECTOR"
    );
    expect(result.events.at(-1)?.payload).toMatchObject({
      readPoint: { id: "geo:12.68,108.12" },
      evidence: [{ sha256: "sha256:collector-weight-slip", type: "weight-slip" }],
      device: { deviceId: "ZMP-COLLECTOR-0001" }
    });
  });

  it("enforces the actor role for each transfer step", async () => {
    const { bats } = service();
    await bats.onModuleInit();
    await expect(
      bats.transfer(
        "SR-20260704-000001",
        {
          actorId: "PACKING-1",
          status: "collected",
          eventTime: "2026-07-05T09:00:00+07:00"
        },
        "transfer-key-001",
        "PACKING"
      )
    ).rejects.toThrow("không được ghi nhận trạng thái");
  });

  it("serves only a valid matching GS1 identity and exports EPCIS 2.0", async () => {
    const { bats } = service();
    await bats.onModuleInit();
    await expect(
      bats.verifyIdentity("8930000000019", "SR-20260704-000001", "0001")
    ).resolves.toHaveProperty("batch.identity.gtin", "8930000000019");
    await expect(
      bats.verifyIdentity("8930000000018", "SR-20260704-000001", "0001")
    ).rejects.toThrow("check digit");
    expect(
      bats.epcisDocument("8930000000019", "SR-20260704-000001", "0001")
    ).toHaveProperty("schemaVersion", "2.0");
  });
});
