import type { BatsObjectEvent, TraceEvent } from "./gs1-epcis.js";

export const EPCIS_CONTEXT =
  "https://ref.gs1.org/standards/epcis/epcis-context.jsonld";

const BIZ_STEPS: Record<string, string> = {
  harvested: "https://ref.gs1.org/cbv/BizStep-harvesting",
  collected: "https://ref.gs1.org/cbv/BizStep-collecting",
  packed: "https://ref.gs1.org/cbv/BizStep-packing",
  shipped: "https://ref.gs1.org/cbv/BizStep-shipping"
};

const DISPOSITIONS: Record<string, string> = {
  harvested: "https://ref.gs1.org/cbv/Disp-active",
  collected: "https://ref.gs1.org/cbv/Disp-in_transit",
  packed: "https://ref.gs1.org/cbv/Disp-container_closed",
  shipped: "https://ref.gs1.org/cbv/Disp-in_transit"
};

export function isValidGtin(value: string): boolean {
  if (!/^\d{8}$|^\d{12,14}$/.test(value)) return false;
  let sum = 0;
  let position = 0;
  for (let index = value.length - 2; index >= 0; index -= 1) {
    sum += Number(value[index]) * (position % 2 === 0 ? 3 : 1);
    position += 1;
  }
  return (10 - (sum % 10)) % 10 === Number(value.at(-1));
}

function timezoneOffset(eventTime: string): string {
  const match = eventTime.match(/([+-]\d{2}:\d{2}|Z)$/);
  return match?.[1] === "Z" || !match?.[1] ? "+00:00" : match[1];
}

export function createEpcisDocument(events: TraceEvent[]) {
  return {
    "@context": [
      EPCIS_CONTEXT,
      {
        bats: "https://bats.vn/vocab/",
        evidence: "bats:evidence",
        risk: "bats:risk"
      }
    ],
    type: "EPCISDocument",
    schemaVersion: "2.0",
    creationDate: new Date().toISOString(),
    epcisBody: {
      eventList: events.map((event) => {
        const payload = event.payload as Partial<BatsObjectEvent> & Record<string, unknown>;
        return {
          type: "ObjectEvent",
          eventID: `urn:uuid:${event.id}`,
          eventTime: event.eventTime,
          eventTimeZoneOffset: timezoneOffset(event.eventTime),
          action: payload.action ?? "OBSERVE",
          bizStep: BIZ_STEPS[event.status],
          disposition: DISPOSITIONS[event.status],
          readPoint: payload.readPoint,
          bizLocation: payload.bizLocation,
          epcList: payload.objects ?? [`urn:bats:batch:${event.batchId}`],
          ...(payload.ilmd ? { ilmd: payload.ilmd } : {}),
          "bats:actorId": event.actorId,
          "bats:eventHash": event.eventHash,
          ...(payload.evidence ? { "bats:evidence": payload.evidence } : {}),
          ...(payload.device ? { "bats:device": payload.device } : {})
        };
      })
    }
  };
}
