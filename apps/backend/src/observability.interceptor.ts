import { randomUUID } from "node:crypto";
import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Inject,
  Injectable,
  NestInterceptor
} from "@nestjs/common";
import { catchError, finalize, throwError, type Observable } from "rxjs";
import { MetricsService } from "./metrics.service.js";

interface HttpRequest {
  method: string;
  url: string;
  baseUrl?: string;
  route?: { path?: string };
  headers: Record<string, string | string[] | undefined>;
  requestId?: string;
}

interface HttpResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
}

@Injectable()
export class ObservabilityInterceptor implements NestInterceptor {
  constructor(@Inject(MetricsService) private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<HttpRequest>();
    const response = http.getResponse<HttpResponse>();
    const supplied = request.headers["x-request-id"];
    const requestId =
      (Array.isArray(supplied) ? supplied[0] : supplied)?.slice(0, 128) || randomUUID();
    request.requestId = requestId;
    response.setHeader("X-Request-Id", requestId);
    const started = performance.now();
    let errorStatus: number | undefined;
    return next.handle().pipe(
      catchError((error: unknown) => {
        errorStatus = error instanceof HttpException ? error.getStatus() : 500;
        return throwError(() => error);
      }),
      finalize(() => {
        const durationMs = performance.now() - started;
        const route =
          `${request.baseUrl ?? ""}${request.route?.path ?? request.url.split("?")[0]}` || "/";
        const status = errorStatus ?? response.statusCode;
        this.metrics.observe(request.method, route, status, durationMs);
        console.log(
          JSON.stringify({
            level: status >= 500 ? "error" : status >= 400 ? "warn" : "info",
            type: "http_request",
            requestId,
            method: request.method,
            route,
            status,
            durationMs: Number(durationMs.toFixed(3)),
            timestamp: new Date().toISOString()
          })
        );
      })
    );
  }
}
