import { Inject, Injectable, OnModuleInit, Optional } from "@nestjs/common";
import { Prisma, type Actor as DbActor } from "@prisma/client";
import type {
  Actor,
  AnchorRecord,
  AuditLog,
  Batch,
  FarmPlot
} from "./domain.js";
import type { TraceEvent, ValidationIssue } from "@bats/shared-types";
import type { GeoPoint } from "@bats/shared-types";
import { PrismaService } from "./database/prisma.service.js";
import { validatePolygonShape } from "./polygon.js";
import {
  containsText,
  paginate,
  pageWindow,
  type PageQuery,
  type PageResult
} from "./pagination.js";

const seedPlots: FarmPlot[] = [
  {
    id: "plot-dlk-0001",
    farmerId: "FARMER-0001",
    farmerName: "Nguyễn Văn Minh",
    plantingAreaCode: "VN-DLK-PA-0001",
    crop: "durian",
    variety: "Ri6",
    areaHa: 2.5265,
    province: "Đắk Lắk",
    district: "Krông Pắc",
    commune: "Ea Yông",
    polygon: [
      { latitude: 12.678175, longitude: 108.122675 },
      { latitude: 12.678175, longitude: 108.124125 },
      { latitude: 12.679625, longitude: 108.124125 },
      { latitude: 12.679625, longitude: 108.122675 }
    ],
    status: "active"
  },
  {
    id: "plot-tg-0002",
    farmerId: "FARMER-0001",
    farmerName: "Trần Thị Mai",
    plantingAreaCode: "VN-TG-PA-0002",
    crop: "mango",
    variety: "Cát Hòa Lộc",
    areaHa: 3.2000,
    province: "Tiền Giang",
    district: "Cái Bè",
    commune: "Hòa Hưng",
    polygon: [
      { latitude: 10.3341, longitude: 105.8921 },
      { latitude: 10.3341, longitude: 105.8945 },
      { latitude: 10.3365, longitude: 105.8945 },
      { latitude: 10.3365, longitude: 105.8921 }
    ],
    status: "active"
  },
  {
    id: "plot-dlk-0003",
    farmerId: "FARMER-0001",
    farmerName: "Lê Hoàng Nam",
    plantingAreaCode: "VN-DLK-PA-0003",
    crop: "coffee",
    variety: "Robusta Sẻ",
    areaHa: 4.8000,
    province: "Đắk Lắk",
    district: "Cư M'gar",
    commune: "Quảng Phú",
    polygon: [
      { latitude: 12.8211, longitude: 108.0812 },
      { latitude: 12.8211, longitude: 108.0835 },
      { latitude: 12.8235, longitude: 108.0835 },
      { latitude: 12.8235, longitude: 108.0812 }
    ],
    status: "active"
  },
  {
    id: "plot-bth-0004",
    farmerId: "FARMER-0001",
    farmerName: "Phạm Văn Tuấn",
    plantingAreaCode: "VN-BTH-PA-0004",
    crop: "dragon_fruit",
    variety: "Ruột Đỏ LĐ1",
    areaHa: 1.8500,
    province: "Bình Thuận",
    district: "Hàm Thuận Nam",
    commune: "Hàm Mỹ",
    polygon: [
      { latitude: 10.8912, longitude: 108.0123 },
      { latitude: 10.8912, longitude: 108.0145 },
      { latitude: 10.8935, longitude: 108.0145 },
      { latitude: 10.8935, longitude: 108.0123 }
    ],
    status: "active"
  },
  {
    id: "plot-btr-0005",
    farmerId: "FARMER-0001",
    farmerName: "Nguyễn Hữu Thọ",
    plantingAreaCode: "VN-BTR-PA-0005",
    crop: "pomelo",
    variety: "Da Xanh Phúc Lộc",
    areaHa: 2.1000,
    province: "Bến Tre",
    district: "Châu Thành",
    commune: "An Khánh",
    polygon: [
      { latitude: 10.2812, longitude: 106.3312 },
      { latitude: 10.2812, longitude: 106.3335 },
      { latitude: 10.2835, longitude: 106.3335 },
      { latitude: 10.2835, longitude: 106.3312 }
    ],
    status: "active"
  },
  {
    id: "plot-hy-0006",
    farmerId: "FARMER-0001",
    farmerName: "Bùi Văn Long",
    plantingAreaCode: "VN-HY-PA-0006",
    crop: "longan",
    variety: "Hương Chi Đặc Sản",
    areaHa: 2.8500,
    province: "Hưng Yên",
    district: "Khoái Châu",
    commune: "Hàm Tử",
    polygon: [
      { latitude: 20.8210, longitude: 105.9810 },
      { latitude: 20.8210, longitude: 105.9835 },
      { latitude: 20.8235, longitude: 105.9835 },
      { latitude: 20.8235, longitude: 105.9810 }
    ],
    status: "active"
  },
  {
    id: "plot-ld-0007",
    farmerId: "FARMER-0001",
    farmerName: "Trần Đình Phúc",
    plantingAreaCode: "VN-LD-PA-0007",
    crop: "avocado",
    variety: "Bơ Sáp 034",
    areaHa: 3.5000,
    province: "Lâm Đồng",
    district: "Bảo Lộc",
    commune: "Lộc Nga",
    polygon: [
      { latitude: 11.5460, longitude: 107.8210 },
      { latitude: 11.5460, longitude: 107.8235 },
      { latitude: 11.5485, longitude: 107.8235 },
      { latitude: 11.5485, longitude: 107.8210 }
    ],
    status: "active"
  },
  {
    id: "plot-bd-0008",
    farmerId: "FARMER-0001",
    farmerName: "Nguyễn Thị Ngọc",
    plantingAreaCode: "VN-BD-PA-0008",
    crop: "mangosteen",
    variety: "Lái Thiêu Đặc Sản",
    areaHa: 1.9500,
    province: "Bình Dương",
    district: "Thuận An",
    commune: "An Thạnh",
    polygon: [
      { latitude: 10.9210, longitude: 106.6810 },
      { latitude: 10.9210, longitude: 106.6835 },
      { latitude: 10.9235, longitude: 106.6835 },
      { latitude: 10.9235, longitude: 106.6810 }
    ],
    status: "active"
  }
];

