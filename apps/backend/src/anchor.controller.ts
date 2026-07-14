import { Controller, Get, Inject, Param, Post, UseGuards } from "@nestjs/common";
import { AdminGuard } from "./admin.guard.js";
import { AnchorService } from "./anchor.service.js";
import { ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

@Controller("admin/anchors")
@UseGuards(AdminGuard)
@ApiTags("Blockchain anchor")
@ApiCookieAuth("admin-session")
export class AnchorController {
  constructor(@Inject(AnchorService) private readonly anchors: AnchorService) {}

  @Get()
  list() {
    return this.anchors.list();
  }

  @Post(":date")
  @ApiOperation({ summary: "Tạo daily Merkle root và neo lên EVM" })
  anchor(@Param("date") date: string) {
    return this.anchors.anchorDate(date);
  }
}
