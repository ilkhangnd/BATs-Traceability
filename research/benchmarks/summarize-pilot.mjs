import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const filePath = resolve("data/pilot-results.json");

if (!existsSync(filePath)) {
  console.log("===============================================================================");
  console.log("📊 BATS Pilot Usability Summary (SUS & TAM)");
  console.log("===============================================================================");
  console.log("Status: NO REAL PARTICIPANT DATA YET.");
  console.log("File path:", filePath);
  console.log("\nTo collect real participant data:");
  console.log("1. Open Zalo Mini App (`pnpm dev` or staging link).");
  console.log("2. Invite 3-5 participants (Nông hộ / HTX or Thu mua) using an approved study protocol.");
  console.log("3. After completing the task, tap [📊 Khảo sát NCKH] or submit through the auto-survey modal.");
  console.log("4. Run `pnpm research:pilot` again to calculate exact real task time, error rate, and SUS score.");
  console.log("===============================================================================");
  process.exit(0);
}

const records = JSON.parse(readFileSync(filePath, "utf8"));
if (records.length === 0) {
  console.log("No records found inside pilot-results.json.");
  process.exit(0);
}

const farmers = records.filter((r) => r.role === "FARMER");
const collectors = records.filter((r) => r.role === "COLLECTOR");

const avg = (arr) => (arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length);
const median = (arr) => {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const farmerTimes = farmers.map((r) => r.taskDurationSec);
const collectorTimes = collectors.map((r) => r.taskDurationSec);
const susScores = records.map((r) => r.susComputedScore);
const errors = records.map((r) => r.firstTryErrors);

console.log("===============================================================================");
console.log("📊 BATS Pilot Field Usability Summary (Real Participant Data)");
console.log("===============================================================================");
console.log(`Total Participants (N):      ${records.length} (${farmers.length} Farmers, ${collectors.length} Collectors)`);
console.log(`Farmer Task Time (T1):       Mean = ${avg(farmerTimes).toFixed(2)}s | Median = ${median(farmerTimes).toFixed(2)}s`);
console.log(`Collector Task Time (T2):    Mean = ${avg(collectorTimes).toFixed(2)}s | Median = ${median(collectorTimes).toFixed(2)}s`);
console.log(`First-Try Error Rate:        ${avg(errors).toFixed(2)} errors/task (${errors.reduce((a, b) => a + b, 0)} total errors)`);
console.log(`System Usability Scale (SUS): Mean = ${avg(susScores).toFixed(2)} / 100 | Median = ${median(susScores).toFixed(2)} / 100`);
console.log(`                             Min = ${Math.min(...susScores).toFixed(2)} | Max = ${Math.max(...susScores).toFixed(2)}`);
console.log("-------------------------------------------------------------------------------");
console.log("Individual Participant Records:");
records.forEach((r, idx) => {
  console.log(`  [#${idx + 1}] ID: ${r.participantId.padEnd(8)} Role: ${r.role.padEnd(10)} Time: ${String(r.taskDurationSec).padStart(3)}s  Errors: ${r.firstTryErrors}  SUS: ${r.susComputedScore}`);
});
console.log("===============================================================================");
