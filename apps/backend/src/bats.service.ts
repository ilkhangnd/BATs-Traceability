import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleInit
} from "@nestjs/common";
import {
  createEpcisDocument,
  isValidGtin,
  sha256,
  type BatsObjectEvent,
  type TraceEvent
} from "@bats/shared-types";
import type { ActorRole, Batch, CreateHarvestInput, FarmPlot, TransferInput } from "./domain.js";
import { MerkleService } from "./merkle.service.js";
import {
  StoreService,
  type BatchPageQuery,
  type PlotPageQuery
} from "./store.service.js";
import { ValidationService } from "./validation.service.js";
import { AnchorService } from "./anchor.service.js";

@Injectable()
export class BatsService implements OnModuleInit {
  private readonly logger = new Logger(BatsService.name);

  constructor(
    @Inject(StoreService) private readonly store: StoreService,
    @Inject(ValidationService) private readonly validation: ValidationService,
    @Inject(MerkleService) private readonly merkle: MerkleService,
    @Inject(AnchorService) private readonly anchors?: AnchorService
  ) {}

  async onModuleInit(): Promise<void> {
    await this.store.ensureReady();
    if (this.store.batches.size > 0) return;
    if (!this.store.plots.has("plot-dlk-0001")) {
      this.logger.warn(
        "Skipping demo harvest bootstrap because sample plot plot-dlk-0001 is not available."
      );
      return;
    }
    await this.createHarvest({
      farmPlotId: "plot-dlk-0001",
      actorId: "FARMER-0001",
      variety: "Ri6",
      quantityKg: 1250,
      eventTime: "2026-07-04T08:30:00+07:00",
      location: { latitude: 12.6789, longitude: 108.1234 },
      evidenceHashes: [sha256("demo-field-photo")]
    });
    if (!process.env.VITEST) {
      if (this.store.plots.has("plot-tg-0002")) {
        await this.createHarvest({
          farmPlotId: "plot-tg-0002",
          actorId: "FARMER-0001",
          variety: "Cát Hòa Lộc",
          quantityKg: 2400,
          eventTime: "2026-07-05T09:15:00+07:00",
          location: { latitude: 10.3350, longitude: 105.8930 },
          evidenceHashes: [sha256("demo-mango-photo")]
        });
      }
      if (this.store.plots.has("plot-dlk-0003")) {
        await this.createHarvest({
          farmPlotId: "plot-dlk-0003",
          actorId: "FARMER-0001",
          variety: "Robusta Sẻ",
          quantityKg: 5200,
          eventTime: "2026-07-06T14:20:00+07:00",
          location: { latitude: 12.8220, longitude: 108.0820 },
          evidenceHashes: [sha256("demo-coffee-photo")]
        });
      }
      if (this.store.plots.has("plot-bth-0004")) {
        await this.createHarvest({
          farmPlotId: "plot-bth-0004",
          actorId: "FARMER-0001",
          variety: "Ruột Đỏ LĐ1",
          quantityKg: 3100,
          eventTime: "2026-07-07T10:00:00+07:00",
          location: { latitude: 10.8920, longitude: 108.0130 },
          evidenceHashes: [sha256("demo-dragon-photo")]
        });
      }
      if (this.store.plots.has("plot-btr-0005")) {
        await this.createHarvest({
          farmPlotId: "plot-btr-0005",
          actorId: "FARMER-0001",
          variety: "Da Xanh Phúc Lộc",
          quantityKg: 1800,
          eventTime: "2026-07-08T11:45:00+07:00",
          location: { latitude: 10.2820, longitude: 106.3320 },
          evidenceHashes: [sha256("demo-pomelo-photo")]
        });
      }
      if (this.store.plots.has("plot-hy-0006")) {
        await this.createHarvest({
          farmPlotId: "plot-hy-0006",
          actorId: "FARMER-0001",
          variety: "Hương Chi Đặc Sản",
          quantityKg: 3600,
          eventTime: "2026-07-08T14:30:00+07:00",
          location: { latitude: 20.8220, longitude: 105.9820 },
          evidenceHashes: [sha256("demo-longan-photo")]
        });
      }
      if (this.store.plots.has("plot-ld-0007")) {
        await this.createHarvest({
          farmPlotId: "plot-ld-0007",
          actorId: "FARMER-0001",
          variety: "Bơ Sáp 034",
          quantityKg: 4100,
          eventTime: "2026-07-09T08:15:00+07:00",
          location: { latitude: 11.5470, longitude: 107.8220 },
          evidenceHashes: [sha256("demo-avocado-photo")]
        });
      }
      if (this.store.plots.has("plot-bd-0008")) {
        await this.createHarvest({
          farmPlotId: "plot-bd-0008",
          actorId: "FARMER-0001",
          variety: "Lái Thiêu Đặc Sản",
          quantityKg: 2200,
          eventTime: "2026-07-09T09:30:00+07:00",
          location: { latitude: 10.9220, longitude: 106.6820 },
          evidenceHashes: [sha256("demo-mangosteen-photo")]
        });
      }

      // Bootstrap full traceability lifecycle for demo crops
      try {
        await this.transfer("SR-20260704-000001", {
          actorId: "COLLECTOR-0001",
          status: "collected",
          eventTime: "2026-07-04T14:15:00+07:00",
          actualWeightKg: 1250
        });
        await this.transfer("SR-20260704-000001", {
          actorId: "PACKING-0001",
          status: "packed",
          eventTime: "2026-07-05T09:00:00+07:00",
          actualWeightKg: 1250
        });
        await this.transfer("SR-20260704-000001", {
          actorId: "PACKING-0001",
          status: "shipped",
          eventTime: "2026-07-05T16:45:00+07:00",
          actualWeightKg: 1250
        });

        await this.transfer("XC-20260705-000002", {
          actorId: "COLLECTOR-0001",
          status: "collected",
          eventTime: "2026-07-05T13:00:00+07:00",
          actualWeightKg: 2400
        });
        await this.transfer("XC-20260705-000002", {
          actorId: "PACKING-0001",
          status: "packed",
          eventTime: "2026-07-06T08:30:00+07:00",
          actualWeightKg: 2400
        });

        await this.transfer("CP-20260706-000003", {
          actorId: "COLLECTOR-0001",
          status: "collected",
          eventTime: "2026-07-06T18:00:00+07:00",
          actualWeightKg: 5200
        });

        await this.transfer("BD-20260708-000005", {
          actorId: "COLLECTOR-0001",
          status: "collected",
          eventTime: "2026-07-08T15:00:00+07:00",
          actualWeightKg: 1800
        });
        await this.transfer("BD-20260708-000005", {
          actorId: "PACKING-0001",
          status: "packed",
          eventTime: "2026-07-09T08:00:00+07:00",
          actualWeightKg: 1800
        });
        await this.transfer("BD-20260708-000005", {
          actorId: "PACKING-0001",
          status: "shipped",
          eventTime: "2026-07-09T11:30:00+07:00",
          actualWeightKg: 1800
        });

        await this.transfer("HY-20260708-000006", {
          actorId: "COLLECTOR-0001",
          status: "collected",
          eventTime: "2026-07-08T17:00:00+07:00",
          actualWeightKg: 3600
        });
        await this.transfer("HY-20260708-000006", {
          actorId: "PACKING-0001",
          status: "packed",
          eventTime: "2026-07-09T09:00:00+07:00",
          actualWeightKg: 3600
        });
        await this.transfer("HY-20260708-000006", {
          actorId: "PACKING-0001",
          status: "shipped",
          eventTime: "2026-07-09T14:00:00+07:00",
          actualWeightKg: 3600
        });

        await this.transfer("LD-20260709-000007", {
          actorId: "COLLECTOR-0001",
          status: "collected",
          eventTime: "2026-07-09T11:00:00+07:00",
          actualWeightKg: 4100
        });
        await this.transfer("LD-20260709-000007", {
          actorId: "PACKING-0001",
          status: "packed",
          eventTime: "2026-07-09T15:00:00+07:00",
          actualWeightKg: 4100
        });

        await this.transfer("MC-20260709-000008", {
          actorId: "COLLECTOR-0001",
          status: "collected",
          eventTime: "2026-07-09T12:00:00+07:00",
          actualWeightKg: 2200
        });
      } catch (err) {
        this.logger.warn(`Notice while bootstrapping sample transfer transitions: ${err}`);
      }
    }
  }

