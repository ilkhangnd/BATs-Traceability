import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  SetMetadata,
  UnauthorizedException
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Actor, ActorRole } from "./domain.js";
import { AuthService } from "./auth.service.js";

const ROLES_KEY = "bats:roles";

export const Roles = (...roles: ActorRole[]) => SetMetadata(ROLES_KEY, roles);

export interface ActorRequest {
  headers: { authorization?: string; cookie?: string; [key: string]: string | undefined };
  actor?: Actor;
}

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(Reflector) private readonly reflector: Reflector
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<ActorRequest>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Thiếu Bearer access token.");
    }
    const actor = this.auth.verify(authorization.slice("Bearer ".length).trim());
    const roles = this.reflector.getAllAndOverride<ActorRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (roles?.length && !roles.includes(actor.role)) {
      throw new ForbiddenException("Vai trò hiện tại không được phép thực hiện thao tác này.");
    }
    request.actor = actor;
    return true;
  }
}
