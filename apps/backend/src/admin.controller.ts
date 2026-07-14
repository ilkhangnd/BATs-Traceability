import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import { AdminGuard, type AdminRequest } from "./admin.guard.js";
import { AdminService } from "./admin.service.js";
import type { ActorInput, FarmPlotInput } from "./domain.js";
import { AuthService } from "./auth.service.js";
import type { PageQuery } from "./pagination.js";
import { ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { ApiPagination } from "./openapi.decorators.js";

interface ActorQuery extends PageQuery {
  role?: string;
  status?: string;
}

interface PlotQuery extends PageQuery {
  status?: string;
}

interface AuditQuery extends PageQuery {
  action?: string;
  targetType?: string;
}

@Controller("admin")
@UseGuards(AdminGuard)
@ApiTags("Administration")
@ApiCookieAuth("admin-session")
export class AdminController {
  constructor(
    @Inject(AdminService) private readonly admin: AdminService,
    @Inject(AuthService) private readonly auth: AuthService
  ) {}

  @Get("actors")
  @ApiPagination()
  @ApiQuery({ name: "role", required: false, type: String })
  @ApiQuery({ name: "status", required: false, enum: ["active", "inactive"] })
  actors(@Query() query: ActorQuery) {
    return this.admin.actors(query);
  }

  @Post("actors")
  @ApiOperation({ summary: "Tạo actor và vai trò vận hành" })
  createActor(@Body() input: ActorInput, @Req() request: AdminRequest) {
    return this.admin.createActor(input, request.actor!.id);
  }

  @Patch("actors/:id")
  updateActor(
    @Param("id") id: string,
    @Body() input: Partial<ActorInput>,
    @Req() request: AdminRequest
  ) {
    return this.admin.updateActor(id, input, request.actor!.id);
  }

  @Delete("actors/:id")
  deleteActor(@Param("id") id: string, @Req() request: AdminRequest) {
    return this.admin.deleteActor(id, request.actor!.id);
  }

  @Post("actors/:id/access-token")
  issueAccessToken(@Param("id") id: string) {
    const actor = this.admin.actor(id);
    return {
      actor,
      accessToken: this.auth.tokenFor(actor),
      expiresIn: 3600,
      mode: "admin-issued-temporary"
    };
  }

  @Get("plots")
  @ApiPagination()
  @ApiQuery({ name: "status", required: false, enum: ["active", "inactive"] })
  plots(@Query() query: PlotQuery) {
    return this.admin.plots(query);
  }

  @Post("plots")
  @ApiOperation({ summary: "Tạo vùng trồng và kiểm tra polygon bằng PostGIS" })
  createPlot(@Body() input: FarmPlotInput, @Req() request: AdminRequest) {
    return this.admin.createPlot(input, request.actor!.id);
  }

  @Patch("plots/:id")
  updatePlot(
    @Param("id") id: string,
    @Body() input: Partial<FarmPlotInput>,
    @Req() request: AdminRequest
  ) {
    return this.admin.updatePlot(id, input, request.actor!.id);
  }

  @Delete("plots/:id")
  deletePlot(@Param("id") id: string, @Req() request: AdminRequest) {
    return this.admin.deletePlot(id, request.actor!.id);
  }

  @Get("audit-logs")
  @ApiPagination()
  @ApiQuery({ name: "action", required: false, type: String })
  @ApiQuery({ name: "targetType", required: false, type: String })
  logs(@Query() query: AuditQuery) {
    return this.admin.logs(query);
  }
}
