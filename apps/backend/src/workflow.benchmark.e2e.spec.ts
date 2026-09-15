import { mkdir, writeFile } from "node:fs/promises";
import { cpus, hostname, platform, release } from "node:os";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "./app.module.js";
import { AnchorService } from "./anchor.service.js";
import type { AnchorRecord } from "./domain.js";
import { MerkleService } from "./merkle.service.js";
import { StoreService } from "./store.service.js";

/**
 * Reproducible full HTTP workflow benchmark for RQ3.
 * It intentionally uses the in-memory PoC store and a deterministic local anchor.
 * Therefore it measures API + validation + PCIE + persistence adapter + canonicalization
 * + Merkle + verify/EPCIS export, but not PostgreSQL/PostGIS, evidence-file upload, RPC,
 * public-chain confirmation, or gas cost.
 */
class LocalAnchorService extends AnchorService {
  constructor(
    private readonly testStore: StoreService,
    merkle: MerkleService
  ) {
    super(testStore, merkle);
  }

  override async anchorDate(date: string): Promise<AnchorRecord> {
    const tree = this.dailyTree(date);
    const anchor: AnchorRecord = {
      date,
      merkleRoot: tree.merkleRoot,
      schemaVersion: "bats-epcis-0.1-e2e-benchmark",
      chainId: "31337",
      txHash: `0x${"cd".repeat(32)}`,
      blockNumber: "1",
      status: "confirmed",
      anchoredAt: new Date().toISOString()
    };
    await this.testStore.saveAnchor(anchor);
    return anchor;
  }
}

const WARMUP_RUNS = 5;
const MEASURED_RUNS = 100;

function percentile(values: number[], p: number) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return Number(sorted[index].toFixed(3));
}

describe("BATS full HTTP workflow benchmark", () => {
  let app: INestApplication;
  let farmerToken: string;
  let adminToken: string;
  let adminCookie: string;
  let store: StoreService;

  beforeAll(async () => {
    process.env.BATS_STORAGE = "memory";
    process.env.ADMIN_PASSWORD = "e2e-benchmark-admin-password";
    process.env.SESSION_SECRET = "e2e-benchmark-session-secret-at-least-32-characters";
    process.env.RATE_LIMIT_MAX = "100000";
    delete process.env.CHAIN_RPC_URL;

    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AnchorService)
      .useFactory({
        factory: (store: StoreService, merkle: MerkleService) => new LocalAnchorService(store, merkle),
        inject: [StoreService, MerkleService]
      })
      .compile();
    app = module.createNestApplication();
    await app.init();
    store = app.get(StoreService);

    const server = app.getHttpServer();
    const login = await request(server)
      .post("/auth/admin/login")
      .send({ email: "admin@bats.vn", password: "e2e-benchmark-admin-password" })
      .expect(201);
    const cookie = login.headers["set-cookie"]?.[0];
    if (!cookie) throw new Error("Admin login did not return a session cookie.");
    adminCookie = cookie;
    farmerToken = (await request(server).post("/admin/actors/FARMER-0001/access-token").set("Cookie", cookie).expect(201)).body.accessToken;
    adminToken = (await request(server).post("/admin/actors/ADMIN-0001/access-token").set("Cookie", cookie).expect(201)).body.accessToken;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it("measures harvest → transfer → anchor → verify → EPCIS export", async () => {
    const server = app.getHttpServer();
    const allRuns: Array<Record<string, number>> = [];

    for (let i = 0; i < WARMUP_RUNS + MEASURED_RUNS; i += 1) {
      const key = `rq3-${i}-${Date.now()}`;
      const date = "2026-07-06";
      const workflowStart = performance.now();

      const harvestStart = performance.now();
      const harvest = await request(server)
        .post("/batches/harvest")
        .set("Authorization", `Bearer ${farmerToken}`)
        .set("x-idempotency-key", `${key}-harvest`)
        .send({
          farmPlotId: "plot-dlk-0001",
          variety: "Ri6",
          quantityKg: 500,
          eventTime: `${date}T08:30:00+07:00`,
          location: { latitude: 12.6789, longitude: 108.1234 },
          evidenceHashes: [`sha256:${"0".repeat(64)}`]
        })
        .expect(201);
      const harvestMs = performance.now() - harvestStart;

      const transferStart = performance.now();
      await request(server)
        .post(`/batches/${harvest.body.id}/transfer`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("x-idempotency-key", `${key}-transfer`)
        .send({ status: "collected", eventTime: `${date}T10:00:00+07:00`, actualWeightKg: 495 })
        .expect(201);
      const transferMs = performance.now() - transferStart;

      const anchorStart = performance.now();
      await request(server)
        .post(`/admin/anchors/${date}`)
        .set("Cookie", adminCookie)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(201);
      const anchorMs = performance.now() - anchorStart;

      const verifyStart = performance.now();
      const { gtin, lot, serial } = harvest.body.identity;
      await request(server).get(`/01/${gtin}/10/${lot}/21/${serial}`).expect(200);
      const verifyMs = performance.now() - verifyStart;

      const epcisStart = performance.now();
      await request(server).get(`/epcis/${gtin}/${lot}/${serial}`).expect(200);
      const epcisExportMs = performance.now() - epcisStart;

      allRuns.push({
        workflowMs: performance.now() - workflowStart,
        harvestMs,
        transferMs,
        anchorMs,
        verifyMs,
        epcisExportMs
      });

      // Isolate benchmark runs so cumulative yield and evidence uniqueness rules
      // do not turn later repetitions into a different business scenario.
      store.batches.clear();
      store.evidenceHashes.clear();
      store.idempotencyKeys.clear();
      store.anchors.clear();
    }

    const measured = allRuns.slice(WARMUP_RUNS);
    const summary = Object.fromEntries(
      Object.keys(measured[0]).map((metric) => {
        const values = measured.map((row) => row[metric]);
        return [metric, {
          p50: percentile(values, 50), p95: percentile(values, 95), p99: percentile(values, 99),
          mean: Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3))
        }];
      })
    );
    const payload = {
      benchmark: "full-http-workflow-rq3",
      executedAt: new Date().toISOString(),
      warmupRuns: WARMUP_RUNS,
      measuredRuns: MEASURED_RUNS,
      concurrency: 1,
      workflow: "harvest → transfer → local anchor → Digital Link verification → EPCIS export",
      scope: "HTTP API, request validation, PCIE, in-memory persistence adapter, canonicalization, Merkle, local anchor and response serialization",
      excluded: "PostgreSQL/PostGIS, file upload/object storage, external RPC/public-chain confirmation, real gas cost and concurrent client load",
      resultsMs: summary,
      rawMeasuredRuns: measured,
      environment: { node: process.version, platform: `${platform()} ${release()}`, hostname: hostname(), cpus: cpus().length }
    };
    const outputDir = join(process.cwd(), "../../research/results");
    await mkdir(outputDir, { recursive: true });
    await writeFile(join(outputDir, "rq3-full-http-workflow-benchmark.json"), `${JSON.stringify(payload, null, 2)}\n`);
    expect(measured).toHaveLength(MEASURED_RUNS);
  });
});
