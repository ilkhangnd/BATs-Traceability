import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { BatsService } from "./bats.service.js";
import { createEpcisDocument } from "@bats/shared-types";

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function pdfText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\x20-\x7e]/g, "?")
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function simplePdf(lines: string[]): Buffer {
  const commands = lines
    .slice(0, 42)
    .map((line, index) => `BT /F1 10 Tf 50 ${790 - index * 17} Td (${pdfText(line)}) Tj ET`)
    .join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(commands)} >>\nstream\n${commands}\nendstream`
  ];
  let document = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(document));
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(document);
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  document += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(document);
}

@Injectable()
export class DossierService {
  constructor(@Inject(BatsService) private readonly bats: BatsService) {}

  async export(gtin: string, lot: string, serial: string, format: string) {
    const trace = await this.bats.verifyIdentity(gtin, lot, serial);
    const dossier = {
      generatedAt: new Date().toISOString(),
      standard: "GS1 EPCIS 2.0-aligned BATS dossier",
      epcisDocument: createEpcisDocument(trace.batch.events),
      ...trace
    };
    if (format === "json") {
      return {
        contentType: "application/json; charset=utf-8",
        extension: "json",
        body: dossier
      };
    }
    if (format === "csv") {
      const rows = [
        ["batch_id", "event_id", "status", "event_time", "actor_id", "event_hash", "proof_valid", "chain_status"],
        ...dossier.batch.events.map((event, index) => [
          dossier.batch.id,
          event.id,
          event.status,
          event.eventTime,
          event.actorId,
          event.eventHash,
          dossier.proofs[index]?.proofValid ?? "",
          dossier.proofs[index]?.chainStatus ?? dossier.anchor.chainStatus
        ])
      ];
      return {
        contentType: "text/csv; charset=utf-8",
        extension: "csv",
        body: `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`
      };
    }
    if (format === "pdf") {
      const lines = [
        "BATS TRACEABILITY DOSSIER",
        `Generated: ${dossier.generatedAt}`,
        `Batch: ${dossier.batch.id}`,
        `GTIN: ${dossier.batch.identity.gtin}`,
        `Variety: ${dossier.batch.variety}`,
        `Quantity: ${dossier.batch.quantityKg} kg`,
        `Risk score: ${dossier.batch.riskScore} (${dossier.batch.riskBand})`,
        `Anchor date: ${dossier.anchor.date}`,
        `Chain status: ${dossier.anchor.chainStatus}`,
        `Merkle root: ${dossier.anchor.merkleRoot}`,
        `Transaction: ${dossier.anchor.txHash ?? "not anchored"}`,
        "",
        ...dossier.batch.events.flatMap((event, index) => [
          `Event ${index + 1}: ${event.status} at ${event.eventTime}`,
          `Actor: ${event.actorId}`,
          `Hash: ${event.eventHash}`,
          `Proof valid: ${dossier.proofs[index]?.proofValid ?? "not evaluated"}`
        ])
      ];
      return {
        contentType: "application/pdf",
        extension: "pdf",
        body: simplePdf(lines)
      };
    }
    throw new BadRequestException("Định dạng export phải là json, csv hoặc pdf.");
  }
}
