import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { MerkleService } from "./merkle.service.js";

describe("MerkleService", () => {
  it("creates a deterministic root and proof for event hashes", () => {
    const leaves = ["a", "b", "c"].map((value) =>
      createHash("sha256").update(value).digest("hex")
    );
    const service = new MerkleService();
    const root = service.root(leaves);
    const proof = service.proof(leaves, 1);
    expect(root).toHaveLength(64);
    expect(root).toBe(service.root(leaves));
    expect(proof).toHaveLength(2);
    expect(service.verify(leaves[1] ?? "", proof, 1, root)).toBe(true);
    expect(service.verify(leaves[0] ?? "", proof, 1, root)).toBe(false);
  });
});
