import { Body, Controller, Delete, Get, Inject, Patch, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { AdminGuard, type AdminRequest } from "./admin.guard.js";
import { AccessGuard, type ActorRequest } from "./access.guard.js";
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

interface CookieResponse {
  setHeader(name: string, value: string): void;
}

@Controller("auth")
@ApiTags("Authentication")
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post("admin/login")
  @ApiOperation({ summary: "Đăng nhập admin và tạo cookie HttpOnly" })
  login(
    @Body() input: { email: string; password: string },
    @Res({ passthrough: true }) response: CookieResponse
  ) {
    const result = this.auth.login(input.email ?? "", input.password ?? "");
    response.setHeader("Set-Cookie", this.auth.cookie(result.token));
    return { actor: result.actor };
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) response: CookieResponse) {
    response.setHeader("Set-Cookie", this.auth.clearCookie());
    return { ok: true };
  }

  @Get("me")
  @ApiCookieAuth("admin-session")
  @UseGuards(AdminGuard)
  me(@Req() request: AdminRequest) {
    return { actor: request.actor };
  }

  @Get("profile/me")
  @ApiOperation({ summary: "Lấy thông tin cá nhân của Nông hộ đang đăng nhập" })
  @ApiBearerAuth("actor-token")
  @UseGuards(AccessGuard)
  getProfile(@Req() request: ActorRequest) {
    return { actor: request.actor };
  }

  @Patch("profile/me")
  @ApiOperation({ summary: "Sửa/Cập nhật thông tin cá nhân Nông hộ" })
  @ApiBearerAuth("actor-token")
  @UseGuards(AccessGuard)
  async updateProfile(
    @Req() request: ActorRequest,
    @Body() input: { name?: string; phone?: string; organization?: string; email?: string }
  ) {
    const actor = await this.auth.updateProfile(request.actor!.id, input);
    return { actor };
  }

  @Delete("profile/me")
  @ApiOperation({ summary: "Xóa/Vô hiệu hóa thông tin tài khoản Nông hộ" })
  @ApiBearerAuth("actor-token")
  @UseGuards(AccessGuard)
  async deleteProfile(@Req() request: ActorRequest) {
    await this.auth.deleteProfile(request.actor!.id);
    return { ok: true };
  }

  @Post("zalo/exchange")
  @ApiOperation({ summary: "Đổi Zalo access token đã xác minh thành BATS actor token" })
  async zalo(@Body() input: { accessToken: string; userId: string }) {
    const actor = await this.auth.exchangeZaloToken(input.accessToken, input.userId);
    return { actor, accessToken: this.auth.tokenFor(actor), expiresIn: 31536000 };
  }

  @Post("zalo/location/resolve")
  @ApiOperation({ summary: "Giải mã location token từ Zalo Mini App SDK thành tọa độ GPS chuẩn" })
  @ApiBearerAuth("actor-token")
  @UseGuards(AccessGuard)
  async resolveLocation(@Body() input: { zaloAccessToken: string; locationToken: string }) {
    return this.auth.resolveLocationToken(input.zaloAccessToken, input.locationToken);
  }

  @Post("farmer/register")
  @ApiOperation({ summary: "Đăng ký tài khoản Nông hộ kèm định vị GPS rẫy ngẫu nhiên" })
  async registerFarmer(
    @Body()
    input: {
      phone: string;
      name: string;
      organization?: string;
      crop?: string;
      variety?: string;
      latitude?: number;
      longitude?: number;
      plotId?: string;
      plantingAreaCode?: string;
    }
  ) {
    return this.auth.registerFarmer(input);
  }

  @Post("farmer/login")
  @ApiOperation({ summary: "Đăng nhập tài khoản Nông hộ bằng số điện thoại" })
  async loginFarmer(@Body() input: { phone: string }) {
    return this.auth.loginFarmer(input.phone);
  }

  @Post("collector/register")
  @ApiOperation({ summary: "Đăng ký tài khoản Thương lái / Điểm thu mua" })
  async registerCollector(
    @Body()
    input: {
      phone: string;
      name: string;
      organization?: string;
    }
  ) {
    return this.auth.registerCollector(input);
  }

  @Post("collector/login")
  @ApiOperation({ summary: "Đăng nhập tài khoản Thương lái bằng số điện thoại" })
  async loginCollector(@Body() input: { phone: string }) {
    return this.auth.loginCollector(input.phone);
  }
}