interface PlotRow {
  id: string;
  farmer_id: string;
  farmer_name: string;
  planting_area_code: string;
  crop: string;
  variety: string;
  area_ha: Prisma.Decimal;
  province: string;
  district: string;
  commune: string;
  polygon_geojson: { coordinates?: number[][][] };
  status: string;
}

type BatchWithEvents = Prisma.BatchGetPayload<{
  include: { events: { orderBy: { eventTime: "asc" } } };
}>;

export interface BatchPageQuery extends PageQuery {
  status?: string;
  riskBand?: string;
}

export interface PlotPageQuery extends PageQuery {
  status?: string;
  province?: string;
  district?: string;
}

export interface ActorPageQuery extends PageQuery {
  role?: string;
  status?: string;
}

export interface AuditPageQuery extends PageQuery {
  action?: string;
  targetType?: string;
}

export interface StoredIdempotency {
  actorId: string;
  endpoint: string;
  requestHash: string;
  status: "processing" | "completed";
  responseBody?: unknown;
  expiresAt: string;
}

interface EvidenceUpload {
  sha256: string;
  type: string;
  storageRef: string;
  mimeType: string;
  sizeBytes: number;
  actorId: string;
}

export interface PolygonInspection {
  valid: boolean;
  reason?: string;
  areaHa?: number;
  overlappingPlotIds: string[];
}

function actorFromDb(actor: DbActor): Actor {
  return {
    id: actor.id,
    name: actor.name,
    email: actor.email ?? undefined,
    phone: actor.phone ?? undefined,
    zaloUserId: actor.zaloUserId ?? undefined,
    role: actor.role as Actor["role"],
    organization: actor.organization ?? undefined,
    status: actor.status as Actor["status"],
    createdAt: actor.createdAt.toISOString(),
    updatedAt: actor.updatedAt.toISOString()
  };
}

function batchFromDb(batch: BatchWithEvents): Batch {
  return {
    id: batch.id,
    identity: { gtin: batch.gtin, lot: batch.lot, serial: batch.serial },
    farmPlotId: batch.farmPlotId,
    farmerId: batch.farmerId,
    crop: batch.crop || "durian",
    variety: batch.variety,
    quantityKg: Number(batch.quantityKg),
    status: batch.status as Batch["status"],
    riskScore: batch.riskScore,
    riskBand: batch.riskBand as Batch["riskBand"],
    accepted: batch.accepted,
    issues: batch.issues as unknown as ValidationIssue[],
    createdAt: batch.createdAt.toISOString(),
    events: batch.events.map((event) => ({
      id: event.id,
      batchId: event.batchId,
      eventType: event.eventType,
      status: event.status,
      eventTime: event.eventTime.toISOString(),
      actorId: event.actorId,
      payload: event.payload,
      eventHash: event.eventHash
    })) as TraceEvent[]
  };
}

