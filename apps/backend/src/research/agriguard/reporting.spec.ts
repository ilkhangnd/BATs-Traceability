import { describe, expect, it } from "vitest";
import { addAblationDeltas, COMMON_SUPPORT_POLICY, commonSupportDecision } from "./reporting.js";

describe("preliminary research reporting", () => {
  it("predeclares common support from semantic support without accepting detector outcomes", () => {
    expect(COMMON_SUPPORT_POLICY.id).toBe("bats-v1-supported-only-v1");
    expect(commonSupportDecision("outside_plantation", "supported", "adapter reason")).toEqual({
      included: true,
      reason: "Both engines have sufficient semantic capability for this scenario."
    });
    expect(commonSupportDecision("invalid_custody_location", "partial", "adapter reason")).toEqual({
      included: false,
      reason: "BATS v1 does not validate custody source or destination locations."
    });
    expect(commonSupportDecision("mass_over_output", "unsupported", "adapter reason").included).toBe(false);
  });

  it("computes ablation deltas against the executed Full row", () => {
    const results = addAblationDeltas([
      { configuration: "Full", f1: 1, recall: 1 },
      { configuration: "Full-M", f1: 0.8, recall: 0.75 }
    ]);
    expect(results[0]).toMatchObject({ deltaF1VsFull: 0, deltaRecallVsFull: 0 });
    expect(results[1]?.deltaF1VsFull).toBeCloseTo(-0.2);
    expect(results[1]?.deltaRecallVsFull).toBe(-0.25);
  });
});
