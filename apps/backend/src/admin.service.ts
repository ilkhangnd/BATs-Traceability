import { randomUUID } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import type { Actor, ActorInput, AuditLog, FarmPlot, FarmPlotInput } from "./domain.js";
import {
  StoreService,
  type ActorPageQuery,
  type AuditPageQuery,
  type PlotPageQuery
} from "./store.service.js";

@Injectable()
export class AdminService {
  constructor(@Inject(StoreService) private readonly store: StoreService) {}

  actors(query: ActorPageQuery = {}) {
    return this.store.pageActors(query);
  }

  actor(id: string): Actor {
    const actor = this.store.actors.get(id);
    if (!actor) throw new NotFoundException("Không tìm thấy actor.");
    return actor;
  }

  async createActor(input: ActorInput, adminId: string): Promise<Actor> {
    if (!input.name?.trim() || !input.role) throw new BadRequestException("Tên và vai trò là bắt buộc.");
    if (input.zaloUserId && [...this.store.actors.values()].some((a) => a.zaloUserId === input.zaloUserId)) {
      throw new BadRequestException("Zalo user ID đã được gán cho actor khác.");
    }
    const now = new Date().toISOString();
    const actor: Actor = {
      id: `${input.role}-${randomUUID().slice(0, 8).toUpperCase()}`,
      ...input,
      name: input.name.trim(),
      status: input.status ?? "active",
      createdAt: now,
      updatedAt: now
    };
    await this.store.saveActor(actor);
    await this.audit(adminId, "CREATE", "actor", actor.id);
    return actor;
  }

  async updateActor(id: string, input: Partial<ActorInput>, adminId: string): Promise<Actor> {
    const current = this.store.actors.get(id);
    if (!current) throw new NotFoundException("Không tìm thấy actor.");
    if (input.zaloUserId && [...this.store.actors.values()].some((a) => a.id !== id && a.zaloUserId === input.zaloUserId)) {
      throw new BadRequestException("Zalo user ID đã được gán cho actor khác.");
    }
    const updated = { ...current, ...input, id, updatedAt: new Date().toISOString() };
    await this.store.saveActor(updated);
    await this.audit(adminId, "UPDATE", "actor", id, { fields: Object.keys(input), ...(input.zaloUserId ? { zaloUserId: input.zaloUserId } : {}) });
    return updated;
  }

  deleteActor(id: string, adminId: string): Promise<Actor> {
    if (id === adminId) throw new BadRequestException("Admin không thể tự khóa tài khoản.");
    return this.updateActor(id, { status: "inactive" }, adminId);
  }

  plots(query: PlotPageQuery = {}) {
    return this.store.pagePlots(query);
  }

  async createPlot(input: FarmPlotInput, adminId: string): Promise<FarmPlot> {
    this.validatePlot(input);
    if (this.store.listAllPlots().some((plot) => plot.plantingAreaCode === input.plantingAreaCode)) {
      throw new BadRequestException("Mã vùng trồng đã tồn tại.");
    }
    const plot: FarmPlot = {
      ...input,
      id: `plot-${randomUUID().slice(0, 8)}`,
      crop: input.crop || "durian",
      status: input.status ?? "active"
    };
    await this.applyPolygonInspection(plot);
    await this.store.savePlot(plot);
    await this.audit(adminId, "CREATE", "farm_plot", plot.id, { plantingAreaCode: plot.plantingAreaCode });
    return plot;
  }

  async updatePlot(id: string, input: Partial<FarmPlotInput>, adminId: string): Promise<FarmPlot> {
    const current = this.store.plots.get(id);
    if (!current) throw new NotFoundException("Không tìm thấy vùng trồng.");
    const updated: FarmPlot = { ...current, ...input, id, crop: input.crop || current.crop || "durian" };
    this.validatePlot(updated);
    await this.applyPolygonInspection(updated);
    await this.store.savePlot(updated);
    await this.audit(adminId, "UPDATE", "farm_plot", id, { fields: Object.keys(input) });
    return updated;
  }

  deletePlot(id: string, adminId: string): Promise<FarmPlot> {
    return this.updatePlot(id, { status: "inactive" }, adminId);
  }

  logs(query: AuditPageQuery = {}) {
    return this.store.pageAuditLogs(query);
  }

  private validatePlot(input: Pick<FarmPlotInput, "plantingAreaCode" | "areaHa" | "polygon">): void {
    if (!input.plantingAreaCode?.trim()) throw new BadRequestException("Mã vùng trồng là bắt buộc.");
    if (!Number.isFinite(input.areaHa) || input.areaHa <= 0) throw new BadRequestException("Diện tích phải lớn hơn 0.");
    if (!Array.isArray(input.polygon) || input.polygon.length < 3) {
      throw new BadRequestException("Polygon vùng trồng phải có ít nhất 3 điểm.");
    }
  }

  private async applyPolygonInspection(plot: FarmPlot): Promise<void> {
    const inspection = await this.store.inspectPolygon(plot.polygon, plot.id);
    if (!inspection.valid) {
      throw new BadRequestException(inspection.reason ?? "Polygon không hợp lệ.");
    }
    if (inspection.overlappingPlotIds.length > 0) {
      throw new ConflictException(
        `Vùng trồng chồng lấn với: ${inspection.overlappingPlotIds.join(", ")}.`
      );
    }
    if (inspection.areaHa && inspection.areaHa > 0) {
      plot.areaHa = Number(inspection.areaHa.toFixed(4));
    }
  }

  private async audit(
    actorId: string,
    action: string,
    targetType: AuditLog["targetType"],
    targetId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.store.saveAudit({
      id: randomUUID(),
      actorId,
      action,
      targetType,
      targetId,
      createdAt: new Date().toISOString(),
      metadata
    });
  }
}
