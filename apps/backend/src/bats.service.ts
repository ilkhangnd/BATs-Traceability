import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
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
import type { ActorRole, Batch, CreateHarvestInput, TransferInput } from "./domain.js";
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
  constructor(
    @Inject(StoreService) private readonly store: StoreService,
    @Inject(ValidationService) private readonly validation: ValidationService,
    @Inject(MerkleService) private readonly merkle: MerkleService,
    @Inject(AnchorService) private readonly anchors?: AnchorService
  ) {}

  async onModuleInit(): Promise<void> {
    await this.store.ensureReady();
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
    const plot = this.store.plots.get(input.farmPlotId);
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
    const batch = this.store.batches.get(lot);
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

  async verifyIdentity(gtin: string, lot: string, serial: string) {
    if (!isValidGtin(gtin)) throw new BadRequestException("GTIN không có check digit hợp lệ.");
    const batch = this.store.batches.get(lot);
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
    const batch = this.store.batches.get(lot);
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