function auditFromDb(log: {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: Date;
  metadata: Prisma.JsonValue | null;
}): AuditLog {
  return {
    id: log.id,
    actorId: log.actorId,
    action: log.action,
    targetType: log.targetType as AuditLog["targetType"],
    targetId: log.targetId,
    createdAt: log.createdAt.toISOString(),
    metadata: log.metadata as Record<string, unknown> | undefined
  };
}

@Injectable()
export class StoreService implements OnModuleInit {
  readonly plots = new Map<string, FarmPlot>(seedPlots.map((plot) => [plot.id, plot]));
  readonly batches = new Map<string, Batch>();
  readonly actors = new Map<string, Actor>([
    [
      "ADMIN-0001",
      {
        id: "ADMIN-0001",
        name: "BATS Administrator",
        email: process.env.ADMIN_EMAIL ?? "admin@bats.vn",
        role: "ADMIN",
        organization: "BATS",
        status: "active",
        createdAt: "2026-07-04T00:00:00.000Z",
        updatedAt: "2026-07-04T00:00:00.000Z"
      }
    ],
    [
      "FARMER-0001",
      {
        id: "FARMER-0001",
        name: "Nguyễn Văn Minh",
        phone: "0900000001",
        role: "FARMER",
        organization: "HTX Ea Yông",
        status: "active",
        createdAt: "2026-07-04T00:00:00.000Z",
        updatedAt: "2026-07-04T00:00:00.000Z"
      }
    ]
  ]);
  readonly auditLogs: AuditLog[] = [];
  readonly evidenceHashes = new Set<string>();
  readonly idempotencyKeys = new Map<string, StoredIdempotency>();
  readonly anchors = new Map<string, AnchorRecord>();
  private initialization?: Promise<void>;
  private memoryBatchSequence = 0;

  constructor(
    @Optional() @Inject(PrismaService) private readonly prisma?: PrismaService
  ) {}

  get persistent(): boolean {
    return process.env.BATS_STORAGE === "postgres" && Boolean(this.prisma);
  }

  onModuleInit(): Promise<void> {
    return this.ensureReady();
  }

  ensureReady(): Promise<void> {
    this.initialization ??= this.persistent ? this.hydrate() : Promise.resolve();
    return this.initialization;
  }

  listPlots(): FarmPlot[] {
    return [...this.plots.values()].filter((plot) => plot.status === "active");
  }

  listAllPlots(): FarmPlot[] {
    return [...this.plots.values()];
  }

  listBatches(): Batch[] {
    return [...this.batches.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async pageBatches(query: BatchPageQuery): Promise<PageResult<Batch>> {
    if (!this.persistent) {
      const items = this.listBatches().filter(
        (batch) =>
          (!query.status || batch.status === query.status) &&
          (!query.riskBand || batch.riskBand === query.riskBand) &&
          containsText(
            query.q,
            batch.id,
            batch.identity.gtin,
            batch.identity.lot,
            batch.variety,
            batch.status,
            batch.riskBand
          )
      );
      return paginate(items, query);
    }
    const { page, pageSize, skip } = pageWindow(query);
    const where: Prisma.BatchWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.riskBand ? { riskBand: query.riskBand } : {}),
      ...(query.q
        ? {
            OR: ["id", "gtin", "lot", "variety", "status", "riskBand"].map((field) => ({
              [field]: { contains: query.q, mode: "insensitive" }
            }))
          }
        : {})
    };
    const [total, rows] = await this.prisma!.$transaction([
      this.prisma!.batch.count({ where }),
      this.prisma!.batch.findMany({
        where,
        include: { events: { orderBy: { eventTime: "asc" } } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take: pageSize
      })
    ]);
    return {
      items: rows.map(batchFromDb),
      page,
      pageSize,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / pageSize)
    };
  }

