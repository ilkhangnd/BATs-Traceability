import { describe, expect, it, vi } from "vitest";
import { AnchorSchedulerService } from "./anchor-scheduler.service.js";
import type { AnchorService } from "./anchor.service.js";
import { StoreService } from "./store.service.js";

describe("AnchorSchedulerService", () => {
  it("skips dates without events and respects persisted backoff", async () => {
    const store = new StoreService();
    const anchor = {
      dailyTree: vi.fn(() => ({ leaves: ["a"], events: [], merkleRoot: "a" })),
      anchorDate: vi.fn()
    } as unknown as AnchorService;
    const scheduler = new AnchorSchedulerService(anchor, store);
    store.anchors.set("2026-07-05", {
      date: "2026-07-05",
      merkleRoot: "a",
      schemaVersion: "test",
      status: "failed",
      nextAttemptAt: new Date(Date.now() + 60_000).toISOString()
    });
    await expect(scheduler.runOnce("2026-07-05")).resolves.toEqual({
      status: "skipped",
      date: "2026-07-05",
      reason: "backoff"
    });
    expect(anchor.anchorDate).not.toHaveBeenCalled();

    anchor.dailyTree = vi.fn((date: string) => ({
      date,
      leaves: [],
      events: [],
      merkleRoot: "0"
    }));
    await expect(scheduler.runOnce("2026-07-04")).resolves.toEqual({
      status: "skipped",
      date: "2026-07-04",
      reason: "no-events"
    });
  });

  it("anchors an eligible date", async () => {
    const store = new StoreService();
    const anchor = {
      dailyTree: vi.fn(() => ({ leaves: ["a"], events: [], merkleRoot: "a" })),
      anchorDate: vi.fn(async () => ({ status: "confirmed" }))
    } as unknown as AnchorService;
    const scheduler = new AnchorSchedulerService(anchor, store);
    await expect(scheduler.runOnce("2026-07-05")).resolves.toEqual({
      status: "anchored",
      date: "2026-07-05"
    });
  });
});
