import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards
} from "@nestjs/common";
import { BatsService } from "./bats.service.js";
import type { CreateHarvestInput, TransferInput } from "./domain.js";
import { PrismaService } from "./database/prisma.service.js";
import { AccessGuard, type ActorRequest, Roles } from "./access.guard.js";
import { DossierService } from "./dossier.service.js";
import { EvidenceService } from "./evidence.service.js";
import { AnchorService } from "./anchor.service.js";
import { MetricsService } from "./metrics.service.js";
import type { PageQuery } from "./pagination.js";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags
} from "@nestjs/swagger";
import { ApiPagination } from "./openapi.decorators.js";

interface PlotQuery extends PageQuery {
  province?: string;
  district?: string;
}

interface BatchQuery extends PageQuery {
  status?: string;
  riskBand?: string;
}

interface DownloadResponse {
  setHeader(name: string, value: string): void;
  send(body: unknown): void;
}

@Controller()
@ApiTags("Public traceability")
export class AppController {
  constructor(
    @Inject(BatsService) private readonly bats: BatsService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DossierService) private readonly dossiers: DossierService,
    @Inject(EvidenceService) private readonly evidence: EvidenceService,
    @Inject(AnchorService) private readonly anchors: AnchorService,
    @Inject(MetricsService) private readonly metrics: MetricsService
  ) {}

  @Get("health")
  @ApiOperation({ summary: "Kiểm tra database, evidence storage và blockchain" })
  async health() {
    const [database, storage, blockchain] = await Promise.all([
      this.prisma.ping(),
      this.evidence.health(),
      this.anchors.health()
    ]);
    const healthy = database && storage.ok && blockchain.ok;
    return {
      status: healthy ? "ok" : "degraded",
      service: "bats-backend",
      checks: {
        database: database ? "connected" : "unavailable",
        evidenceStorage: storage,
        blockchain
      },
      operationalStore: this.bats.storageMode(),
      timestamp: new Date().toISOString()
    };
  }

  @Get("metrics")
  @ApiOperation({ summary: "Prometheus metrics" })
  metricsEndpoint(@Res() response: DownloadResponse) {
    response.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
    response.send(this.metrics.prometheus());
  }

  @Get("plots")
  @ApiPagination()
  @ApiQuery({ name: "province", required: false, type: String })
  @ApiQuery({ name: "district", required: false, type: String })
  plots(@Query() query: PlotQuery) {
    return this.bats.pagePlots(query);
  }

  @Get("batches")
  @ApiPagination()
  @ApiQuery({ name: "status", required: false, enum: ["harvested", "collected", "packed", "shipped"] })
  @ApiQuery({ name: "riskBand", required: false, enum: ["green", "yellow", "red"] })
  batches(@Query() query: BatchQuery) {
    return this.bats.pageBatches(query);
  }

  @Post("batches/harvest")
  @ApiTags("Operations")
  @ApiBearerAuth("actor-token")
  @ApiOperation({ summary: "Tạo lô thu hoạch và EPCIS event đầu tiên" })
  @ApiResponse({ status: 201, description: "Lô đã được tạo." })
  @UseGuards(AccessGuard)
  @Roles("FARMER", "COOPERATIVE", "ADMIN")
  createHarvest(
    @Body() input: CreateHarvestInput,
    @Req() request: ActorRequest,
    @Headers("x-idempotency-key") idempotencyKey?: string
  ) {
    return this.bats.createHarvest(
      { ...input, actorId: request.actor!.id },
      idempotencyKey
    );
  }

  @Post("batches/:id/transfer")
  @ApiTags("Operations")
  @ApiBearerAuth("actor-token")
  @ApiOperation({ summary: "Chuyển trạng thái lô và tạo EPCIS event" })
  @UseGuards(AccessGuard)
  @Roles("COLLECTOR", "COOPERATIVE", "PACKING", "EXPORTER", "ADMIN")
  transfer(
    @Param("id") id: string,
    @Body() input: TransferInput,
    @Req() request: ActorRequest,
    @Headers("x-idempotency-key") idempotencyKey?: string
  ) {
    return this.bats.transfer(
      id,
      { ...input, actorId: request.actor!.id },
      idempotencyKey,
      request.actor!.role
    );
  }

  @Get("verify/:gtin/:lot/:serial")
  @ApiOperation({ summary: "Xác minh hồ sơ, Merkle proof và trạng thái anchor" })
  verify(
    @Param("gtin") gtin: string,
    @Param("lot") lot: string,
    @Param("serial") serial: string
  ) {
    return this.bats.verifyIdentity(gtin, lot, serial);
  }

  @Get("01/:gtin/10/:lot/21/:serial")
  @ApiOperation({ summary: "GS1 Digital Link resolver cho lô BATS" })
  digitalLink(
    @Param("gtin") gtin: string,
    @Param("lot") lot: string,
    @Param("serial") serial: string
  ) {
    return this.bats.verifyIdentity(gtin, lot, serial);
  }

  @Get("epcis/:gtin/:lot/:serial")
  @ApiOperation({ summary: "Xuất EPCIS 2.0 JSON-LD document" })
  epcis(
    @Param("gtin") gtin: string,
    @Param("lot") lot: string,
    @Param("serial") serial: string
  ) {
    return this.bats.epcisDocument(gtin, lot, serial);
  }

  @Get("verify/:gtin/:lot/:serial/export/:format")
  @ApiOperation({ summary: "Tải hồ sơ lô dưới dạng JSON, CSV hoặc PDF" })
  @ApiParam({ name: "format", required: true, enum: ["json", "csv", "pdf"] })
  async exportDossier(
    @Param("gtin") gtin: string,
    @Param("lot") lot: string,
    @Param("serial") serial: string,
    @Param("format") format: string,
    @Res() response: DownloadResponse
  ) {
    const exported = await this.dossiers.export(
      gtin,
      lot,
      serial,
      format.toLowerCase()
    );
    response.setHeader("Content-Type", exported.contentType);
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="bats-${lot}.${exported.extension}"`
    );
    response.send(exported.body);
  }
}