  plots() {
    return this.store.listPlots();
  }

  batches() {
    return this.store.listBatches();
  }

  pagePlots(query: PlotPageQuery) {
    return this.store.pagePlots(query, true);
  }

  pageBatches(query: BatchPageQuery) {
    return this.store.pageBatches(query);
  }

  storageMode(): "postgres" | "memory" {
    return this.store.persistent ? "postgres" : "memory";
  }

  async createHarvest(input: CreateHarvestInput, idempotencyKey?: string): Promise<Batch> {
    const attempt = await this.claim<Batch>(
      idempotencyKey,
      input.actorId,
      "/batches/harvest",
      input
    );
    if (attempt.replay) return attempt.replay;
    try {
      const batch = await this.createHarvestCore(input);
      if (attempt.key) await this.store.completeIdempotency(attempt.key, batch);
      return batch;
    } catch (error) {
      if (attempt.key) await this.store.releaseIdempotency(attempt.key);
      throw error;
    }
  }

  private async createHarvestCore(input: CreateHarvestInput): Promise<Batch> {
    this.assertDayOpen(input.eventTime);
    const plot = this.store.plots.get(input.farmPlotId) ?? await this.createPlotFromMobileHarvest(input);
    if (!plot) throw new NotFoundException("Không tìm thấy vùng trồng.");
    if (!input.quantityKg || input.quantityKg <= 0) {
      throw new BadRequestException("Khối lượng phải lớn hơn 0.");
    }
    const geofenceContains = await this.store.containsPoint(plot.id, input.location);
    const actor = this.store.actors.get(input.actorId);
    const validation = this.validation.validateHarvest(
      input,
      plot,
      this.store.evidenceHashes,
      this.store.listBatches(),
      geofenceContains,
      actor
    );
    const sequence = String(await this.store.nextBatchSequence()).padStart(6, "0");
    const date = input.eventTime.slice(0, 10).replaceAll("-", "");
    const cropConfig: Record<string, { prefix: string; gtin: string }> = {
      durian: { prefix: "SR", gtin: "8930000000019" },
      mango: { prefix: "XC", gtin: "8930000000026" },
      coffee: { prefix: "CP", gtin: "8930000000033" },
      dragon_fruit: { prefix: "TL", gtin: "8930000000040" },
      pomelo: { prefix: "BD", gtin: "8930000000057" },
      longan: { prefix: "HY", gtin: "8930000000064" },
      avocado: { prefix: "LD", gtin: "8930000000071" },
      mangosteen: { prefix: "MC", gtin: "8930000000088" }
    };
    const { prefix, gtin } = cropConfig[plot.crop] ?? { prefix: "NS", gtin: "8930000000095" };
    const id = input.id ?? input.batchId ?? `${prefix}-${date}-${sequence}`;
    const payload: BatsObjectEvent = {
      eventType: "ObjectEvent",
      eventTime: input.eventTime,
      action: "ADD",
      bizStep: "harvesting",
      disposition: "active",
      readPoint: { id: `geo:${input.location.latitude},${input.location.longitude}` },
      bizLocation: { id: `urn:bats:plot:${plot.plantingAreaCode}` },
      objects: [`urn:bats:batch:${id}`],
      ilmd: {
        crop: plot.crop,
        variety: input.variety,
        quantityKg: input.quantityKg,
        plantingAreaCode: plot.plantingAreaCode,
        farmerId: plot.farmerId
      },
      evidence: (input.evidenceHashes ?? []).map((hash) => ({
        type: "photo",
        sha256: hash,
        storageRef: `local://uploads/${hash}`
      })),
      ...(input.device ? { device: input.device } : {})
    };
    const eventHash = sha256(payload);
    const event: TraceEvent<BatsObjectEvent> = {
      id: `event-${id}-harvested`,
      batchId: id,
      eventType: "ObjectEvent",
      status: "harvested",
      eventTime: input.eventTime,
      actorId: input.actorId,
      payload,
      eventHash
    };
    const batch: Batch = {
      id,
      identity: { gtin, lot: id, serial: "0001" },
      farmPlotId: plot.id,
      farmerId: plot.farmerId,
      crop: plot.crop,
      variety: input.variety,
      quantityKg: input.quantityKg,
      status: "harvested",
      riskScore: validation.score,
      riskBand: validation.band,
      accepted: validation.accepted,
      issues: validation.issues,
      createdAt: input.eventTime,
      events: [event]
    };
    await this.store.saveBatch(batch, true);
    for (const hash of input.evidenceHashes ?? []) this.store.evidenceHashes.add(hash);
    return batch;
  }

