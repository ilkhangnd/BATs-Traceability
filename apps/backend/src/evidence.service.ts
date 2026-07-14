import { createHash } from "node:crypto";
import { access, mkdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";
import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { StoreService } from "./store.service.js";

export interface UploadedEvidenceFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf"
};

function hasExpectedSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (mimeType === "image/webp") {
    return buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP";
  }
  if (mimeType === "application/pdf") {
    return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  }
  return false;
}

@Injectable()
export class EvidenceService {
  constructor(@Inject(StoreService) private readonly store: StoreService) {}

  async upload(file: UploadedEvidenceFile | undefined, actorId: string) {
    if (!file?.buffer?.length) throw new BadRequestException("Không có file evidence.");
    const extension = EXTENSIONS[file.mimetype];
    if (!extension) {
      throw new BadRequestException("Chỉ chấp nhận JPEG, PNG, WebP hoặc PDF.");
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException("Evidence không được vượt quá 10 MB.");
    }
    if (!hasExpectedSignature(file.buffer, file.mimetype)) {
      throw new BadRequestException("Nội dung file không khớp định dạng đã khai báo.");
    }
    const sha256 = createHash("sha256").update(file.buffer).digest("hex");
    const directory = resolve(process.env.EVIDENCE_STORAGE_PATH ?? "./uploads");
    const filename = `${sha256}.${extension}`;
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, filename), file.buffer, { flag: "wx" }).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code !== "EEXIST") throw error;
      }
    );
    const storageRef = `local://${filename}`;
    await this.store.saveEvidenceUpload({
      sha256,
      type: file.mimetype === "application/pdf" ? "certificate" : "photo",
      storageRef,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      actorId
    });
    return { sha256, storageRef, mimeType: file.mimetype, sizeBytes: file.size };
  }

  async health(): Promise<{ ok: boolean; path: string }> {
    const directory = resolve(process.env.EVIDENCE_STORAGE_PATH ?? "./uploads");
    try {
      await mkdir(directory, { recursive: true });
      await access(directory, constants.R_OK | constants.W_OK);
      return { ok: true, path: directory };
    } catch {
      return { ok: false, path: directory };
    }
  }
}