  async pagePlots(
    query: PlotPageQuery,
    activeOnly = false
  ): Promise<PageResult<FarmPlot>> {
    if (!this.persistent) {
      const source = activeOnly ? this.listPlots() : this.listAllPlots();
      const province = query.province?.trim().toLocaleLowerCase("vi");
      const district = query.district?.trim().toLocaleLowerCase("vi");
      const items = source.filter(
        (plot) =>
          (!query.status || plot.status === query.status) &&
          (!province || plot.province.toLocaleLowerCase("vi") === province) &&
          (!district || plot.district.toLocaleLowerCase("vi") === district) &&
          containsText(
            query.q,
            plot.id,
            plot.plantingAreaCode,
            plot.farmerName,
            plot.variety,
            plot.province,
            plot.district,
            plot.commune
          )
      );
      return paginate(items, query);
    }
    const { page, pageSize, skip } = pageWindow(query);
    const where: Prisma.FarmPlotWhereInput = {
      ...(activeOnly ? { status: "active" } : query.status ? { status: query.status } : {}),
      ...(query.province
        ? { province: { equals: query.province.trim(), mode: "insensitive" } }
        : {}),
      ...(query.district
        ? { district: { equals: query.district.trim(), mode: "insensitive" } }
        : {}),
      ...(query.q
        ? {
            OR: [
              "id",
              "plantingAreaCode",
              "farmerName",
              "variety",
              "province",
              "district",
              "commune"
            ].map((field) => ({ [field]: { contains: query.q, mode: "insensitive" } }))
          }
        : {})
    };
    const select = {
      id: true,
      farmerId: true,
      farmerName: true,
      plantingAreaCode: true,
      crop: true,
      variety: true,
      areaHa: true,
      province: true,
      district: true,
      commune: true,
      polygonGeoJson: true,
      status: true
    } as const;
    const [total, rows] = await this.prisma!.$transaction([
      this.prisma!.farmPlot.count({ where }),
      this.prisma!.farmPlot.findMany({
        where,
        select,
        orderBy: [{ plantingAreaCode: "asc" }, { id: "asc" }],
        skip,
        take: pageSize
      })
    ]);
    return {
      items: rows.map((row) => {
        const geoJson = row.polygonGeoJson as unknown as { coordinates?: number[][][] };
        const ring = geoJson.coordinates?.[0] ?? [];
        return {
          id: row.id,
          farmerId: row.farmerId,
          farmerName: row.farmerName,
          plantingAreaCode: row.plantingAreaCode,
          crop: row.crop || "durian",
          variety: row.variety,
          areaHa: Number(row.areaHa),
          province: row.province,
          district: row.district,
          commune: row.commune,
          polygon: ring
            .slice(0, -1)
            .map(([longitude = 0, latitude = 0]) => ({ latitude, longitude })),
          status: row.status as FarmPlot["status"]
        };
      }),
      page,
      pageSize,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / pageSize)
    };
  }

  async pageActors(query: ActorPageQuery): Promise<PageResult<Actor>> {
    if (!this.persistent) {
      const items = [...this.actors.values()]
        .filter(
          (actor) =>
            (!query.role || actor.role === query.role) &&
            (!query.status || actor.status === query.status) &&
            containsText(
              query.q,
              actor.id,
              actor.name,
              actor.email,
              actor.phone,
              actor.organization,
              actor.zaloUserId
            )
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return paginate(items, query);
    }
    const { page, pageSize, skip } = pageWindow(query);
    const where: Prisma.ActorWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: ["id", "name", "email", "phone", "organization", "zaloUserId"].map(
              (field) => ({ [field]: { contains: query.q, mode: "insensitive" } })
            )
          }
        : {})
    };
    const [total, rows] = await this.prisma!.$transaction([
      this.prisma!.actor.count({ where }),
      this.prisma!.actor.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip,
        take: pageSize
      })
    ]);
    return {
      items: rows.map(actorFromDb),
      page,
      pageSize,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / pageSize)
    };
  }

  async pageAuditLogs(query: AuditPageQuery): Promise<PageResult<AuditLog>> {
    if (!this.persistent) {
      const items = [...this.auditLogs]
        .reverse()
        .filter(
          (log) =>
            (!query.action || log.action === query.action) &&
            (!query.targetType || log.targetType === query.targetType) &&
            containsText(query.q, log.actorId, log.action, log.targetType, log.targetId)
        );
      return paginate(items, query);
    }
    const { page, pageSize, skip } = pageWindow(query);
    const where: Prisma.AuditLogWhereInput = {
      ...(query.action ? { action: query.action } : {}),
      ...(query.targetType ? { targetType: query.targetType } : {}),
      ...(query.q
        ? {
            OR: ["actorId", "action", "targetType", "targetId"].map((field) => ({
              [field]: { contains: query.q, mode: "insensitive" }
            }))
          }
        : {})
    };
    const [total, rows] = await this.prisma!.$transaction([
      this.prisma!.auditLog.count({ where }),
      this.prisma!.auditLog.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take: pageSize
      })
    ]);
    return {
      items: rows.map(auditFromDb),
      page,
      pageSize,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / pageSize)
    };
  }

  async nextBatchSequence(): Promise<number> {
    if (!this.persistent) {
      this.memoryBatchSequence = Math.max(this.memoryBatchSequence, this.batches.size) + 1;
      return this.memoryBatchSequence;
    }
    const rows = await this.prisma!.$queryRaw<Array<{ value: bigint }>>`
      SELECT nextval('bats_batch_sequence') AS value
    `;
    return Number(rows[0]?.value ?? 1n);
  }

  async containsPoint(plotId: string, point: GeoPoint): Promise<boolean | undefined> {
    if (!this.persistent) return undefined;
    const rows = await this.prisma!.$queryRaw<Array<{ contains: boolean }>>`
      SELECT ST_Covers(
        polygon,
        ST_SetSRID(ST_Point(${point.longitude}, ${point.latitude}), 4326)
      ) AS contains
      FROM farm_plots
      WHERE id = ${plotId}
    `;
    return rows[0]?.contains ?? false;
  }

  async inspectPolygon(
    polygon: GeoPoint[],
    excludePlotId?: string
  ): Promise<PolygonInspection> {
    const reason = validatePolygonShape(polygon);
    if (reason) return { valid: false, reason, overlappingPlotIds: [] };
    if (!this.persistent) return { valid: true, overlappingPlotIds: [] };
    const ring = polygon.map((point) => [point.longitude, point.latitude]);
    ring.push([ring[0]![0]!, ring[0]![1]!]);
    const geoJson = JSON.stringify({ type: "Polygon", coordinates: [ring] });
    const rows = await this.prisma!.$queryRaw<
      Array<{ valid: boolean; reason: string; area_ha: number; overlapping_ids: string[] }>
    >`
      WITH candidate AS (
        SELECT ST_SetSRID(ST_GeomFromGeoJSON(${geoJson}), 4326) AS geom
      )
      SELECT
        ST_IsValid(geom) AS valid,
        ST_IsValidReason(geom) AS reason,
        ST_Area(geom::geography) / 10000.0 AS area_ha,
        ARRAY(
          SELECT plot.id
          FROM farm_plots plot
          WHERE plot.status = 'active'
            AND plot.id <> ${excludePlotId ?? ""}
            AND ST_Area(ST_Intersection(plot.polygon, geom)::geography) > 1.0
        ) AS overlapping_ids
      FROM candidate
    `;
    const result = rows[0];
    return {
      valid: result?.valid ?? false,
      reason: result?.valid ? undefined : result?.reason,
      areaHa: result ? Number(result.area_ha) : undefined,
      overlappingPlotIds: result?.overlapping_ids ?? []
    };
  }

  async saveActor(actor: Actor): Promise<void> {
    this.actors.set(actor.id, actor);
    if (!this.persistent) return;
    await this.prisma!.actor.upsert({
      where: { id: actor.id },
      update: {
        name: actor.name,
        email: actor.email,
        phone: actor.phone,
        zaloUserId: actor.zaloUserId,
        role: actor.role,
        organization: actor.organization,
        status: actor.status
      },
      create: {
        id: actor.id,
        name: actor.name,
        email: actor.email,
        phone: actor.phone,
        zaloUserId: actor.zaloUserId,
        role: actor.role,
        organization: actor.organization,
        status: actor.status,
        createdAt: new Date(actor.createdAt),
        updatedAt: new Date(actor.updatedAt)
      }
    });
  }

  async savePlot(plot: FarmPlot): Promise<void> {
    this.plots.set(plot.id, plot);
    if (!this.persistent) return;
    const ring = plot.polygon.map((point) => [point.longitude, point.latitude]);
    if (ring.length && (ring[0]?.[0] !== ring.at(-1)?.[0] || ring[0]?.[1] !== ring.at(-1)?.[1])) {
      ring.push([ring[0]![0]!, ring[0]![1]!]);
    }
    const geoJson = { type: "Polygon", coordinates: [ring] };
    await this.prisma!.$executeRaw`
      INSERT INTO farm_plots (
        id, farmer_id, farmer_name, planting_area_code, crop, variety, area_ha,
        province, district, commune, polygon_geojson, polygon, status
      )
      VALUES (
        ${plot.id}, ${plot.farmerId}, ${plot.farmerName}, ${plot.plantingAreaCode},
        ${plot.crop}, ${plot.variety}, ${plot.areaHa}, ${plot.province}, ${plot.district},
        ${plot.commune}, ${JSON.stringify(geoJson)}::jsonb,
        ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geoJson)}), 4326), ${plot.status}
      )
      ON CONFLICT (id) DO UPDATE SET
        farmer_id=EXCLUDED.farmer_id, farmer_name=EXCLUDED.farmer_name,
        planting_area_code=EXCLUDED.planting_area_code, crop=EXCLUDED.crop,
        variety=EXCLUDED.variety, area_ha=EXCLUDED.area_ha, province=EXCLUDED.province,
        district=EXCLUDED.district, commune=EXCLUDED.commune,
        polygon_geojson=EXCLUDED.polygon_geojson, polygon=EXCLUDED.polygon,
        status=EXCLUDED.status, updated_at=now()
    `;
  }

  async saveBatch(batch: Batch, recordValidation = false): Promise<void> {
    if (!this.persistent) {
      this.batches.set(batch.id, batch);
      return;
    }
    await this.prisma!.$transaction(async (tx) => {
      await tx.batch.upsert({
        where: { id: batch.id },
        update: {
          status: batch.status,
          riskScore: batch.riskScore,
          riskBand: batch.riskBand,
          accepted: batch.accepted,
          issues: batch.issues as unknown as Prisma.InputJsonValue,
          updatedAt: new Date()
        },
        create: {
          id: batch.id,
          gtin: batch.identity.gtin,
          lot: batch.identity.lot,
          serial: batch.identity.serial,
          farmPlotId: batch.farmPlotId,
          farmerId: batch.farmerId,
          crop: batch.crop,
          variety: batch.variety,
          quantityKg: batch.quantityKg,
          status: batch.status,
          riskScore: batch.riskScore,
          riskBand: batch.riskBand,
          accepted: batch.accepted,
          issues: batch.issues as unknown as Prisma.InputJsonValue,
          createdAt: new Date(batch.createdAt)
        }
      });
      for (const event of batch.events) {
        await tx.epcisEvent.upsert({
          where: { id: event.id },
          update: {
            status: event.status,
            payload: event.payload as Prisma.InputJsonValue,
            eventHash: event.eventHash
          },
          create: {
            id: event.id,
            batchId: batch.id,
            eventType: event.eventType,
            status: event.status,
            eventTime: new Date(event.eventTime),
            actorId: event.actorId,
            payload: event.payload as Prisma.InputJsonValue,
            eventHash: event.eventHash
          }
        });
        const evidence = (event.payload as { evidence?: Array<{ type: string; sha256: string; storageRef: string }> }).evidence ?? [];
        for (const item of evidence) {
          await tx.evidenceFile.upsert({
            where: { sha256: item.sha256 },
            update: { eventId: event.id },
            create: {
              eventId: event.id,
              sha256: item.sha256,
              type: item.type,
              storageRef: item.storageRef
            }
          });
        }
      }
      if (recordValidation) {
        await tx.validationResult.create({
          data: {
            batchId: batch.id,
            eventId: batch.events[0]?.id,
            score: batch.riskScore,
            band: batch.riskBand,
            accepted: batch.accepted,
            issues: batch.issues as unknown as Prisma.InputJsonValue,
            ruleSet: "bats-risk-v1"
          }
        });
      }
    });
    this.batches.set(batch.id, batch);
  }

  async saveAudit(log: AuditLog): Promise<void> {
    this.auditLogs.push(log);
    if (!this.persistent) return;
    await this.prisma!.auditLog.create({
      data: {
        id: log.id,
        actorId: log.actorId,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        metadata: log.metadata as Prisma.InputJsonValue | undefined,
        createdAt: new Date(log.createdAt)
      }
    });
  }

  async saveEvidenceUpload(upload: EvidenceUpload): Promise<void> {
    if (!this.persistent) return;
    await this.prisma!.evidenceFile.upsert({
      where: { sha256: upload.sha256 },
      update: {
        storageRef: upload.storageRef,
        mimeType: upload.mimeType,
        sizeBytes: upload.sizeBytes
      },
      create: {
        sha256: upload.sha256,
        type: upload.type,
        storageRef: upload.storageRef,
        mimeType: upload.mimeType,
        sizeBytes: upload.sizeBytes
      }
    });
  }

  async saveAnchor(anchor: AnchorRecord): Promise<void> {
    this.anchors.set(anchor.date, anchor);
    if (!this.persistent) return;
    await this.prisma!.anchor.upsert({
      where: { batchDate: new Date(`${anchor.date}T00:00:00.000Z`) },
      update: {
        merkleRoot: anchor.merkleRoot,
        schemaVersion: anchor.schemaVersion,
        chainId: anchor.chainId,
        contract: anchor.contractAddress,
        txHash: anchor.txHash,
        blockNumber: anchor.blockNumber ? BigInt(anchor.blockNumber) : undefined,
        status: anchor.status,
        attemptCount: anchor.attemptCount ?? 0,
        lastError: anchor.lastError,
        nextAttemptAt: anchor.nextAttemptAt ? new Date(anchor.nextAttemptAt) : null,
        anchoredAt: anchor.anchoredAt ? new Date(anchor.anchoredAt) : undefined
      },
      create: {
        batchDate: new Date(`${anchor.date}T00:00:00.000Z`),
        merkleRoot: anchor.merkleRoot,
        schemaVersion: anchor.schemaVersion,
        chainId: anchor.chainId,
        contract: anchor.contractAddress,
        txHash: anchor.txHash,
        blockNumber: anchor.blockNumber ? BigInt(anchor.blockNumber) : undefined,
        status: anchor.status,
        attemptCount: anchor.attemptCount ?? 0,
        lastError: anchor.lastError,
        nextAttemptAt: anchor.nextAttemptAt ? new Date(anchor.nextAttemptAt) : undefined,
        anchoredAt: anchor.anchoredAt ? new Date(anchor.anchoredAt) : undefined
      }
    });
  }

  idempotency(key: string): StoredIdempotency | undefined {
    const record = this.idempotencyKeys.get(key);
    if (record && Date.parse(record.expiresAt) <= Date.now()) {
      this.idempotencyKeys.delete(key);
      return undefined;
    }
    return record;
  }

  async claimIdempotency(
    key: string,
    record: Pick<StoredIdempotency, "actorId" | "endpoint" | "requestHash">
  ): Promise<{ claimed: boolean; record: StoredIdempotency }> {
    const stored = {
      ...record,
      status: "processing" as const,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    if (!this.persistent) {
      const existing = this.idempotency(key);
      if (existing) return { claimed: false, record: existing };
      this.idempotencyKeys.set(key, stored);
      return { claimed: true, record: stored };
    }
    const inserted = await this.prisma!.$executeRaw`
      INSERT INTO idempotency_keys (
        key, actor_id, endpoint, request_hash, status, expires_at
      )
      VALUES (
        ${key}, ${record.actorId}, ${record.endpoint}, ${record.requestHash},
        'processing', ${new Date(stored.expiresAt)}
      )
      ON CONFLICT (key) DO NOTHING
    `;
    if (inserted === 1) {
      this.idempotencyKeys.set(key, stored);
      return { claimed: true, record: stored };
    }
    const existing = await this.prisma!.idempotencyKey.findUniqueOrThrow({ where: { key } });
    const hydrated: StoredIdempotency = {
      actorId: existing.actorId,
      endpoint: existing.endpoint,
      requestHash: existing.requestHash,
      status: existing.status as StoredIdempotency["status"],
      responseBody: existing.responseBody ?? undefined,
      expiresAt: existing.expiresAt.toISOString()
    };
    this.idempotencyKeys.set(key, hydrated);
    return { claimed: false, record: hydrated };
  }

  async completeIdempotency(key: string, responseBody: unknown): Promise<void> {
    const current = this.idempotencyKeys.get(key);
    if (!current) return;
    const completed: StoredIdempotency = {
      ...current,
      status: "completed",
      responseBody
    };
    this.idempotencyKeys.set(key, completed);
    if (!this.persistent) return;
    await this.prisma!.idempotencyKey.update({
      where: { key },
      data: {
        status: "completed",
        responseCode: 201,
        responseBody: responseBody as Prisma.InputJsonValue
      }
    });
  }

  async releaseIdempotency(key: string): Promise<void> {
    const current = this.idempotencyKeys.get(key);
    if (current?.status !== "processing") return;
    this.idempotencyKeys.delete(key);
    if (!this.persistent) return;
    await this.prisma!.idempotencyKey.deleteMany({
      where: { key, status: "processing" }
    });
  }

  private async hydrate(): Promise<void> {
    await this.prisma!.connect();
    const [actors, plots, batches, evidence, logs, idempotencyKeys, anchors] = await Promise.all([
      this.prisma!.actor.findMany(),
      this.prisma!.$queryRaw<PlotRow[]>`SELECT id, farmer_id, farmer_name,
        planting_area_code, crop, variety, area_ha, province, district, commune,
        polygon_geojson, status FROM farm_plots`,
      this.prisma!.batch.findMany({ include: { events: { orderBy: { eventTime: "asc" } } } }),
      this.prisma!.evidenceFile.findMany({
        where: { eventId: { not: null } },
        select: { sha256: true }
      }),
      this.prisma!.auditLog.findMany({ orderBy: { createdAt: "asc" } }),
      this.prisma!.idempotencyKey.findMany({ where: { expiresAt: { gt: new Date() } } }),
      this.prisma!.anchor.findMany()
    ]);
    this.actors.clear();
    actors.forEach((actor) => this.actors.set(actor.id, actorFromDb(actor)));
    this.plots.clear();
    for (const row of plots) {
      const ring = row.polygon_geojson.coordinates?.[0] ?? [];
      this.plots.set(row.id, {
        id: row.id,
        farmerId: row.farmer_id,
        farmerName: row.farmer_name,
        plantingAreaCode: row.planting_area_code,
        crop: row.crop || "durian",
        variety: row.variety,
        areaHa: Number(row.area_ha),
        province: row.province,
        district: row.district,
        commune: row.commune,
        polygon: ring.slice(0, -1).map(([longitude = 0, latitude = 0]) => ({ latitude, longitude })),
        status: row.status as FarmPlot["status"]
      });
    }
    this.batches.clear();
    for (const batch of batches) {
      this.batches.set(batch.id, batchFromDb(batch));
    }
    this.memoryBatchSequence = this.batches.size;
    this.evidenceHashes.clear();
    evidence.forEach(({ sha256 }) => this.evidenceHashes.add(sha256));
    this.auditLogs.splice(
      0,
      this.auditLogs.length,
      ...logs.map(auditFromDb)
    );
    this.idempotencyKeys.clear();
    idempotencyKeys.forEach((item) =>
      this.idempotencyKeys.set(item.key, {
        actorId: item.actorId,
        endpoint: item.endpoint,
        requestHash: item.requestHash,
        status: item.status as StoredIdempotency["status"],
        responseBody: item.responseBody ?? undefined,
        expiresAt: item.expiresAt.toISOString()
      })
    );
    this.anchors.clear();
    anchors.forEach((anchor) => {
      const date = anchor.batchDate.toISOString().slice(0, 10);
      this.anchors.set(date, {
        date,
        merkleRoot: anchor.merkleRoot,
        schemaVersion: anchor.schemaVersion,
        chainId: anchor.chainId ?? undefined,
        contractAddress: anchor.contract ?? undefined,
        txHash: anchor.txHash ?? undefined,
        blockNumber: anchor.blockNumber?.toString(),
        status: anchor.status as AnchorRecord["status"],
        attemptCount: anchor.attemptCount,
        lastError: anchor.lastError ?? undefined,
        nextAttemptAt: anchor.nextAttemptAt?.toISOString(),
        anchoredAt: anchor.anchoredAt?.toISOString()
      });
    });
    if (!this.actors.has("FARMER-0001")) {
      await this.saveActor({
        id: "FARMER-0001",
        name: "Nguyễn Văn Minh",
        phone: "0900000001",
        role: "FARMER",
        organization: "HTX Nông nghiệp Cây Trồng",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    for (const plot of seedPlots) {
      if (!this.plots.has(plot.id)) {
        await this.savePlot(plot);
      }
    }
  }
}
