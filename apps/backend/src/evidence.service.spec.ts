import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { EvidenceService } from "./evidence.service.js";
import { StoreService } from "./store.service.js";

describe("EvidenceService", () => {
  it("hashes an allowed file and stores it under a content-addressed name", async () => {
    const directory = `/tmp/bats-evidence-test-${process.pid}`;
    process.env.EVIDENCE_STORAGE_PATH = directory;
    const service = new EvidenceService(new StoreService());
    const buffer = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
      Buffer.from("synthetic field evidence")
    ]);
    const result = await service.upload(
      {
        buffer,
        mimetype: "image/jpeg",
        originalname: "field.jpg",
        size: buffer.length
      },
      "FARMER-0001"
    );
    expect(result.sha256).toHaveLength(64);
    await expect(readFile(resolve(directory, `${result.sha256}.jpg`))).resolves.toEqual(buffer);
  });

  it("rejects unsupported evidence types", async () => {
    const service = new EvidenceService(new StoreService());
    await expect(
      service.upload(
        {
          buffer: Buffer.from("executable"),
          mimetype: "application/x-msdownload",
          originalname: "bad.exe",
          size: 10
        },
        "FARMER-0001"
      )
    ).rejects.toThrow("Chỉ chấp nhận");
  });
});
