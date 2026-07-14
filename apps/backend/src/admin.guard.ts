import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import type { Actor } from "./domain.js";
import { AuthService } from "./auth.service.js";

export interface AdminRequest {
  method: string;
  headers: { cookie?: string; origin?: string };
  actor?: Actor;
}

function readCookie(header: string | undefined, name: string): string | undefined {
  return header
    ?.split(";")
    .map((item) => item.trim().split("="))
    .find(([key]) => key === name)
    ?.slice(1)
    .join("=");
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    assertCsrfOrigin(request);
    const actor = this.auth.verify(readCookie(request.headers.cookie, this.auth.cookieName));
    if (actor.role !== "ADMIN") throw new UnauthorizedException("Chỉ admin được phép thao tác.");
    request.actor = actor;
    return true;
  }
}

export function assertCsrfOrigin(request: Pick<AdminRequest, "method" | "headers">): void {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) return;
  const origin = request.headers.origin;
  if (!origin) return;
  const allowed = (process.env.WEB_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const localDevelopmentOrigin =
    process.env.NODE_ENV !== "production" &&
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (!allowed.includes(origin) && !localDevelopmentOrigin) {
    throw new ForbiddenException("Origin không hợp lệ cho thao tác quản trị.");
  }
}
