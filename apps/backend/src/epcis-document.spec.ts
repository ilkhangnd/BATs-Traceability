import { describe, expect, it } from "vitest";
import { createEpcisDocument, isValidGtin } from "@bats/shared-types";

describe("GS1 EPCIS helpers", () => {
  it("validates GS1 check digits", () => {
    expect(isValidGtin("8930000000019")).toBe(true);
    expect(isValidGtin("8930000000018")).toBe(false);
  });

  it("creates an EPCIS 2.0 JSON-LD document", () => {
    const document = createEpcisDocument([
      {
        id: "event-1",
        batchId: "batch-1",
        eventType: "ObjectEvent",
        status: "harvested",
        eventTime: "2026-07-04T08:00:00+07:00",
        actorId: "farmer-1",
        payload: {
          action: "ADD",
          objects: ["urn:bats:batch:batch-1"]
        },
        eventHash: "a".repeat(64)
      }
    ]);
    expect(document.schemaVersion).toBe("2.0");
    expect(document.epcisBody.eventList[0]?.bizStep).toContain("harvesting");
    expect(document.epcisBody.eventList[0]?.eventTimeZoneOffset).toBe("+07:00");
  });
});
