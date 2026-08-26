import type { Actor, Batch, FarmPlot } from "../../domain.js";
import { ValidationService } from "../../validation.service.js";
import type { ScenarioDefinition } from "./types.js";
import { preliminaryRegistry } from "./fixtures.js";

export interface BaselineEvaluation {
  accepted: boolean;
  predictedFraud: boolean;
  triggeredRules: string[];
  support: "supported" | "partial" | "unsupported";
  supportReason: string;
}

const unsupportedClasses = new Set([
  "historically_valid_authorization",
  "plantation_valid_at_event_time",
  "expired_authorization",
  "inactive_plantation",
  "packing_normal_loss",
  "valid_mass_balance",
  "mass_over_output",
  "wrong_provenance_substitution",
  "cross_plantation_compensation"
]);

const custodyStateToBatsStatus = {
  HARVESTED: "harvested",
  RECEIVED: "collected",
  PACKED: "packed",
  SHIPPED: "shipped"
} as const;

export function expectedBaselineRules(scenario: ScenarioDefinition): string[] {
  const rules: string[] = [];
  if (scenario.expectedRules.includes("G")) rules.push("G");
  if (scenario.expectedRules.includes("Y")) rules.push("Y");
  if (scenario.scenarioClass === "unauthorized_actor" ||
    scenario.scenarioClass === "combined_harvest_anomalies") rules.push("R");
  if (scenario.scenarioClass === "invalid_custody_transition" ||
    scenario.scenarioClass === "combined_mass_custody_anomalies") rules.push("T");
  return rules;
}

export function evaluateBatsV1(
  service: ValidationService,
  scenario: ScenarioDefinition
): BaselineEvaluation {
  if (unsupportedClasses.has(scenario.scenarioClass)) {
    return {
      accepted: true,
      predictedFraud: false,
      triggeredRules: [],
      support: "unsupported",
      supportReason: "BATS v1 has no event-time plantation version/authorization or provenance mass model for this class."
    };
  }

  const triggered = new Set<string>();
  let evaluated = 0;
  let partial = false;
  for (const event of scenario.events) {
    if (event.location || event.quantityKg !== undefined) {
      const identity = preliminaryRegistry.plantations.find((item) =>
        item.plantationCode === event.plantationCode);
      if (!identity) continue;
      const plot: FarmPlot = {
        id: identity.plantationCode,
        farmerId: "FARMER-A",
        farmerName: "Synthetic baseline farmer",
        plantingAreaCode: identity.plantationCode,
        crop: identity.crop,
        variety: identity.variety,
        areaHa: identity.areaHa,
        province: "Synthetic",
        district: "Synthetic",
        commune: "Synthetic",
        polygon: identity.polygon.map((point) => ({ ...point })),
        status: identity.status === "ACTIVE" ? "active" : "inactive"
      };
      const actor: Actor = {
        id: event.actorId,
        name: "Synthetic baseline actor",
        role: "FARMER",
        status: "active",
        createdAt: event.eventTime,
        updatedAt: event.eventTime
      };
      const recent: Batch[] = event.seasonTotalKg && event.seasonTotalKg > 0
        ? [baselineBatch(`prior-${event.id}`, plot, event.seasonTotalKg, event.eventTime)]
        : [];
      const result = service.validateHarvest({
        farmPlotId: plot.id,
        actorId: event.actorId,
        variety: identity.variety,
        quantityKg: event.quantityKg ?? 0,
        eventTime: event.eventTime,
        location: event.location ?? identity.polygon[0]!
      }, plot, new Set(), recent, undefined, actor);
      result.issues.forEach((issue) => triggered.add(issue.code));
      evaluated += 1;
      if (scenario.expectedRules.includes("I") || scenario.scenarioClass === "authorized_actor" ||
        scenario.scenarioClass === "gps_boundary") partial = true;
    }

    if (event.custody) {
      const result = service.validateTransfer(
        baselineBatch(`custody-${event.id}`, undefined, 1000, event.eventTime,
          custodyStateToBatsStatus[event.custody.currentState]),
        {
          actorId: event.actorId,
          status: custodyStateToBatsStatus[event.custody.nextState] as Exclude<Batch["status"], "harvested">,
          eventTime: event.eventTime,
          actualWeightKg: 1000
        }
      );
      result.issues.forEach((issue) => triggered.add(issue.code));
      evaluated += 1;
      partial = true;
    } else if (event.massBalance) {
      partial = true;
    }
  }

  const triggeredRules = [...triggered];
  return {
    accepted: triggeredRules.length === 0,
    predictedFraud: triggeredRules.length > 0,
    triggeredRules,
    support: evaluated === 0 ? "unsupported" : partial ? "partial" : "supported",
    supportReason: evaluated === 0
      ? "No BATS v1 event model represents this scenario."
      : partial
        ? "Only BATS v1 actor ownership or transition ordering is representable; RECEIVED is explicitly mapped to v1 collected, while time validity, provenance, and locations are unsupported."
        : "Scenario is representable by the frozen BATS v1 harvest/transfer model."
  };
}

function baselineBatch(
  id: string,
  plot?: FarmPlot,
  quantityKg = 1000,
  createdAt = "2026-07-01T00:00:00.000Z",
  status: Batch["status"] = "harvested"
): Batch {
  return {
    id,
    identity: { gtin: "8930000000019", lot: id, serial: "0001" },
    farmPlotId: plot?.id ?? "PLANT-A",
    farmerId: plot?.farmerId ?? "FARMER-A",
    crop: plot?.crop ?? "durian",
    variety: plot?.variety ?? "Ri6",
    quantityKg,
    status,
    riskScore: 0,
    riskBand: "green",
    accepted: true,
    issues: [],
    createdAt,
    events: []
  };
}
