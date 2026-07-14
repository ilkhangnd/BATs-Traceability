import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor
} from "@nestjs/common";
import type { Observable } from "rxjs";

interface Bucket {
  count: number;
  resetAt: number;
}

interface RateLimitRequest {
  ip?: string;
  socket?: { remoteAddress?: string };
  headers: Record<string, string | string[] | undefined>;
}

interface RateLimitResponse {
  setHeader(name: string, value: string): void;
}

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly buckets = new Map<string, Bucket>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const max = positiveInteger(process.env.RATE_LIMIT_MAX, 120);
    if (max === 0) return next.handle();
    const windowMs = positiveInteger(process.env.RATE_LIMIT_WINDOW_MS, 60_000);
    const request = context.switchToHttp().getRequest<RateLimitRequest>();
    const response = context.switchToHttp().getResponse<RateLimitResponse>();
    const now = Date.now();
    const key = this.clientKey(request);
    const current = this.buckets.get(key);
    const bucket =
      !current || current.resetAt <= now
        ? { count: 0, resetAt: now + windowMs }
        : current;
    bucket.count += 1;
    this.buckets.set(key, bucket);

    response.setHeader("X-RateLimit-Limit", String(max));
    response.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - bucket.count)));
    response.setHeader("X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      throw new HttpException(
        "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    if (this.buckets.size > 1_000) this.removeExpired(now);
    return next.handle();
  }

  private clientKey(request: RateLimitRequest): string {
    if (process.env.TRUST_PROXY === "true") {
      const forwarded = request.headers["x-forwarded-for"];
      const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      const first = value?.split(",")[0]?.trim();
      if (first) return first;
    }
    return request.ip ?? request.socket?.remoteAddress ?? "unknown";
  }

  private removeExpired(now: number): void {
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
}

function positiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}
