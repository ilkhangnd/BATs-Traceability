import type { RiskBand } from "./gs1-epcis.js";

export type RuleCode = "G" | "Y" | "D" | "T" | "R" | "W" | "A" | "S";
export type RuleSeverity = "info" | "warning" | "block";

export interface ValidationIssue {
  code: RuleCode;
  severity: RuleSeverity;
  score: number;
  message: string;
}

export interface ValidationResult {
  score: number;
  band: RiskBand;
  accepted: boolean;
  issues: ValidationIssue[];
}

export const RISK_WEIGHTS: Record<RuleCode, number> = {
  G: 40,
  Y: 30,
  D: 100,
  T: 15,
  R: 20,
  W: 30,
  A: 20,
  S: 100
};

export function riskBand(score: number): RiskBand {
  if (score <= 30) return "green";
  if (score <= 70) return "yellow";
  return "red";
}
