export type PcieRuleCode = "G" | "I" | "S" | "Y" | "M" | "C";
export type PcieSeverity = "warning" | "block";
export type CustodyState = "HARVESTED" | "RECEIVED" | "PACKED" | "SHIPPED";

export interface ResearchGeoPoint {
  latitude: number;
  longitude: number;
}

export interface PlantationIdentity {
  plantationCode: string;
  polygon: readonly ResearchGeoPoint[];
  areaHa: number;
  crop: string;
  variety: string;
  validFrom: string;
  validTo?: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface PlantationAuthorization {
  plantationCode: string;
  actorId: string;
  validFrom: string;
  validTo?: string;
  status: "ACTIVE" | "REVOKED";
}

export interface YieldPolicy {
  crop: string;
  variety?: string;
  season: string;
  maxYieldKgPerHa: number;
  tolerancePct: number;
  policyVersion: string;
}

export interface VerifiedMassInput {
  plantationCode: string;
  quantityKg: number;
}

export interface MassBalanceClaim {
  provenancePlantationCode: string;
  openingInventoryKg?: number;
  verifiedInputs: readonly VerifiedMassInput[];
  outputKg: number;
  rho: number;
  epsilonPct: number;
}

export interface CustodyTransition {
  currentState: CustodyState;
  nextState: CustodyState;
  source?: string;
  destination?: string;
}

export interface PcieEvent {
  id: string;
  eventTime: string;
  actorId: string;
  plantationCode: string;
  location?: ResearchGeoPoint;
  quantityKg?: number;
  season?: string;
  seasonTotalKg?: number;
  massBalance?: MassBalanceClaim;
  custody?: CustodyTransition;
}

export interface PcieIssue {
  code: PcieRuleCode;
  severity: PcieSeverity;
  message: string;
  observed: unknown;
  expected: unknown;
}

export interface PcieResult {
  accepted: boolean;
  riskScore: number;
  triggeredRules: PcieRuleCode[];
  issues: PcieIssue[];
  metadata: {
    ruleSet: "agriguard-pcie-preliminary-v0.1";
    disabledRules: PcieRuleCode[];
    assumptions: string[];
    massBalance?: {
      provenancePlantationCode: string;
      openingInventoryKg: number;
      verifiedInputKg: number;
      excludedOtherProvenanceKg: number;
      rho: number;
      epsilonPct: number;
      epsilonKg: number;
      maximumOutputKg: number;
    };
  };
}

export interface PcieRegistry {
  plantations: readonly PlantationIdentity[];
  authorizations: readonly PlantationAuthorization[];
  yieldPolicies: readonly YieldPolicy[];
}

export interface PcieEvaluationOptions {
  disabledRules?: ReadonlySet<PcieRuleCode>;
}

export interface ScenarioManifest {
  schemaVersion: string;
  seed: string;
  labelPolicy: string;
  scenarios: ScenarioDefinition[];
}

export interface ScenarioDefinition {
  id: string;
  scenarioClass: string;
  description: string;
  expectedFraud: boolean;
  expectedRules: PcieRuleCode[];
  events: PcieEvent[];
}
