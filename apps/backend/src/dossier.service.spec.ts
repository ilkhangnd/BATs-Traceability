import { describe, expect, it } from "vitest";
import { BatsService } from "./bats.service.js";
import { DossierService } from "./dossier.service.js";
import { MerkleService } from "./merkle.service.js";
import { StoreService } from "./store.service.js";
import { ValidationService } from "./validation.service.js";

describe("DossierService", () => {
  async function dossier() {
    const store = new StoreService();
    const bats = new BatsService(store, new ValidationService(), new MerkleService());
    await bats.onModuleInit();
    const batch = await bats.createHarvest({
      farmPlotId: "plot-dlk-0001",
      actorId: "FARMER-0001",
      variety: "Ri6",
      quantityKg: 1250,
      eventTime: "2026-07-04T08:30:00+07:00",
      location: { latitude: 12.6789, longitude: 108.1234 }
    });
    return { dossier: new DossierService(bats), batch };
  }

  it("exports CSV event rows", async () => {
    const fixture = await dossier();
    const exported = await fixture.dossier.export(
      "8930000000019",
      fixture.batch.id,
      "0001",
      "csv"
    );
    expect(exported.contentType).toContain("text/csv");
    expect(String(exported.body)).toContain("event_hash");
    expect(String(exported.body)).toContain("SR-20260704-000001");
  });

  it("exports a valid PDF envelope", async () => {
    const fixture = await dossier();
    const exported = await fixture.dossier.export(
      "8930000000019",
      fixture.batch.id,
      "0001",
      "pdf"
    );
    expect(Buffer.isBuffer(exported.body)).toBe(true);
    expect((exported.body as Buffer).subarray(0, 8).toString()).toBe("%PDF-1.4");
  });
});
