import { describe, expect, it } from "vitest";
import { MetricsService } from "./metrics.service.js";

describe("MetricsService", () => {
  it("exports cumulative Prometheus counters and duration buckets", () => {
    const metrics = new MetricsService();
    metrics.observe("GET", "/health", 200, 12.5);
    metrics.observe("GET", "/health", 200, 75);
    const output = metrics.prometheus();
    expect(output).toContain(
      'bats_http_requests_total{method="GET",route="/health",status="200"} 2'
    );
    expect(output).toContain('le="100"} 2');
    expect(output).toContain("bats_http_request_duration_ms_sum");
  });
});
