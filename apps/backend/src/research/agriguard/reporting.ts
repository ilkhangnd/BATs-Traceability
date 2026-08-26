export type SupportClassification = "supported" | "partial" | "unsupported";

export const COMMON_SUPPORT_POLICY = {
  id: "bats-v1-supported-only-v1",
  inclusionRule: "Include a scenario only when the frozen BATS v1 adapter classifies its semantic support as supported.",
  exclusionRule: "Exclude partial and unsupported scenarios regardless of either engine's detection outcome."
} as const;

const exclusionReasons: Record<string, string> = {
  gps_boundary: "BATS v1 does not declare boundary-inclusive ST_Covers-equivalent geometry semantics.",
  authorized_actor: "BATS v1 actor ownership is not equivalent to time-bounded plantation authorization.",
  historically_valid_authorization: "BATS v1 cannot resolve plantation authorization history at eventTime.",
  plantation_valid_at_event_time: "BATS v1 cannot resolve versioned plantation status at eventTime.",
  packing_normal_loss: "BATS v1 has no provenance-scoped mass-balance model.",
  valid_mass_balance: "BATS v1 has no provenance-scoped mass-balance model.",
  valid_custody_sequence: "BATS v1 only partially projects the custody vocabulary and does not validate custody locations.",
  unauthorized_actor: "BATS v1 actor ownership is not equivalent to time-bounded plantation authorization.",
  expired_authorization: "BATS v1 cannot resolve plantation authorization history at eventTime.",
  inactive_plantation: "BATS v1 cannot resolve versioned plantation status at eventTime.",
  mass_over_output: "BATS v1 has no provenance-scoped mass-balance model.",
  wrong_provenance_substitution: "BATS v1 has no provenance-scoped mass-balance model.",
  cross_plantation_compensation: "BATS v1 has no provenance-scoped mass-balance model.",
  invalid_custody_transition: "BATS v1 only partially projects the custody vocabulary and does not validate custody locations.",
  invalid_custody_location: "BATS v1 does not validate custody source or destination locations.",
  combined_harvest_anomalies: "The authorization component is not semantically equivalent in BATS v1.",
  combined_mass_custody_anomalies: "BATS v1 lacks provenance mass balance and only partially projects custody transitions."
};

export function commonSupportDecision(
  scenarioClass: string,
  support: SupportClassification,
  adapterReason: string
): { included: boolean; reason: string } {
  if (support === "supported") {
    return { included: true, reason: "Both engines have sufficient semantic capability for this scenario." };
  }
  return { included: false, reason: exclusionReasons[scenarioClass] ?? adapterReason };
}

export function addAblationDeltas<T extends { configuration: string; f1: number; recall: number }>(
  rows: T[]
): Array<T & { deltaF1VsFull: number; deltaRecallVsFull: number }> {
  const full = rows.find((row) => row.configuration === "Full");
  if (!full) throw new Error("Ablation results must include the Full configuration.");
  return rows.map((row) => ({
    ...row,
    deltaF1VsFull: row.f1 - full.f1,
    deltaRecallVsFull: row.recall - full.recall
  }));
}
