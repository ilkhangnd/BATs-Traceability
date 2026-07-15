import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Simulate BATS Idempotency and Offline Queue Replay Engine
class SimulatedHarvestRepository {
  constructor() {
    this.idempotencyStore = new Map(); // key -> batchId
    this.batches = new Map(); // batchId -> Batch
    this.actorBatches = new Map(); // actorId -> Set<batchId>
  }

  submitHarvest(input, idempotencyKey) {
    if (this.idempotencyStore.has(idempotencyKey)) {
      const existingBatchId = this.idempotencyStore.get(idempotencyKey);
      return {
        status: "DUPLICATE_PREVENTED",
        batchId: existingBatchId,
        created: false,
        message: "Idempotent hit: returning existing anchored/queued batch"
      };
    }

    const batchId = `BATCH-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const batchRecord = {
      batchId,
      idempotencyKey,
      actorId: input.actorId,
      quantityKg: input.quantityKg,
      variety: input.variety,
      submittedAt: new Date().toISOString()
    };

    this.idempotencyStore.set(idempotencyKey, batchId);
    this.batches.set(batchId, batchRecord);

    if (!this.actorBatches.has(input.actorId)) {
      this.actorBatches.set(input.actorId, new Set());
    }
    this.actorBatches.get(input.actorId).add(batchId);

    return {
      status: "CREATED",
      batchId,
      created: true,
      message: "New batch created successfully"
    };
  }

  getBatchCount() {
    return this.batches.size;
  }
}

function runIdempotencySimulation() {
  const outputDir = resolve("research/results");
  mkdirSync(outputDir, { recursive: true });

  const repo = new SimulatedHarvestRepository();
  const baseInput = {
    actorId: "FARMER-P1",
    variety: "Ri6",
    quantityKg: 350
  };

  // Scenario 1: Same idempotency key repeated across 10 network retry attempts
  const s1Key = "IDEM-KEY-HARVEST-20260715-001";
  let s1CreatedCount = 0;
  for (let i = 0; i < 10; i++) {
    const res = repo.submitHarvest(baseInput, s1Key);
    if (res.created) s1CreatedCount++;
  }

  // Scenario 2: Offline queue replay (simulate 5 connection drop re-transmissions upon Wi-Fi sync)
  const s2Key = "IDEM-KEY-QUEUE-REPLAY-002";
  let s2CreatedCount = 0;
  for (let i = 0; i < 5; i++) {
    const res = repo.submitHarvest({ ...baseInput, quantityKg: 420 }, s2Key);
    if (res.created) s2CreatedCount++;
  }

  // Scenario 3: Different payload, same actor (5 distinct harvests throughout the day)
  let s3CreatedCount = 0;
  for (let i = 0; i < 5; i++) {
    const s3Key = `IDEM-KEY-DISTINCT-${i + 1}`;
    const res = repo.submitHarvest({ ...baseInput, quantityKg: 100 + i * 50 }, s3Key);
    if (res.created) s3CreatedCount++;
  }

  const simulationResults = [
    {
      scenario: "Same idempotency key",
      attempts: 10,
      createdEvents: s1CreatedCount,
      duplicatePrevented: s1CreatedCount === 1 ? "Yes" : "No",
      description: "Repeated network retries or double-taps on submit button with identical x-idempotency-key header."
    },
    {
      scenario: "Offline queue replay",
      attempts: 5,
      createdEvents: s2CreatedCount,
      duplicatePrevented: s2CreatedCount === 1 ? "Yes" : "No",
      description: "Local SQLite/localStorage queue re-transmitting pending harvests upon connection recovery."
    },
    {
      scenario: "Different payload same actor",
      attempts: 5,
      createdEvents: s3CreatedCount,
      duplicatePrevented: "Expected (distinct batches)",
      description: "Legitimate sequential harvest submissions from the same smallholder farmer."
    }
  ];

  const summaryMetadata = {
    generatedAt: new Date().toISOString(),
    benchmarkType: "Offline-First Idempotency & Replay Verification",
    totalAttemptsSimulated: 20,
    totalCreatedBatches: repo.getBatchCount(),
    results: simulationResults
  };

  writeFileSync(
    resolve(outputDir, "idempotency-simulation.json"),
    `${JSON.stringify(summaryMetadata, null, 2)}\n`
  );

  const csvHeader = "scenario,attempts,created_events,duplicate_prevented,description";
  const csvRows = simulationResults.map((r) =>
    `"${r.scenario}",${r.attempts},${r.createdEvents},"${r.duplicatePrevented}","${r.description}"`
  );
  writeFileSync(resolve(outputDir, "idempotency-simulation.csv"), `${csvHeader}\n${csvRows.join("\n")}\n`);

  console.log("===============================================================================");
  console.log("🛡️ BATS Offline-First Idempotency & Replay Simulation Results");
  console.log("===============================================================================");
  console.table(simulationResults);
  console.log("===============================================================================");
  console.log(`Summary written to: ${resolve(outputDir, "idempotency-simulation.json")}`);
}

runIdempotencySimulation();
