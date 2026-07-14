import { Injectable } from "@nestjs/common";

const BUCKETS_MS = [10, 50, 100, 250, 500, 1000, 2000, Number.POSITIVE_INFINITY];

interface Metric {
  count: number;
  sumMs: number;
  buckets: number[];
}

@Injectable()
export class MetricsService {
  private readonly requests = new Map<string, Metric>();

  observe(method: string, route: string, status: number, durationMs: number): void {
    const key = JSON.stringify([method, route, status]);
    const metric = this.requests.get(key) ?? {
      count: 0,
      sumMs: 0,
      buckets: BUCKETS_MS.map(() => 0)
    };
    metric.count += 1;
    metric.sumMs += durationMs;
    BUCKETS_MS.forEach((bucket, index) => {
      if (durationMs <= bucket) metric.buckets[index] = (metric.buckets[index] ?? 0) + 1;
    });
    this.requests.set(key, metric);
  }

  prometheus(): string {
    const lines = [
      "# HELP bats_http_requests_total Total HTTP requests.",
      "# TYPE bats_http_requests_total counter",
      "# HELP bats_http_request_duration_ms HTTP request duration in milliseconds.",
      "# TYPE bats_http_request_duration_ms histogram"
    ];
    for (const [key, metric] of this.requests) {
      const [method, route, status] = JSON.parse(key) as [string, string, number];
      const labels = `method="${this.escape(method)}",route="${this.escape(route)}",status="${status}"`;
      lines.push(`bats_http_requests_total{${labels}} ${metric.count}`);
      BUCKETS_MS.forEach((bucket, index) => {
        const le = Number.isFinite(bucket) ? String(bucket) : "+Inf";
        lines.push(
          `bats_http_request_duration_ms_bucket{${labels},le="${le}"} ${metric.buckets[index]}`
        );
      });
      lines.push(`bats_http_request_duration_ms_sum{${labels}} ${metric.sumMs.toFixed(3)}`);
      lines.push(`bats_http_request_duration_ms_count{${labels}} ${metric.count}`);
    }
    return `${lines.join("\n")}\n`;
  }

  private escape(value: string): string {
    return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"').replaceAll("\n", "\\n");
  }
}
