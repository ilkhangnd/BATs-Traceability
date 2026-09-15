import { Injectable } from "@nestjs/common";
import {
  RISK_WEIGHTS,
  riskBand,
  type ValidationIssue,
  type ValidationResult
} from "@bats/shared-types";
import type { Actor, Batch, CreateHarvestInput, FarmPlot, TransferInput } from "./domain.js";

export function pointInPolygon(
  point: { latitude: number; longitude: number },
  polygon: Array<{ latitude: number; longitude: number }>
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if (!a || !b) continue;
    const crosses =
      a.latitude > point.latitude !== b.latitude > point.latitude &&
      point.longitude <
        ((b.longitude - a.longitude) * (point.latitude - a.latitude)) /
          (b.latitude - a.latitude) +
          a.longitude;
    if (crosses) inside = !inside;
  }
  return inside;
}

function summarize(issues: ValidationIssue[]): ValidationResult {
  const score = Math.min(100, issues.reduce((total, issue) => total + issue.score, 0));
  return {
    score,
    band: riskBand(score),
    accepted: !issues.some((issue) => issue.severity === "block"),
    issues
  };
}

@Injectable()
export class ValidationService {
  validateHarvest(
    input: CreateHarvestInput,
    plot: FarmPlot,
    knownEvidence: Set<string>,
    recentBatches: Batch[],
    geofenceContains?: boolean,
    actor?: Actor
  ): ValidationResult {
    const issues: ValidationIssue[] = [];
    if (plot.status !== "active") {
      issues.push({
        code: "S",
        severity: "block",
        score: RISK_WEIGHTS.S,
        message: "Vùng trồng đang chờ hợp tác xã hoặc quản trị viên phê duyệt."
      });
    }
    if (!(geofenceContains ?? pointInPolygon(input.location, plot.polygon))) {
      issues.push({
        code: "G",
        severity: "block",
        score: RISK_WEIGHTS.G,
        message: "Vị trí thu hoạch nằm ngoài vùng trồng đã đăng ký."
      });
    }

    const seasonalYieldKg = recentBatches
      .filter((batch) => batch.farmPlotId === plot.id)
      .reduce((sum, batch) => sum + batch.quantityKg, 0);
    const maxYieldKg = plot.areaHa * 20_000;
    if (seasonalYieldKg + input.quantityKg > maxYieldKg) {
      issues.push({
        code: "Y",
        severity: "warning",
        score: RISK_WEIGHTS.Y,
        message: `Sản lượng vượt ngưỡng ${maxYieldKg.toLocaleString("vi-VN")} kg/mùa của vùng trồng.`
      });
    }

    if ((input.evidenceHashes ?? []).some((hash) => knownEvidence.has(hash))) {
      issues.push({
        code: "D",
        severity: "block",
        score: RISK_WEIGHTS.D,
        message: "Bằng chứng ảnh hoặc phiếu cân đã được dùng cho lô khác."
      });
    }

    const eventMs = Date.parse(input.eventTime);
    const tooManyNearby = recentBatches.filter(
      (batch) =>
        batch.farmerId === plot.farmerId &&
        Math.abs(Date.parse(batch.createdAt) - eventMs) < 10 * 60 * 1000
    ).length;
    if (tooManyNearby >= 3) {
      issues.push({
        code: "T",
        severity: "warning",
        score: RISK_WEIGHTS.T,
        message: "Có quá nhiều lô được tạo trong vòng 10 phút."
      });
    }

    if (
      actor &&
      (actor.status !== "active" ||
        !["FARMER", "COOPERATIVE", "ADMIN"].includes(actor.role) ||
        (actor.role === "FARMER" && actor.id !== plot.farmerId))
    ) {
      issues.push({
        code: "R",
        severity: "block",
        score: RISK_WEIGHTS.R,
        message: "Actor không có quyền ghi nhận thu hoạch cho vùng trồng này."
      });
    }

    const device = input.device;
    if (
      device?.integrity === "compromised" ||
      (device?.gpsAccuracyM !== undefined && device.gpsAccuracyM > 100)
    ) {
      issues.push({
        code: "A",
        severity: device.integrity === "compromised" ? "block" : "warning",
        score: RISK_WEIGHTS.A,
        message:
          device.integrity === "compromised"
            ? "Thiết bị báo trạng thái integrity không an toàn."
            : "Độ chính xác GPS thấp hơn ngưỡng tin cậy 100 mét."
      });
    }
    return summarize(issues);
  }

  validateTransfer(batch: Batch, input: TransferInput): ValidationResult {
    const order = ["harvested", "collected", "packed", "shipped"];
    const issues: ValidationIssue[] = [];
    if (order.indexOf(input.status) !== order.indexOf(batch.status) + 1) {
      issues.push({
        code: "T",
        severity: "block",
        score: 100,
        message: `Không thể chuyển trực tiếp từ ${batch.status} sang ${input.status}.`
      });
    }
    if (
      input.actualWeightKg &&
      Math.abs(input.actualWeightKg - batch.quantityKg) / batch.quantityKg > 0.1
    ) {
      issues.push({
        code: "W",
        severity: "warning",
        score: RISK_WEIGHTS.W,
        message: "Khối lượng cân thực tế lệch quá 10% so với khối lượng khai báo."
      });
    }
    return summarize(issues);
  }
}
