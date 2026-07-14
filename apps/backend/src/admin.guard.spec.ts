import { describe, expect, it } from "vitest";
import { assertCsrfOrigin } from "./admin.guard.js";

describe("admin CSRF origin policy", () => {
  it("accepts safe requests and configured origins", () => {
    const previous = process.env.WEB_ORIGINS;
    process.env.WEB_ORIGINS = "https://admin.bats.vn";
    expect(() =>
      assertCsrfOrigin({ method: "GET", headers: { origin: "https://evil.example" } })
    ).not.toThrow();
    expect(() =>
      assertCsrfOrigin({ method: "POST", headers: { origin: "https://admin.bats.vn" } })
    ).not.toThrow();
    if (previous === undefined) delete process.env.WEB_ORIGINS;
    else process.env.WEB_ORIGINS = previous;
  });

  it("rejects a cross-site mutation", () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousOrigins = process.env.WEB_ORIGINS;
    process.env.NODE_ENV = "production";
    process.env.WEB_ORIGINS = "https://admin.bats.vn";
    expect(() =>
      assertCsrfOrigin({ method: "DELETE", headers: { origin: "https://evil.example" } })
    ).toThrow("Origin không hợp lệ");
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousOrigins === undefined) delete process.env.WEB_ORIGINS;
    else process.env.WEB_ORIGINS = previousOrigins;
  });
});
