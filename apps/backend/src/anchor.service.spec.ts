import { describe, expect, it } from "vitest";
import { AnchorService } from "./anchor.service.js";
import { BatsService } from "./bats.service.js";
import { MerkleService } from "./merkle.service.js";
import { StoreService } from "./store.service.js";
import { ValidationService } from "./validation.service.js";

describe("AnchorService", () => {
  it("builds deterministic daily proofs that verify locally", async () => {
    const store = new StoreService();
    const merkle = new MerkleService();
    const bats = new BatsService(store, new ValidationService(), merkle);
    const anchors = new AnchorService(store, merkle);
    await bats.onModuleInit();
    const batch = await bats.createHarvest({
      farmPlotId: "plot-dlk-0001",
      actorId: "FARMER-0001",
      variety: "Ri6",
      quantityKg: 1250,
      eventTime: "2026-07-04T08:30:00+07:00",
      location: { latitude: 12.6789, longitude: 108.1234 }
    });
    const tree = anchors.dailyTree("2026-07-04");
    const result = await anchors.verification(batch);
    expect(tree.leaves).toHaveLength(1);
    expect(tree.merkleRoot).toHaveLength(64);
    expect(result.proofs[0]?.leafIndex).toBe(0);
    expect(result.proofs[0]?.proofValid).toBe(true);
    expect(result.anchor.chainStatus).toBe("local-proof");
  });
});