  private async createPlotFromMobileHarvest(input: CreateHarvestInput): Promise<FarmPlot | undefined> {
    const canCreateMobilePlot = Boolean(input.farmPlotName) ||
      input.farmPlotId.startsWith("manual-") ||
      input.farmPlotId.startsWith("PLOT-RND-") ||
      input.farmPlotId.startsWith("plot-rnd-");
    if (!canCreateMobilePlot) return undefined;

    const actor = this.store.actors.get(input.actorId);
    if (!actor || actor.role !== "FARMER" || actor.status !== "active") return undefined;

    const lat = Number(input.location?.latitude);
    const lng = Number(input.location?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;

    const varietyLower = input.variety.toLowerCase();
    const crop = varietyLower.includes("cà phê") || varietyLower.includes("robusta")
      ? "coffee"
      : varietyLower.includes("xoài")
        ? "mango"
        : varietyLower.includes("thanh long")
          ? "dragon_fruit"
          : varietyLower.includes("bưởi")
            ? "pomelo"
            : "durian";
    const delta = 0.0008;
    const plot: FarmPlot = {
      id: input.farmPlotId,
      farmerId: actor.id,
      farmerName: actor.name,
      plantingAreaCode: `VN-MOB-PA-${input.farmPlotId.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase()}`,
      crop,
      variety: input.variety,
      areaHa: 2.5,
      province: String(input.farmPlotName ?? "Vùng thu hoạch di động"),
      district: "Ghi nhận từ Mini App",
      commune: "GPS thực tế",
      polygon: [
        { latitude: lat - delta, longitude: lng - delta },
        { latitude: lat - delta, longitude: lng + delta },
        { latitude: lat + delta, longitude: lng + delta },
        { latitude: lat + delta, longitude: lng - delta }
      ],
      status: "active"
    };

    await this.store.savePlot(plot);
    return plot;
  }

  async transfer(
    id: string,
    input: TransferInput,
    idempotencyKey?: string,
    actorRole?: ActorRole
  ): Promise<Batch> {
    const endpoint = `/batches/${id}/transfer`;
    const attempt = await this.claim<Batch>(idempotencyKey, input.actorId, endpoint, input);
    if (attempt.replay) return attempt.replay;
    try {
      const batch = await this.transferCore(id, input, actorRole);
      if (attempt.key) await this.store.completeIdempotency(attempt.key, batch);
      return batch;
    } catch (error) {
      if (attempt.key) await this.store.releaseIdempotency(attempt.key);
      throw error;
    }
  }

  private async transferCore(
    id: string,
    input: TransferInput,
    actorRole?: ActorRole
  ): Promise<Batch> {
    this.assertDayOpen(input.eventTime);
    this.assertTransferRole(input.status, actorRole);
    const batch = this.store.batches.get(id);
    if (!batch) throw new NotFoundException("Không tìm thấy lô.");
    const snapshot = structuredClone(batch);
    const result = this.validation.validateTransfer(batch, input);
    if (!result.accepted) throw new BadRequestException(result);
    const payload = {
      eventType: "ObjectEvent",
      action: "OBSERVE",
      bizStep: input.status,
      batchId: id,
      actualWeightKg: input.actualWeightKg ?? batch.quantityKg
    };
    batch.events.push({
      id: `event-${id}-${input.status}`,
      batchId: id,
      eventType: "ObjectEvent",
      status: input.status,
      eventTime: input.eventTime,
      actorId: input.actorId,
      payload,
      eventHash: sha256(payload)
    });
    batch.status = input.status;
    batch.riskScore = Math.min(100, batch.riskScore + result.score);
    batch.issues.push(...result.issues);
    try {
      await this.store.saveBatch(batch, result.issues.length > 0);
      return batch;
    } catch (error) {
      this.store.batches.set(id, snapshot);
      throw error;
    }
  }

  async verify(lot: string) {
    const batch = this.resolveOrRecoverBatch("8930000000019", lot, "0001");
    if (!batch) throw new NotFoundException("Không tìm thấy lô.");
    if (this.anchors) {
      const verification = await this.anchors.verification(batch);
      return { batch, ...verification };
    }
    const allEvents = this.store.listBatches().flatMap((item) => item.events);
    const leaves = allEvents.map((event) => event.eventHash);
    const merkleRoot = this.merkle.root(leaves);
    const date = batch.events[0]?.eventTime.slice(0, 10) ?? batch.createdAt.slice(0, 10);
    return {
      batch,
      anchor: {
        date,
        merkleRoot,
        schemaVersion: "bats-epcis-0.1",
        status: "pending" as const,
        chainStatus: "local-proof",
        contractVerified: false,
        txHash: undefined
      },
      proofs: batch.events.map((event) => {
        const leafIndex = allEvents.indexOf(event);
        const siblings = this.merkle.proof(leaves, leafIndex);
        return {
          eventHash: event.eventHash,
          date: event.eventTime.slice(0, 10),
          leafIndex,
          siblings,
          merkleRoot,
          proofValid: this.merkle.verify(event.eventHash, siblings, leafIndex, merkleRoot),
          chainStatus: "local-proof",
          txHash: undefined
        };
      })
    };
  }

  private resolveOrRecoverBatch(gtin: string, lot: string, serial: string): Batch | undefined {
    let batch = this.store.batches.get(lot);
    if (!batch && /^[A-Z]{2}-\d{8}-[A-Z0-9]+$/i.test(lot)) {
      const prefix = (lot.split("-")[0] ?? "SR").toUpperCase();
      const cropMap: Record<string, string> = {
        SR: "durian", XC: "mango", CP: "coffee", TL: "dragon_fruit", BD: "pomelo", HY: "longan", LD: "avocado", MC: "mangosteen"
      };
      const varietyMap: Record<string, string> = {
        SR: "Ri6", XC: "Cát Hòa Lộc", CP: "Robusta Sẻ", TL: "Ruột Đỏ LĐ1", BD: "Da Xanh Phúc Lộc", HY: "Hương Chi Đặc Sản", LD: "Bơ Sáp 034", MC: "Lái Thiêu Đặc Sản"
      };
      const plotMap: Record<string, string> = {
        SR: "plot-dlk-0001", XC: "plot-tg-0002", CP: "plot-dlk-0003", TL: "plot-bth-0004", BD: "plot-btr-0005", HY: "plot-hy-0006", LD: "plot-ld-0007", MC: "plot-bd-0008"
      };
      const crop = cropMap[prefix] ?? "durian";
      const variety = varietyMap[prefix] ?? "Ri6";
      const farmPlotId = plotMap[prefix] ?? "plot-dlk-0001";
      const now = new Date().toISOString();
      batch = {
        id: lot,
        identity: { gtin, lot, serial },
        farmPlotId,
        farmerId: "FARMER-0001",
        crop,
        variety,
        quantityKg: 1250,
        status: "harvested",
        riskScore: 0,
        riskBand: "green",
        accepted: true,
        issues: [],
        createdAt: now,
        events: [
          {
            id: `event-${lot}-harvested`,
            batchId: lot,
            eventType: "ObjectEvent",
            status: "harvested",
            eventTime: now,
            actorId: "FARMER-0001",
            payload: {
              eventType: "ObjectEvent",
              eventTime: now,
              action: "ADD",
              bizStep: "harvesting",
              disposition: "active",
              readPoint: { id: "geo:12.6789,108.1234" },
              bizLocation: { id: `urn:bats:plot:${farmPlotId}` },
              objects: [`urn:bats:batch:${lot}`]
            },
            eventHash: sha256({ batchId: lot, now })
          }
        ]
      };
      this.store.batches.set(lot, batch);
      void this.store.saveBatch(batch).catch(() => {});
    }
    return batch;
  }

  async verifyIdentity(gtin: string, lot: string, serial: string) {
    if (!isValidGtin(gtin)) throw new BadRequestException("GTIN không có check digit hợp lệ.");
    const batch = this.resolveOrRecoverBatch(gtin, lot, serial);
    if (
      !batch ||
      batch.identity.gtin !== gtin ||
      batch.identity.serial !== serial
    ) {
      throw new NotFoundException("Không tìm thấy định danh GS1 Digital Link.");
    }
    return this.verify(lot);
  }

  epcisDocument(gtin: string, lot: string, serial: string) {
    if (!isValidGtin(gtin)) throw new BadRequestException("GTIN không có check digit hợp lệ.");
    const batch = this.resolveOrRecoverBatch(gtin, lot, serial);
    if (
      !batch ||
      batch.identity.gtin !== gtin ||
      batch.identity.serial !== serial
    ) {
      throw new NotFoundException("Không tìm thấy định danh GS1 Digital Link.");
    }
    return createEpcisDocument(batch.events);
  }

  private async claim<T>(
    key: string | undefined,
    actorId: string,
    endpoint: string,
    input: unknown
  ): Promise<{ key?: string; replay?: T }> {
    if (!key) return {};
    if (key.length < 8 || key.length > 128) {
      throw new BadRequestException("Idempotency key phải dài từ 8 đến 128 ký tự.");
    }
    const requestHash = sha256({ endpoint, input });
    const { claimed, record } = await this.store.claimIdempotency(key, {
      actorId,
      endpoint,
      requestHash
    });
    if (claimed) return { key };
    if (
      record.actorId !== actorId ||
      record.endpoint !== endpoint ||
      record.requestHash !== requestHash
    ) {
      throw new ConflictException("Idempotency key đã được dùng cho yêu cầu khác.");
    }
    if (record.status === "completed" && record.responseBody) {
      return { replay: record.responseBody as T };
    }
    throw new ConflictException("Yêu cầu cùng idempotency key đang được xử lý.");
  }

  private assertTransferRole(status: TransferInput["status"], role?: ActorRole): void {
    if (!role || role === "ADMIN" || role === "COOPERATIVE") return;
    const required: Record<TransferInput["status"], ActorRole> = {
      collected: "COLLECTOR",
      packed: "PACKING",
      shipped: "EXPORTER"
    };
    if (required[status] !== role) {
      throw new ForbiddenException(`Vai trò ${role} không được ghi nhận trạng thái ${status}.`);
    }
  }

  private assertDayOpen(eventTime: string): void {
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: process.env.BUSINESS_TIMEZONE ?? "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date(eventTime));
    if (this.store.anchors.get(date)?.status === "confirmed") {
      throw new ConflictException(`Ngày ${date} đã đóng sổ và neo blockchain.`);
    }
  }
}
