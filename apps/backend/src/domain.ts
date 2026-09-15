import type {
  BatchStatus,
  DigitalLinkIdentity,
  GeoPoint,
  RiskBand,
  TraceEvent,
  ValidationIssue
} from "@bats/shared-types";

export interface FarmPlot {
  id: string;
  farmerId: string;
  farmerName: string;
  plantingAreaCode: string;
  crop: string;
  variety: string;
  areaHa: number;
  province: string;
  district: string;
  commune: string;
  polygon: GeoPoint[];
  status: "active" | "inactive" | "pending";
}

export type ActorRole =
  | "ADMIN"
  | "COOPERATIVE"
  | "FARMER"
  | "COLLECTOR"
  | "PACKING"
  | "EXPORTER";

export interface Actor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  zaloUserId?: string;
  role: ActorRole;
  organization?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  targetType: "actor" | "farm_plot" | "auth";
  targetId: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface AnchorRecord {
  date: string;
  merkleRoot: string;
  schemaVersion: string;
  chainId?: string;
  contractAddress?: string;
  txHash?: string;
  blockNumber?: string;
  status: "pending" | "confirmed" | "failed";
  attemptCount?: number;
  lastError?: string;
  nextAttemptAt?: string;
  anchoredAt?: string;
}

export interface ActorInput {
  name: string;
  email?: string;
  phone?: string;
  zaloUserId?: string;
  role: ActorRole;
  organization?: string;
  status?: "active" | "inactive";
}

export interface FarmPlotInput {
  farmerId: string;
  farmerName: string;
  plantingAreaCode: string;
  crop?: string;
  variety: string;
  areaHa: number;
  province: string;
  district: string;
  commune: string;
  polygon: GeoPoint[];
  status?: "active" | "inactive";
}

export interface Batch {
  id: string;
  identity: DigitalLinkIdentity;
  farmPlotId: string;
  farmerId: string;
  crop: string;
  variety: string;
  quantityKg: number;
  status: BatchStatus;
  riskScore: number;
  riskBand: RiskBand;
  accepted: boolean;
  issues: ValidationIssue[];
  createdAt: string;
  events: TraceEvent[];
}

export interface CreateHarvestInput {
  id?: string;
  batchId?: string;
  farmPlotId: string;
  farmPlotName?: string;
  actorId: string;
  variety: string;
  quantityKg: number;
  eventTime: string;
  location: GeoPoint;
  evidenceHashes?: string[];
  device?: {
    deviceId?: string;
    integrity?: "trusted" | "unknown" | "compromised";
    gpsAccuracyM?: number;
    capturedAt?: string;
    appVersion?: string;
  };
}

export interface TransferInput {
  actorId: string;
  status: Exclude<BatchStatus, "harvested">;
  eventTime: string;
  actualWeightKg?: number;
  location?: GeoPoint;
  evidenceHashes?: string[];
  device?: CreateHarvestInput["device"];
}


export type MarketplaceRequestStatus = "pending" | "accepted" | "declined";

export interface MarketplaceRequest {
  id: string;
  batchId: string;
  requesterId: string;
  requesterName: string;
  requesterOrganization?: string;
  quantityKg: number;
  proposedPickupDate?: string;
  note?: string;
  status: MarketplaceRequestStatus;
  createdAt: string;
  updatedAt: string;
  responseNote?: string;
}
