import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Actor, Batch, MarketplaceRequest, MarketplaceRequestStatus } from "./domain.js";
import { StoreService } from "./store.service.js";

export interface MarketplaceLot {
  id: string;
  crop: string;
  variety: string;
  quantityKg: number;
  status: Batch["status"];
  riskBand: Batch["riskBand"];
  createdAt: string;
  plantingAreaCode?: string;
  province?: string;
  district?: string;
  identity: Batch["identity"];
}

@Injectable()
export class MarketplaceService {
  private readonly requests = new Map<string, MarketplaceRequest>();

  constructor(@Inject(StoreService) private readonly store: StoreService) {}

  lots(query: { q?: string; crop?: string; province?: string } = {}): MarketplaceLot[] {
    const text = query.q?.trim().toLocaleLowerCase("vi");
    return this.store.listBatches()
      .filter((batch) => batch.accepted && ["harvested", "collected", "packed"].includes(batch.status) && batch.riskBand !== "red")
      .map((batch) => {
        const plot = this.store.plots.get(batch.farmPlotId);
        return { id: batch.id, crop: batch.crop, variety: batch.variety, quantityKg: batch.quantityKg, status: batch.status, riskBand: batch.riskBand, createdAt: batch.createdAt, plantingAreaCode: plot?.plantingAreaCode, province: plot?.province, district: plot?.district, identity: batch.identity };
      })
      .filter((lot) => (!query.crop || lot.crop === query.crop) && (!query.province || lot.province?.toLocaleLowerCase("vi") === query.province.trim().toLocaleLowerCase("vi")) && (!text || [lot.id, lot.crop, lot.variety, lot.plantingAreaCode, lot.province, lot.district].some((value) => value?.toLocaleLowerCase("vi").includes(text))));
  }

  createRequest(actor: Actor, input: { batchId: string; quantityKg: number; proposedPickupDate?: string; note?: string }): MarketplaceRequest {
    const batch = this.store.batches.get(input.batchId);
    if (!batch || !batch.accepted || batch.riskBand === "red") throw new NotFoundException("Không tìm thấy lô có thể kết nối ở thời điểm này.");
    if (batch.farmerId === actor.id) throw new ForbiddenException("Không thể gửi yêu cầu cho lô do chính tài khoản của bạn tạo.");
    if (!Number.isFinite(input.quantityKg) || input.quantityKg <= 0 || input.quantityKg > batch.quantityKg) throw new BadRequestException("Khối lượng đề nghị cần lớn hơn 0 và không vượt quá khối lượng lô.");
    const now = new Date().toISOString();
    const request: MarketplaceRequest = { id: `REQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`, batchId: batch.id, requesterId: actor.id, requesterName: actor.name, requesterOrganization: actor.organization, quantityKg: Math.round(input.quantityKg * 100) / 100, proposedPickupDate: input.proposedPickupDate, note: input.note?.trim().slice(0, 500), status: "pending", createdAt: now, updatedAt: now };
    this.requests.set(request.id, request);
    return request;
  }

  requestsFor(actor: Actor): MarketplaceRequest[] {
    return [...this.requests.values()].filter((request) => request.requesterId === actor.id || actor.role === "COOPERATIVE" || actor.role === "ADMIN" || this.store.batches.get(request.batchId)?.farmerId === actor.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  updateRequest(actor: Actor, requestId: string, status: MarketplaceRequestStatus, responseNote?: string): MarketplaceRequest {
    const request = this.requests.get(requestId);
    if (!request) throw new NotFoundException("Không tìm thấy yêu cầu kết nối.");
    const batch = this.store.batches.get(request.batchId);
    if (!(actor.role === "ADMIN" || actor.role === "COOPERATIVE" || batch?.farmerId === actor.id)) throw new ForbiddenException("Bạn không có quyền phản hồi yêu cầu này.");
    if (request.status !== "pending") throw new BadRequestException("Yêu cầu này đã được xử lý.");
    if (!(["accepted", "declined"] as MarketplaceRequestStatus[]).includes(status)) throw new BadRequestException("Trạng thái phản hồi không hợp lệ.");
    const updated = { ...request, status, responseNote: responseNote?.trim().slice(0, 500), updatedAt: new Date().toISOString() };
    this.requests.set(requestId, updated);
    return updated;
  }
}
