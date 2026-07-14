import type { ExecutionContext } from "@nestjs/common";
import { lastValueFrom, of } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import { RateLimitInterceptor } from "./rate-limit.guard.js";

function context() {
  const response = { setHeader: vi.fn() };
  return {
    response,
    execution: {
      switchToHttp: () => ({
        getRequest: () => ({
          ip: "127.0.0.1",
          headers: {},
          socket: { remoteAddress: "127.0.0.1" }
        }),
        getResponse: () => response
      })
    } as unknown as ExecutionContext
  };
}

describe("RateLimitGuard", () => {
  it("allows the configured quota and rejects the next request", async () => {
    const previous = process.env.RATE_LIMIT_MAX;
    process.env.RATE_LIMIT_MAX = "2";
    const interceptor = new RateLimitInterceptor();
    const next = { handle: () => of(true) };
    const first = context();
    const second = context();
    const third = context();

    await expect(lastValueFrom(interceptor.intercept(first.execution, next))).resolves.toBe(true);
    await expect(lastValueFrom(interceptor.intercept(second.execution, next))).resolves.toBe(true);
    expect(() => interceptor.intercept(third.execution, next)).toThrow("Quá nhiều yêu cầu");
    expect(second.response.setHeader).toHaveBeenCalledWith("X-RateLimit-Remaining", "0");

    if (previous === undefined) delete process.env.RATE_LIMIT_MAX;
    else process.env.RATE_LIMIT_MAX = previous;
  });
});
