import { describe, expect, it } from "vitest";
import { ValidationService, pointInPolygon } from "./validation.service.js";
import type { Actor, Batch, CreateHarvestInput, FarmPlot } from "./domain.js";

const plot: FarmPlot = {
  id: "p1",
  farmerId: "f1",
  farmerName: "Test",
  plantingAreaCode: "VN-TEST",
  crop: "durian",
  variety: "Ri6",
  areaHa: 1,
  province: "Đắk Lắk",
  district: "Krông Pắc",
  commune: "Ea Yông",
  polygon: [
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 1 },
    { latitude: 1, longitude: 1 },
    { latitude: 1, longitude: 0 }
  ],
  status: "active"
};

function input(overrides: Partial<CreateHarvestInput> = {}): CreateHarvestInput {
  return {
    farmPlotId: "p1",
    actorId: "f1",
    variety: "Ri6",
    quantityKg: 1000,
    eventTime: "2026-07-04T08:00:00+07:00",
    location: { latitude: 0.5, longitude: 0.5 },
    ...overrides
  };
}

function batch(id: string, overrides: Partial<Batch> = {}): Batch {
  return {
    id,
    identity: { gtin: "1", lot: id, serial: "1" },
    farmPlotId: "p1",
    farmerId: "f1",
    crop: "durian",
    variety: "Ri6",
    quantityKg: 1000,
    status: "harvested",
    riskScore: 0,
    riskBand: "green",
    accepted: true,
    issues: [],
    createdAt: input().eventTime,
    events: [],
    ...overrides
  };
}

const farmer: Actor = {
  id: "f1",
  name: "Farmer",
  role: "FARMER",
  status: "active",
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: "2026-07-01T00:00:00Z"
};

describe("ValidationService", () => {
  const service = new ValidationService();

  it("detects points inside and outside a farm polygon", () => {
    expect(pointInPolygon(input().location, plot.polygon)).toBe(true);
    expect(pointInPolygon({ latitude: 2, longitude: 2 }, plot.polygon)).toBe(false);
  });

  it("blocks a harvest outside the registered geofence", () => {
    const result = service.validateHarvest(
      input({ location: { latitude: 2, longitude: 2 } }),
      plot,
      new Set(),
      []
    );
    expect(result.accepted).toBe(false);
    expect(result.issues[0]?.code).toBe("G");
  });

  it("blocks reused evidence hashes", () => {
    const result = service.validateHarvest(
      input({ evidenceHashes: ["abc"] }),
      plot,
      new Set(["abc"]),
      []
    );
    expect(result.score).toBe(100);
    expect(result.issues[0]?.code).toBe("D");
  });

  it("flags yield and burst-time anomalies", () => {
    const recent = [
      batch("b1"),
      batch("b2"),
      batch("b3")
    ];
    const result = service.validateHarvest(
      input({ quantityKg: 20_001 }),
      plot,
      new Set(),
      recent,
      true,
      farmer
    );
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["Y", "T"])
    );
  });

  it("blocks an unauthorized farmer and a compromised device", () => {
    const result = service.validateHarvest(
      input({ device: { integrity: "compromised", gpsAccuracyM: 5 } }),
      plot,
      new Set(),
      [],
      true,
      { ...farmer, id: "other-farmer" }
    );
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["R", "A"])
    );
    expect(result.accepted).toBe(false);
  });

  it("flags weight differences above ten percent", () => {
    const result = service.validateTransfer(
      batch("b1"),
      {
        actorId: "collector-1",
        status: "collected",
        eventTime: "2026-07-04T09:00:00+07:00",
        actualWeightKg: 850
      }
    );
    expect(result.band).toBe("green");
    expect(result.issues[0]?.code).toBe("W");
  });
});
