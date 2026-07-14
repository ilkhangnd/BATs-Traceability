import { createHash } from "node:crypto";
import { Injectable } from "@nestjs/common";

function hashPair(left: string, right: string): string {
  return createHash("sha256")
    .update(Buffer.concat([Buffer.from(left, "hex"), Buffer.from(right, "hex")]))
    .digest("hex");
}

@Injectable()
export class MerkleService {
  root(leaves: string[]): string {
    if (leaves.length === 0) return "0".repeat(64);
    let level = [...leaves];
    while (level.length > 1) {
      const next: string[] = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = level[i + 1] ?? left;
        if (left) next.push(hashPair(left, right ?? left));
      }
      level = next;
    }
    return level[0] ?? "0".repeat(64);
  }

  proof(leaves: string[], index: number): string[] {
    const proof: string[] = [];
    let cursor = index;
    let level = [...leaves];
    while (level.length > 1) {
      const siblingIndex = cursor % 2 === 0 ? cursor + 1 : cursor - 1;
      proof.push(level[siblingIndex] ?? level[cursor] ?? "");
      const next: string[] = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = level[i + 1] ?? left;
        if (left) next.push(hashPair(left, right ?? left));
      }
      cursor = Math.floor(cursor / 2);
      level = next;
    }
    return proof;
  }

  verify(leaf: string, proof: string[], index: number, expectedRoot: string): boolean {
    let hash = leaf;
    let cursor = index;
    for (const sibling of proof) {
      hash = cursor % 2 === 0 ? hashPair(hash, sibling) : hashPair(sibling, hash);
      cursor = Math.floor(cursor / 2);
    }
    return hash === expectedRoot;
  }
}
