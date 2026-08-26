import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaService } from "./database/prisma.service.js";
import { StoreService } from "./store.service.js";

describe.runIf(process.env.RUN_DB_TESTS === "1")("PostgreSQL/PostGIS StoreService", () => {
  const prisma = new PrismaService();
  const store = new StoreService(prisma);

  beforeAll(async () => {
    process.env.BATS_STORAGE = "postgres";
    await store.ensureReady();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("hydrates seeded actors and farm plots from PostgreSQL", () => {
    expect(store.persistent).toBe(true);
    expect(store.actors.has("ADMIN-0001")).toBe(true);
    expect(store.plots.has("plot-dlk-0001")).toBe(true);
  });

  it("evaluates geofence membership with PostGIS", async () => {
    await expect(
      store.containsPoint("plot-dlk-0001", { latitude: 12.6789, longitude: 108.1234 })
    ).resolves.toBe(true);
    await expect(
      store.containsPoint("plot-dlk-0001", { latitude: 10.77, longitude: 106.69 })
    ).resolves.toBe(false);
  });

  it("calculates authoritative area and detects overlapping plots", async () => {
    const polygon = store.plots.get("plot-dlk-0001")!.polygon;
    const ownGeometry = await store.inspectPolygon(polygon, "plot-dlk-0001");
    expect(ownGeometry.valid).toBe(true);
    expect(ownGeometry.areaHa).toBeCloseTo(2.5265, 3);
    expect(ownGeometry.overlappingPlotIds).toEqual([]);

    const duplicateGeometry = await store.inspectPolygon(polygon);
    expect(duplicateGeometry.overlappingPlotIds).toContain("plot-dlk-0001");
  });

  it("claims an idempotency key atomically across concurrent calls", async () => {
    const key = `integration-${Date.now()}`;
    const record = {
      actorId: "FARMER-0001",
      endpoint: "/integration",
      requestHash: "integration-request-hash"
    };
    const results = await Promise.all([
      store.claimIdempotency(key, record),
      store.claimIdempotency(key, record)
    ]);
    expect(results.filter((result) => result.claimed)).toHaveLength(1);
    await store.releaseIdempotency(key);
  });

  it("paginates and filters from PostgreSQL instead of hydrated maps", async () => {
    const fixtureId = `integration-page-batches-${randomUUID()}`;
    const fixtureLot = `IT-${randomUUID()}`;
    const actors = [...store.actors.entries()];
    const plots = [...store.plots.entries()];
    const batches = [...store.batches.entries()];
    try {
      await prisma.batch.create({
        data: {
          id: fixtureId,
          gtin: "8930000000019",
          lot: fixtureLot,
          serial: "0001",
          farmPlotId: "plot-dlk-0001",
          farmerId: "FARMER-0001",
          crop: "durian",
          variety: "Ri6 integration fixture",
          quantityKg: 1,
          status: "harvested",
          riskScore: 0,
          riskBand: "green",
          accepted: true,
          issues: []
        }
      });
      store.actors.clear();
      store.plots.clear();
      store.batches.clear();

      const actorPage = await store.pageActors({ q: "BATS", pageSize: "1" });
      const plotPage = await store.pagePlots(
        { province: "đắk lắk", pageSize: "1" },
        true
      );
      const batchPage = await store.pageBatches({
        status: "harvested",
        q: fixtureLot,
        pageSize: "1"
      });
      expect(actorPage.items[0]?.id).toBe("ADMIN-0001");
      expect(plotPage.items[0]?.id).toBe("plot-dlk-0001");
      expect(batchPage.items).toHaveLength(1);
      expect(batchPage.items[0]).toMatchObject({
        id: fixtureId,
        identity: {
          gtin: "8930000000019",
          lot: fixtureLot,
          serial: "0001"
        },
        farmPlotId: "plot-dlk-0001",
        farmerId: "FARMER-0001",
        status: "harvested"
      });
      expect(actorPage.total).toBeGreaterThanOrEqual(1);
      expect(plotPage.total).toBeGreaterThanOrEqual(1);
      expect(batchPage.total).toBe(1);
    } finally {
      actors.forEach(([id, actor]) => store.actors.set(id, actor));
      plots.forEach(([id, plot]) => store.plots.set(id, plot));
      batches.forEach(([id, batch]) => store.batches.set(id, batch));
      await prisma.batch.deleteMany({ where: { id: fixtureId } });
    }
  });
});
