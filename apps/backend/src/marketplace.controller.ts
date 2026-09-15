import { Body, Controller, Get, Inject, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AccessGuard, type ActorRequest, Roles } from "./access.guard.js";
import type { MarketplaceRequestStatus } from "./domain.js";
import { MarketplaceService } from "./marketplace.service.js";

@Controller("marketplace")
@ApiTags("Supply chain connection")
export class MarketplaceController {
  constructor(@Inject(MarketplaceService) private readonly marketplace: MarketplaceService) {}

  @Get("lots")
  @ApiOperation({ summary: "Danh sách lô có thể gửi yêu cầu kết nối" })
  lots(@Query() query: { q?: string; crop?: string; province?: string }) { return { items: this.marketplace.lots(query) }; }

  @Get("requests")
  @ApiBearerAuth("actor-token")
  @UseGuards(AccessGuard)
  requests(@Req() request: ActorRequest) { return { items: this.marketplace.requestsFor(request.actor!) }; }

  @Post("requests")
  @ApiBearerAuth("actor-token")
  @UseGuards(AccessGuard)
  @Roles("COLLECTOR", "COOPERATIVE", "PACKING", "EXPORTER", "ADMIN")
  @ApiOperation({ summary: "Gửi yêu cầu mua/liên hệ cho một lô" })
  createRequest(@Req() request: ActorRequest, @Body() input: { batchId: string; quantityKg: number; proposedPickupDate?: string; note?: string }) { return this.marketplace.createRequest(request.actor!, input); }

  @Patch("requests/:id")
  @ApiBearerAuth("actor-token")
  @UseGuards(AccessGuard)
  @ApiOperation({ summary: "Chấp nhận hoặc từ chối yêu cầu kết nối" })
  updateRequest(@Req() request: ActorRequest, @Param("id") id: string, @Body() input: { status: MarketplaceRequestStatus; responseNote?: string }) { return this.marketplace.updateRequest(request.actor!, id, input.status, input.responseNote); }
}
