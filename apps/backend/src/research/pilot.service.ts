import { Injectable, Logger } from "@nestjs/common";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export interface PilotSubmissionDto {
  participantId: string; // e.g. "P1"
  role: "FARMER" | "COLLECTOR";
  taskDurationSec: number;
  firstTryErrors: number;
  susScores: number[]; // exactly 10 integers (1 to 5)
  tamScores?: number[]; // optional TAM scores (1 to 5)
  notes?: string;
  submittedAt?: string;
}

export interface PilotResultRecord extends PilotSubmissionDto {
  susComputedScore: number; // 0 to 100
  submittedAt: string;
}

@Injectable()
export class PilotResearchService {
  private readonly logger = new Logger(PilotResearchService.name);
  private readonly filePath = resolve(
    process.cwd(),
    "../../research/field-study/pilot-results.json"
  );

  constructor() {
    this.ensureDirectory();
  }

  private ensureDirectory() {
    const dir = resolve(this.filePath, "..");
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  private calculateSus(scores: number[]): number {
    if (!scores || scores.length !== 10) return 0;
    let total = 0;
    for (let i = 0; i < 10; i++) {
      const qNum = i + 1;
      const score = scores[i] || 3;
      if (qNum % 2 !== 0) {
        // odd: score - 1
        total += Math.max(0, score - 1);
      } else {
        // even: 5 - score
        total += Math.max(0, 5 - score);
      }
    }
    return total * 2.5;
  }

  private loadRecords(): PilotResultRecord[] {
    if (!existsSync(this.filePath)) {
      return [];
    }
    try {
      const content = readFileSync(this.filePath, "utf8");
      return JSON.parse(content) as PilotResultRecord[];
    } catch (e) {
      this.logger.error("Failed to load pilot-results.json", e);
      return [];
    }
  }

  private saveRecords(records: PilotResultRecord[]) {
    this.ensureDirectory();
    writeFileSync(this.filePath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  }

  async submitPilotResult(dto: PilotSubmissionDto): Promise<{ success: boolean; record: PilotResultRecord; totalRecords: number }> {
    const records = this.loadRecords();
    const susComputedScore = this.calculateSus(dto.susScores);
    const record: PilotResultRecord = {
      ...dto,
      susComputedScore,
      submittedAt: dto.submittedAt || new Date().toISOString()
    };

    // Replace if participantId exists or append
    const existingIdx = records.findIndex((r) => r.participantId.toUpperCase() === record.participantId.toUpperCase());
    if (existingIdx >= 0) {
      records[existingIdx] = record;
    } else {
      records.push(record);
    }

    this.saveRecords(records);
    this.logger.log(`Saved pilot submission for ${record.participantId} (Role: ${record.role}, SUS: ${susComputedScore})`);
    return { success: true, record, totalRecords: records.length };
  }

  async getSummary(): Promise<any> {
    const records = this.loadRecords();
    if (records.length === 0) {
      return {
        totalRecords: 0,
        message: "No real pilot records yet. Execute physical walkthrough with 3-5 participants and submit via /api/research/pilot or Zalo Mini App UI."
      };
    }

    const farmers = records.filter((r) => r.role === "FARMER");
    const collectors = records.filter((r) => r.role === "COLLECTOR");

    const median = (arr: number[]): number => {
      if (arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const valMid = sorted[mid] ?? 0;
      const valMidPrev = sorted[mid - 1] ?? 0;
      return sorted.length % 2 !== 0 ? valMid : (valMidPrev + valMid) / 2;
    };

    const avg = (arr: number[]): number => (arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length);

    const farmerTaskTimes = farmers.map((r) => r.taskDurationSec);
    const collectorTaskTimes = collectors.map((r) => r.taskDurationSec);
    const allSus = records.map((r) => r.susComputedScore);
    const allErrors = records.map((r) => r.firstTryErrors);

    return {
      generatedAt: new Date().toISOString(),
      totalParticipants: records.length,
      farmersCount: farmers.length,
      collectorsCount: collectors.length,
      metrics: {
        farmerTaskDurationSec: {
          mean: avg(farmerTaskTimes).toFixed(2),
          median: median(farmerTaskTimes).toFixed(2)
        },
        collectorTaskDurationSec: {
          mean: avg(collectorTaskTimes).toFixed(2),
          median: median(collectorTaskTimes).toFixed(2)
        },
        firstTryErrors: {
          mean: avg(allErrors).toFixed(2),
          total: allErrors.reduce((a, b) => a + b, 0)
        },
        susScore: {
          mean: avg(allSus).toFixed(2),
          median: median(allSus).toFixed(2),
          min: Math.min(...allSus).toFixed(2),
          max: Math.max(...allSus).toFixed(2)
        }
      },
      records
    };
  }
}
