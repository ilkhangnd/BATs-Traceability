import { BadRequestException, type CallHandler, type ExecutionContext } from "@nestjs/common";
import { lastValueFrom, of, throwError } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import { MetricsService } from "./metrics.service.js";
import { ObservabilityInterceptor } from "./observability.interceptor.js";

function context(statusCode = 200): ExecutionContext {
  const request = {
    method: "GET",
    url: "/verify/invalid",
    baseUrl: "",
    route: { path: "/verify/:gtin" },
    headers: {}
  };
  const response = {
    statusCode,
    setHeader: vi.fn()
  };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response
    })
  } as unknown as ExecutionContext;
}

describe("ObservabilityInterceptor", () => {
  it("records the response status for successful requests", async () => {
    const metrics = new MetricsService();
    const interceptor = new ObservabilityInterceptor(metrics);
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await lastValueFrom(
      interceptor.intercept(context(201), { handle: () => of({ ok: true }) } as CallHandler)
    );

    expect(metrics.prometheus()).toContain('status="201"');
    expect(JSON.parse(String(log.mock.calls[0]?.[0]))).toMatchObject({
      level: "info",
      status: 201
    });
    log.mockRestore();
  });

  it("records the HttpException status before the Nest exception filter runs", async () => {
    const metrics = new MetricsService();
    const interceptor = new ObservabilityInterceptor(metrics);
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await expect(
      lastValueFrom(
        interceptor.intercept(context(), {
          handle: () => throwError(() => new BadRequestException("invalid GTIN"))
        } as CallHandler)
      )
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(metrics.prometheus()).toContain('status="400"');
    expect(JSON.parse(String(log.mock.calls[0]?.[0]))).toMatchObject({
      level: "warn",
      status: 400
    });
    log.mockRestore();
  });
});
