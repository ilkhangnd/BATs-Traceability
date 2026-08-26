import type {
  CustodyState,
  PcieEvaluationOptions,
  PcieEvent,
  PcieIssue,
  PcieRegistry,
  PcieResult,
  PcieRuleCode,
  PlantationAuthorization,
  PlantationIdentity,
  ResearchGeoPoint,
  YieldPolicy
} from "./types.js";

const RULE_WEIGHTS: Record<PcieRuleCode, number> = {
  G: 30,
  I: 30,
  S: 30,
  Y: 25,
  M: 35,
  C: 30
};

const NEXT_CUSTODY_STATE: Partial<Record<CustodyState, CustodyState>> = {
  HARVESTED: "RECEIVED",
  RECEIVED: "PACKED",
  PACKED: "SHIPPED"
};

function instantInRange(eventTime: string, validFrom: string, validTo?: string): boolean {
  const instant = Date.parse(eventTime);
  return Number.isFinite(instant) &&
    instant >= Date.parse(validFrom) &&
    (validTo === undefined || instant <= Date.parse(validTo));
}

function pointOnSegment(point: ResearchGeoPoint, a: ResearchGeoPoint, b: ResearchGeoPoint): boolean {
  const cross = (point.longitude - a.longitude) * (b.latitude - a.latitude) -
    (point.latitude - a.latitude) * (b.longitude - a.longitude);
  if (Math.abs(cross) > 1e-10) return false;
  return point.longitude >= Math.min(a.longitude, b.longitude) - 1e-10 &&
    point.longitude <= Math.max(a.longitude, b.longitude) + 1e-10 &&
    point.latitude >= Math.min(a.latitude, b.latitude) - 1e-10 &&
    point.latitude <= Math.max(a.latitude, b.latitude) + 1e-10;
}

export function polygonCoversPoint(
  polygon: readonly ResearchGeoPoint[],
  point: ResearchGeoPoint
): boolean {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const a = polygon[previous];
    const b = polygon[index];
    if (!a || !b) continue;
    if (pointOnSegment(point, a, b)) return true;
    const crosses = (a.latitude > point.latitude) !== (b.latitude > point.latitude) &&
      point.longitude < ((b.longitude - a.longitude) * (point.latitude - a.latitude)) /
        (b.latitude - a.latitude) + a.longitude;
    if (crosses) inside = !inside;
  }
  return inside;
}

export class PcieService {
  constructor(private readonly registry: PcieRegistry) {}

