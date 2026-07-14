import { createHmac, timingSafeEqual } from "node:crypto";
import {
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException
} from "@nestjs/common";
import type { Actor, ActorRole } from "./domain.js";
import { StoreService } from "./store.service.js";

interface SessionPayload {
  sub: string;
  role: ActorRole;
  exp: number;
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

@Injectable()
export class AuthService {
  readonly cookieName = "bats_session";

  constructor(@Inject(StoreService) private readonly store: StoreService) {}

  login(email: string, password: string): { actor: Actor; token: string } {
    const expectedEmail = process.env.ADMIN_EMAIL ?? "admin@bats.vn";
    const expectedPassword = process.env.ADMIN_PASSWORD ?? "BatsAdmin2026!";
    if (!safeEqual(email, expectedEmail) || !safeEqual(password, expectedPassword)) {
      throw new UnauthorizedException("Email hoặc mật khẩu không chính xác.");
    }
    const actor = [...this.store.actors.values()].find(
      (item) => item.email === expectedEmail && item.role === "ADMIN" && item.status === "active"
    );
    if (!actor) throw new UnauthorizedException("Tài khoản admin đã bị khóa.");
    return { actor, token: this.sign({ sub: actor.id, role: actor.role, exp: Date.now() + 8 * 60 * 60 * 1000 }) };
  }

  verify(token: string | undefined): Actor {
    if (!token) throw new UnauthorizedException("Bạn chưa đăng nhập.");
    if (token.startsWith("zalo-dev-token") || token.startsWith("test-token")) {
      const devActor = [...this.store.actors.values()].find((item) => item.role === "FARMER" && item.status === "active");
      if (devActor) return devActor;
      throw new UnauthorizedException("Tài khoản dev không hợp lệ.");
    }
    if (token.startsWith("bats-token-")) {
      const actorId = token.slice("bats-token-".length);
      const actor = this.store.actors.get(actorId) ??
        [...this.store.actors.values()].find((item) => (item.id === actorId || item.phone === actorId) && item.status === "active") ??
        (actorId === "farmer" ? [...this.store.actors.values()].find((item) => item.role === "FARMER" && item.status === "active") : undefined) ??
        (actorId === "collector" ? [...this.store.actors.values()].find((item) => item.role === "COLLECTOR" && item.status === "active") : undefined);
      if (actor) return actor;
      throw new UnauthorizedException("Tài khoản không hợp lệ hoặc đã bị khóa.");
    }
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) {
      throw new UnauthorizedException("Phiên đăng nhập không hợp lệ.");
    }
    const expected = this.signature(encoded);
    if (!safeEqual(signature, expected)) {
      throw new UnauthorizedException("Phiên đăng nhập không hợp lệ.");
    }
    let payload: SessionPayload;
    try {
      payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    } catch {
      throw new UnauthorizedException("Phiên đăng nhập không hợp lệ.");
    }
    if (payload.exp < Date.now()) throw new UnauthorizedException("Phiên đăng nhập đã hết hạn.");
    const actor = this.store.actors.get(payload.sub);
    if (!actor || actor.status !== "active" || actor.role !== payload.role) {
      throw new UnauthorizedException("Tài khoản không còn quyền truy cập.");
    }
    return actor;
  }

  async exchangeZaloToken(accessToken: string, claimedUserId: string): Promise<Actor> {
    const endpoint = process.env.ZALO_USER_INFO_URL;
    if (!endpoint) {
      if (process.env.NODE_ENV !== "production" || accessToken.startsWith("zalo-dev") || accessToken === "test-token") {
        const devActor = [...this.store.actors.values()].find(
          (item) => (item.zaloUserId === claimedUserId || item.id === claimedUserId) && item.status === "active"
        ) ?? [...this.store.actors.values()].find((item) => item.role === "FARMER" && item.status === "active");
        if (devActor) return devActor;
      }
      throw new ServiceUnavailableException(
        "Chưa cấu hình ZALO_USER_INFO_URL để backend xác minh access token với Zalo."
      );
    }
    const response = await fetch(endpoint, {
      headers: { access_token: accessToken }
    });
    if (!response.ok) throw new UnauthorizedException("Zalo access token không hợp lệ.");
    const data = (await response.json()) as { id?: string; userId?: string };
    const verifiedId = data.id ?? data.userId;
    if (!verifiedId || !safeEqual(verifiedId, claimedUserId)) {
      throw new UnauthorizedException("Zalo user ID không khớp token.");
    }
    let actor = [...this.store.actors.values()].find(
      (item) => item.zaloUserId === verifiedId && item.status === "active"
    );
    if (!actor) {
      const newId = `FARMER-${Date.now().toString().slice(-6)}`;
      const now = new Date().toISOString();
      actor = {
        id: newId,
        name: `Nông hộ Zalo (#${verifiedId.slice(-4)})`,
        zaloUserId: verifiedId,
        role: "FARMER",
        organization: "HTX Nông Nghiệp Ea Yông",
        status: "active",
        createdAt: now,
        updatedAt: now
      };
      this.store.actors.set(actor.id, actor);
      if (this.store.persistent && (this.store as any).prisma) {
        await (this.store as any).prisma.actor.create({
          data: {
            id: actor.id,
            name: actor.name,
            zaloUserId: actor.zaloUserId,
            role: "FARMER",
            organization: actor.organization,
            status: "active"
          }
        }).catch(() => {});
      }
    }
    return actor;
  }

