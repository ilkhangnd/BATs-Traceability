export type EpcisEventType =
  | "ObjectEvent"
  | "AggregationEvent"
  | "TransformationEvent"
  | "AssociationEvent";

export type BatchStatus = "harvested" | "collected" | "packed" | "shipped";
export type RiskBand = "green" | "yellow" | "red";

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface EvidenceRef {
  type: "photo" | "weight-slip" | "certificate" | "other";
  sha256: string;
  storageRef: string;
}

export interface BatsObjectEvent {
  eventType: "ObjectEvent";
  eventTime: string;
  action: "ADD" | "OBSERVE" | "DELETE";
  bizStep: "harvesting" | "collecting" | "packing" | "shipping";
  disposition: "active" | "in_transit" | "packed" | "shipped";
  readPoint: { id: string };
  bizLocation: { id: string };
  objects: string[];
  ilmd: {
    crop: string;
    variety: "Ri6" | "Monthong" | string;
    quantityKg: number;
    plantingAreaCode: string;
    farmerId: string;
  };
  evidence: EvidenceRef[];
  device?: {
    deviceId?: string;
    integrity?: "trusted" | "unknown" | "compromised";
    gpsAccuracyM?: number;
    capturedAt?: string;
    appVersion?: string;
  };
}

export interface TraceEvent<T = unknown> {
  id: string;
  batchId: string;
  eventType: EpcisEventType;
  status: BatchStatus;
  eventTime: string;
  actorId: string;
  payload: T;
  eventHash: string;
}

export interface DigitalLinkIdentity {
  gtin: string;
  lot: string;
  serial: string;
}

export function digitalLinkPath(value: DigitalLinkIdentity): string {
  return `/01/${encodeURIComponent(value.gtin)}/10/${encodeURIComponent(value.lot)}/21/${encodeURIComponent(value.serial)}`;
}