  evaluate(event: PcieEvent, options: PcieEvaluationOptions = {}): PcieResult {
    const disabled = options.disabledRules ?? new Set<PcieRuleCode>();
    const issues: PcieIssue[] = [];
    const assumptions: string[] = [];
    const identity = this.identityAt(event.plantationCode, event.eventTime);

    if (!disabled.has("G") && event.location && identity &&
      !polygonCoversPoint(identity.polygon, event.location)) {
      issues.push(this.issue("G", "Reported GPS is not covered by the registered plantation polygon.",
        event.location, { plantationCode: identity.plantationCode, relation: "ST_Covers-equivalent" }));
    }

    if (!disabled.has("I") && !this.authorizationAt(event, identity)) {
      issues.push(this.issue("I", "Actor lacks active plantation authorization at eventTime.",
        { actorId: event.actorId, plantationCode: event.plantationCode, eventTime: event.eventTime },
        "an ACTIVE authorization whose validity interval covers eventTime"));
    }

    if (!disabled.has("S") && (!identity || identity.status !== "ACTIVE")) {
      issues.push(this.issue("S", "Plantation code is not active at eventTime.",
        identity?.status ?? "NO_VALID_REGISTRY_VERSION", "ACTIVE"));
    }

    if (!disabled.has("Y") && event.quantityKg !== undefined && event.season !== undefined) {
      const policy = identity ? this.yieldPolicy(identity, event.season) : undefined;
      if (!identity || !policy) {
        issues.push(this.issue("Y", "No applicable yield policy or plantation version exists.",
          { plantationCode: event.plantationCode, season: event.season }, "versioned yield policy"));
      } else {
        const observed = (event.seasonTotalKg ?? 0) + event.quantityKg;
        const expected = identity.areaHa * policy.maxYieldKgPerHa * (1 + policy.tolerancePct);
        if (observed > expected + 1e-9) {
          issues.push(this.issue("Y", "Seasonal harvest exceeds policy capacity.",
            { seasonalTotalAfterEventKg: observed, policyVersion: policy.policyVersion },
            { maximumKg: expected, formula: "areaHa * maxYieldKgPerHa * (1 + tolerancePct)" }));
        }
      }
    }

    let massMetadata: PcieResult["metadata"]["massBalance"];
    if (!disabled.has("M") && event.massBalance) {
      const claim = event.massBalance;
      const openingInventoryKg = claim.openingInventoryKg ?? 0;
      if (claim.openingInventoryKg === undefined) {
        assumptions.push("Mass-balance openingInventoryKg is explicitly assumed to be 0.");
      }
      const verifiedInputKg = claim.verifiedInputs
        .filter((input) => input.plantationCode === claim.provenancePlantationCode)
        .reduce((sum, input) => sum + input.quantityKg, 0);
      const excludedOtherProvenanceKg = claim.verifiedInputs
        .filter((input) => input.plantationCode !== claim.provenancePlantationCode)
        .reduce((sum, input) => sum + input.quantityKg, 0);
      const baseMaximum = claim.rho * (openingInventoryKg + verifiedInputKg);
      const epsilonKg = baseMaximum * claim.epsilonPct;
      const maximumOutputKg = baseMaximum + epsilonKg;
      massMetadata = {
        provenancePlantationCode: claim.provenancePlantationCode,
        openingInventoryKg,
        verifiedInputKg,
        excludedOtherProvenanceKg,
        rho: claim.rho,
        epsilonPct: claim.epsilonPct,
        epsilonKg,
        maximumOutputKg
      };
      if (claim.provenancePlantationCode !== event.plantationCode || claim.outputKg > maximumOutputKg + 1e-9) {
        issues.push(this.issue("M", "Output exceeds provenance-scoped verified mass capacity.",
          { outputKg: claim.outputKg, eventPlantationCode: event.plantationCode, ...massMetadata },
          { provenancePlantationCode: event.plantationCode, maximumOutputKg,
            formula: "output <= rho * (openingInventory + verifiedInputOfClaimedProvenance) + epsilon" }));
      }
    }

    if (!disabled.has("C") && event.custody) {
      const transition = event.custody;
      const expectedNext = NEXT_CUSTODY_STATE[transition.currentState];
      const locationsValid = Boolean(transition.source?.trim()) &&
        Boolean(transition.destination?.trim()) && transition.source !== transition.destination;
      if (transition.nextState !== expectedNext || !locationsValid) {
        issues.push(this.issue("C", "Custody transition or source/destination is inconsistent.", transition,
          { nextState: expectedNext ?? "TERMINAL", source: "non-empty", destination: "non-empty and different" }));
      }
    }

    const triggeredRules = [...new Set(issues.map((issue) => issue.code))];
    return {
      accepted: !issues.some((issue) => issue.severity === "block"),
      riskScore: Math.min(100, triggeredRules.reduce((sum, rule) => sum + RULE_WEIGHTS[rule], 0)),
      triggeredRules,
      issues,
      metadata: {
        ruleSet: "agriguard-pcie-preliminary-v0.1",
        disabledRules: [...disabled],
        assumptions,
        ...(massMetadata ? { massBalance: massMetadata } : {})
      }
    };
  }

  private identityAt(plantationCode: string, eventTime: string): PlantationIdentity | undefined {
    return this.registry.plantations.find((identity) =>
      identity.plantationCode === plantationCode &&
      instantInRange(eventTime, identity.validFrom, identity.validTo));
  }

  private authorizationAt(event: PcieEvent, identity?: PlantationIdentity): PlantationAuthorization | undefined {
    if (!identity) return undefined;
    return this.registry.authorizations.find((authorization) =>
      authorization.plantationCode === event.plantationCode &&
      authorization.actorId === event.actorId && authorization.status === "ACTIVE" &&
      instantInRange(event.eventTime, authorization.validFrom, authorization.validTo));
  }

  private yieldPolicy(identity: PlantationIdentity, season: string): YieldPolicy | undefined {
    return this.registry.yieldPolicies.find((policy) => policy.crop === identity.crop &&
      (policy.variety === undefined || policy.variety === identity.variety) && policy.season === season);
  }

  private issue(code: PcieRuleCode, message: string, observed: unknown, expected: unknown): PcieIssue {
    return { code, severity: "block", message, observed, expected };
  }
}
