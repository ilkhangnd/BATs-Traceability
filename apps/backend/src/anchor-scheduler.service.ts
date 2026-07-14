import {
  Inject,
  Injectable,
  type OnApplicationBootstrap,
  type OnModuleDestroy
} from "@nestjs/common";
import { AnchorService } from "./anchor.service.js";
import { StoreService } from "./store.service.js";

export type SchedulerResult =
  | { status: "anchored"; date: string }
  | { status: "skipped"; date: string; reason: "no-events" | "confirmed" | "backoff" }
  | { status: "failed"; date: string; error: string };

@Injectable()
export class AnchorSchedulerService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private timer?: NodeJS.Timeout;

  constructor(
    @Inject(AnchorService) private readonly anchors: AnchorService,
    @Inject(StoreService) private readonly store: StoreService
  ) {}

  onApplicationBootstrap(): void {
    if (process.env.ANCHOR_SCHEDULER_ENABLED !== "true") return;
    const intervalMs = positiveInteger(
      process.env.ANCHOR_SCHEDULER_INTERVAL_MS,
      5 * 60_000
    );
    void this.runOnce();
    this.timer = setInterval(() => void this.runOnce(), intervalMs);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async runOnce(date = this.previousBusinessDate()): Promise<SchedulerResult> {
    const tree = this.anchors.dailyTree(date);
    if (tree.leaves.length === 0) {
      return { status: "skipped", date, reason: "no-events" };
    }
    const existing = this.store.anchors.get(date);
    if (existing?.status === "confirmed") {
      return { status: "skipped", date, reason: "confirmed" };
    }
    if (
      existing?.nextAttemptAt &&
      Date.parse(existing.nextAttemptAt) > Date.now()
    ) {
      return { status: "skipped", date, reason: "backoff" };
    }
    try {
      await this.anchors.anchorDate(date);
      return { status: "anchored", date };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        JSON.stringify({
          level: "error",
          type: "anchor_scheduler",
          date,
          error: message,
          timestamp: new Date().toISOString()
        })
      );
      return { status: "failed", date, error: message };
    }
  }

  private previousBusinessDate(): string {
    const previous = new Date(Date.now() - 24 * 60 * 60 * 1_000);
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: process.env.BUSINESS_TIMEZONE ?? "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(previous);
  }
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
