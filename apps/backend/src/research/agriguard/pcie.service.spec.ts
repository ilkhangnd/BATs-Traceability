import { describe, expect, it } from "vitest";
import { preliminaryRegistry } from "./fixtures.js";
import { PcieService } from "./pcie.service.js";
import type { PcieEvent } from "./types.js";

const service = new PcieService(preliminaryRegistry);

function event(overrides: Partial<PcieEvent> = {}): PcieEvent {
  return {
    id: "event-test",
    eventTime: "2026-07-04T08:00:00.000Z",
    actorId: "FARMER-A",
    plantationCode: "PLANT-A",
    location: { latitude: 10.5, longitude: 106.5 },
    quantityKg: 1000,
    season: "2026",
    seasonTotalKg: 0,
    ...overrides
  };
}

function rules(input: PcieEvent): string[] {
  return service.evaluate(input).triggeredRules;
}

describe("preliminary AgriGuard PcieService", () => {
  it("G accepts a point inside", () => expect(rules(event())).not.toContain("G"));
  it("G accepts a point exactly on the boundary", () =>
    expect(rules(event({ location: { latitude: 10, longitude: 106.5 } }))).not.toContain("G"));
  it("G blocks a point outside", () =>
    expect(rules(event({ location: { latitude: 9, longitude: 106.5 } }))).toContain("G"));

  it("I accepts an authorized actor", () => expect(rules(event())).not.toContain("I"));
  it("I blocks an unauthorized actor", () =>
    expect(rules(event({ actorId: "UNKNOWN" }))).toContain("I"));
  it("I blocks an expired authorization", () =>
    expect(rules(event({ actorId: "FARMER-HISTORICAL" }))).toContain("I"));
  it("I evaluates historical authorization at eventTime", () =>
    expect(rules(event({ actorId: "FARMER-HISTORICAL", eventTime: "2026-05-01T08:00:00.000Z" })))
      .not.toContain("I"));

  it("S accepts an active plantation", () => expect(rules(event())).not.toContain("S"));
  it("S blocks an inactive plantation", () =>
    expect(rules(event({ plantationCode: "PLANT-INACTIVE", actorId: "FARMER-INACTIVE",
      location: { latitude: 14.5, longitude: 108.5 } }))).toContain("S"));

  it("Y accepts a total below threshold", () =>
    expect(rules(event({ seasonTotalKg: 19_000, quantityKg: 1_000 }))).not.toContain("Y"));
  it("Y accepts a total exactly at threshold", () =>
    expect(rules(event({ seasonTotalKg: 20_000, quantityKg: 1_000 }))).not.toContain("Y"));
  it("Y blocks a total above threshold", () =>
    expect(rules(event({ seasonTotalKg: 20_001, quantityKg: 1_000 }))).toContain("Y"));

  it("M accepts output within provenance-scoped capacity", () =>
    expect(rules(event({ massBalance: { provenancePlantationCode: "PLANT-A", verifiedInputs: [
      { plantationCode: "PLANT-A", quantityKg: 1000 }
    ], outputKg: 900, rho: 0.9, epsilonPct: 0 } }))).not.toContain("M"));
  it("M blocks over-output", () =>
    expect(rules(event({ massBalance: { provenancePlantationCode: "PLANT-A", verifiedInputs: [
      { plantationCode: "PLANT-A", quantityKg: 1000 }
    ], outputKg: 901, rho: 0.9, epsilonPct: 0 } }))).toContain("M"));
  it("M excludes wrong-provenance inputs", () =>
    expect(rules(event({ massBalance: { provenancePlantationCode: "PLANT-A", verifiedInputs: [
      { plantationCode: "PLANT-B", quantityKg: 2000 }
    ], outputKg: 1, rho: 1, epsilonPct: 0 } }))).toContain("M"));

  it("C accepts the deterministic next state", () =>
    expect(rules(event({ custody: { currentState: "HARVESTED", nextState: "RECEIVED",
      source: "farm-a", destination: "collector-a" } }))).not.toContain("C"));
  it("C blocks an invalid transition", () =>
    expect(rules(event({ custody: { currentState: "HARVESTED", nextState: "PACKED",
      source: "farm-a", destination: "packing-a" } }))).toContain("C"));
  it("C blocks missing or inconsistent custody locations", () =>
    expect(rules(event({ custody: { currentState: "RECEIVED", nextState: "PACKED",
      source: "facility-a", destination: "facility-a" } }))).toContain("C"));

  it("hard-block acceptance is independent from the numeric score", () => {
    const result = service.evaluate(event({ actorId: "UNKNOWN" }));
    expect(result.riskScore).toBeLessThan(100);
    expect(result.accepted).toBe(false);
  });
});