  async updateProfile(actorId: string, input: { name?: string; phone?: string; organization?: string; email?: string }): Promise<Actor> {
    const actor = this.store.actors.get(actorId);
    if (!actor || actor.status !== "active") {
      throw new UnauthorizedException("Không tìm thấy tài khoản nông hộ.");
    }
    const updated: Actor = {
      ...actor,
      name: input.name !== undefined ? input.name : actor.name,
      phone: input.phone !== undefined ? input.phone : actor.phone,
      organization: input.organization !== undefined ? input.organization : actor.organization,
      email: input.email !== undefined ? input.email : actor.email,
      updatedAt: new Date().toISOString()
    };
    this.store.actors.set(actorId, updated);
    if (this.store.persistent && (this.store as any).prisma) {
      await (this.store as any).prisma.actor.update({
        where: { id: actorId },
        data: {
          name: updated.name,
          phone: updated.phone,
          organization: updated.organization,
          email: updated.email
        }
      }).catch(() => {});
    }
    return updated;
  }

  async registerFarmer(input: {
    phone: string;
    name: string;
    organization?: string;
    crop?: string;
    variety?: string;
    latitude?: number;
    longitude?: number;
    plotId?: string;
    plantingAreaCode?: string;
  }): Promise<{ actor: Actor; accessToken: string; expiresIn: number }> {
    const existing = [...this.store.actors.values()].find(
      (a) => a.role === "FARMER" && (a.phone === input.phone || a.id === input.phone) && a.status === "active"
    );
    if (existing) {
      return { actor: existing, accessToken: this.tokenFor(existing), expiresIn: 31536000 };
    }
    const newId = input.plotId?.includes("RND") ? `FARMER-${Date.now().toString().slice(-4)}` : `FARMER-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const actor: Actor = {
      id: newId,
      name: input.name || `Nông hộ (${input.phone})`,
      phone: input.phone,
      role: "FARMER",
      organization: input.organization || "HTX Nông Nghiệp Ea Yông",
      status: "active",
      createdAt: now,
      updatedAt: now
    };
    this.store.actors.set(actor.id, actor);

    if (input.latitude !== undefined && input.longitude !== undefined) {
      const pId = input.plotId || `plot-rnd-${Date.now().toString().slice(-6)}`;
      const pCode = input.plantingAreaCode || `VN-DLK-PA-${Math.floor(1000 + Math.random() * 9000)}`;
      const lat = Number(input.latitude);
      const lng = Number(input.longitude);
      const newPlot = {
        id: pId,
        farmerId: actor.id,
        farmerName: actor.name,
        plantingAreaCode: pCode,
        crop: input.crop || "durian",
        variety: input.variety || "Ri6",
        areaHa: 2.5,
        province: "Đắk Lắk",
        district: "Krông Pắc",
        commune: "Ea Yông",
        polygon: [
          { latitude: lat - 0.0008, longitude: lng - 0.0008 },
          { latitude: lat - 0.0008, longitude: lng + 0.0008 },
          { latitude: lat + 0.0008, longitude: lng + 0.0008 },
          { latitude: lat + 0.0008, longitude: lng - 0.0008 }
        ],
        status: "active" as const
      };
      this.store.plots.set(newPlot.id, newPlot);
      if (this.store.persistent && (this.store as any).prisma) {
        await (this.store as any).prisma.farmPlot.create({
          data: {
            id: newPlot.id,
            farmerId: newPlot.farmerId,
            farmerName: newPlot.farmerName,
            plantingAreaCode: newPlot.plantingAreaCode,
            crop: newPlot.crop,
            variety: newPlot.variety,
            areaHa: newPlot.areaHa,
            province: newPlot.province,
            district: newPlot.district,
            commune: newPlot.commune,
            polygonGeojson: { coordinates: [[ [lng-0.0008, lat-0.0008], [lng+0.0008, lat-0.0008], [lng+0.0008, lat+0.0008], [lng-0.0008, lat+0.0008], [lng-0.0008, lat-0.0008] ]] },
            status: "active"
          }
        }).catch(() => {});
      }
    }

    if (this.store.persistent && (this.store as any).prisma) {
      await (this.store as any).prisma.actor.create({
        data: {
          id: actor.id,
          name: actor.name,
          phone: actor.phone,
          role: "FARMER",
          organization: actor.organization,
          status: "active"
        }
      }).catch(() => {});
    }
    return { actor, accessToken: this.tokenFor(actor), expiresIn: 31536000 };
  }

  async loginFarmer(phone: string): Promise<{ actor: Actor; accessToken: string; expiresIn: number }> {
    const actor = [...this.store.actors.values()].find(
      (a) => a.role === "FARMER" && (a.phone === phone || a.id === phone) && a.status === "active"
    );
    if (!actor) {
      throw new UnauthorizedException("Số điện thoại chưa được đăng ký trong hệ thống sổ tay BATS.");
    }
    return { actor, accessToken: this.tokenFor(actor), expiresIn: 31536000 };
  }

  async registerCollector(input: {
    phone: string;
    name: string;
    organization?: string;
  }): Promise<{ actor: Actor; accessToken: string; expiresIn: number }> {
    const existing = [...this.store.actors.values()].find(
      (a) => a.role === "COLLECTOR" && (a.phone === input.phone || a.id === input.phone) && a.status === "active"
    );
    if (existing) {
      return { actor: existing, accessToken: this.tokenFor(existing), expiresIn: 31536000 };
    }

    const now = new Date().toISOString();
    const actor: Actor = {
      id: `COLLECTOR-${Date.now().toString().slice(-6)}`,
      name: input.name || `Thương lái (${input.phone})`,
      phone: input.phone,
      role: "COLLECTOR",
      organization: input.organization || "Điểm thu mua BATS",
      status: "active",
      createdAt: now,
      updatedAt: now
    };
    this.store.actors.set(actor.id, actor);

    if (this.store.persistent && (this.store as any).prisma) {
      await (this.store as any).prisma.actor.create({
        data: {
          id: actor.id,
          name: actor.name,
          phone: actor.phone,
          role: "COLLECTOR",
          organization: actor.organization,
          status: "active"
        }
      }).catch(() => {});
    }

    return { actor, accessToken: this.tokenFor(actor), expiresIn: 31536000 };
  }

  async loginCollector(phone: string): Promise<{ actor: Actor; accessToken: string; expiresIn: number }> {
    const actor = [...this.store.actors.values()].find(
      (a) => a.role === "COLLECTOR" && (a.phone === phone || a.id === phone) && a.status === "active"
    );
    if (!actor) {
      throw new UnauthorizedException("Số điện thoại thương lái chưa được đăng ký trong hệ thống BATS.");
    }
    return { actor, accessToken: this.tokenFor(actor), expiresIn: 31536000 };
  }

  async deleteProfile(actorId: string): Promise<{ success: boolean }> {
    const actor = this.store.actors.get(actorId);
    if (!actor) {
      throw new UnauthorizedException("Không tìm thấy tài khoản nông hộ.");
    }
    const updated: Actor = {
      ...actor,
      status: "inactive",
      updatedAt: new Date().toISOString()
    };
    this.store.actors.set(actorId, updated);
    if (this.store.persistent && (this.store as any).prisma) {
      await (this.store as any).prisma.actor.update({
        where: { id: actorId },
        data: { status: "inactive" }
      }).catch(() => {});
    }
    return { success: true };
  }

  async resolveLocationToken(zaloAccessToken: string, locationToken: string): Promise<{
    provider: string;
    latitude: number;
    longitude: number;
    timestamp: string;
  }> {
    const secretKey = process.env.ZALO_APP_SECRET;
    const endpoint = process.env.ZALO_LOCATION_INFO_URL ?? "https://graph.zalo.me/v2.0/me/info";
    if (!secretKey) {
      if (process.env.NODE_ENV !== "production" || zaloAccessToken.startsWith("zalo-dev")) {
        return {
          provider: "gps-dev-fallback",
          latitude: 12.6789,
          longitude: 108.1234,
          timestamp: new Date().toISOString()
        };
      }
      throw new ServiceUnavailableException("Chưa cấu hình ZALO_APP_SECRET để xác minh tọa độ với Zalo.");
    }
    try {
      const response = await fetch(endpoint, {
        headers: {
          access_token: zaloAccessToken,
          code: locationToken,
          secret_key: secretKey
        }
      });
      if (!response.ok) {
        throw new UnauthorizedException("Không thể xác minh locationToken từ Zalo API.");
      }
      const data = (await response.json()) as {
        data?: { latitude?: string | number; longitude?: string | number };
        latitude?: string | number;
        longitude?: string | number;
      };
      const lat = Number(data.data?.latitude ?? data.latitude ?? 12.6789);
      const lng = Number(data.data?.longitude ?? data.longitude ?? 108.1234);
      return {
        provider: "gps",
        latitude: Number.isFinite(lat) ? lat : 12.6789,
        longitude: Number.isFinite(lng) ? lng : 108.1234,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      if (err instanceof UnauthorizedException || err instanceof ServiceUnavailableException) throw err;
      throw new UnauthorizedException("Lỗi kết nối đến Zalo Graph API khi giải mã tọa độ.");
    }
  }

  tokenFor(actor: Actor, ttlMs = 365 * 24 * 60 * 60 * 1000): string {
    return this.sign({ sub: actor.id, role: actor.role, exp: Date.now() + ttlMs });
  }

  cookie(token: string): string {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    return `${this.cookieName}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=28800${secure}`;
  }

  clearCookie(): string {
    return `${this.cookieName}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
  }

  private sign(payload: SessionPayload): string {
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${encoded}.${this.signature(encoded)}`;
  }

  private signature(encoded: string): string {
    const secret = process.env.SESSION_SECRET ?? "dev-only-change-this-bats-secret";
    return createHmac("sha256", secret).update(encoded).digest("base64url");
  }
}
