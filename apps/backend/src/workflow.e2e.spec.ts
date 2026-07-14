import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "./app.module.js";
import { AnchorService } from "./anchor.service.js";
import type { AnchorRecord } from "./domain.js";
import { MerkleService } from "./merkle.service.js";
import { StoreService } from "./store.service.js";

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
      schemaVersion: "bats-epcis-0.1-e2e",
      chainId: "31337",
      txHash: `0x${"ab".repeat(32)}`,
      blockNumber: "1",
      status: "confirmed",
      anchoredAt: new Date().toISOString()
    };
    await this.testStore.saveAnchor(anchor);
    return anchor;
  }
}

describe("BATS HTTP workflow (e2e)", () => {
  let app: INestApplication;
  const previous = {
    storage: process.env.BATS_STORAGE,
    password: process.env.ADMIN_PASSWORD,
    secret: process.env.SESSION_SECRET,
    rpc: process.env.CHAIN_RPC_URL
  };

  beforeAll(async () => {
    process.env.BATS_STORAGE = "memory";
    process.env.ADMIN_PASSWORD = "e2e-admin-password";
    process.env.SESSION_SECRET = "e2e-session-secret-at-least-32-characters";
    delete process.env.CHAIN_RPC_URL;

    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AnchorService)
      .useFactory({
        factory: (store: StoreService, merkle: MerkleService) =>
          new LocalAnchorService(store, merkle),
        inject: [StoreService, MerkleService]
      })
      .compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
    restore("BATS_STORAGE", previous.storage);
    restore("ADMIN_PASSWORD", previous.password);
    restore("SESSION_SECRET", previous.secret);
    restore("CHAIN_RPC_URL", previous.rpc);
  });

  it("executes harvest → transfer → anchor → verify and EPCIS export", async () => {
    const server = app.getHttpServer();
    const login = await request(server)
      .post("/auth/admin/login")
      .send({ email: "admin@bats.vn", password: "e2e-admin-password" })
      .expect(201);
    const cookie = login.headers["set-cookie"]?.[0];
    expect(cookie).toContain("bats_session=");
    if (!cookie) throw new Error("Admin login không trả session cookie.");

    const issued = await request(server)
      .post("/admin/actors/FARMER-0001/access-token")
      .set("Cookie", cookie)
      .expect(201);
    const farmerToken = issued.body.accessToken as string;

    const harvestInput = {
      farmPlotId: "plot-dlk-0001",
      variety: "Ri6",
      quantityKg: 500,
      eventTime: "2026-07-06T08:30:00+07:00",
      location: { latitude: 12.6789, longitude: 108.1234 },
      evidenceHashes: []
    };
    const harvest = await request(server)
      .post("/batches/harvest")
      .set("Authorization", `Bearer ${farmerToken}`)
      .set("x-idempotency-key", "e2e-harvest-20260706")
      .send(harvestInput)
      .expect(201);
    expect(harvest.body).toMatchObject({
      status: "harvested",
      accepted: true,
      identity: { gtin: "8930000000019", serial: "0001" }
    });

    const replay = await request(server)
      .post("/batches/harvest")
      .set("Authorization", `Bearer ${farmerToken}`)
      .set("x-idempotency-key", "e2e-harvest-20260706")
      .send(harvestInput)
      .expect(201);
    expect(replay.body.id).toBe(harvest.body.id);

    const adminAccess = await request(server)
      .post("/admin/actors/ADMIN-0001/access-token")
      .set("Cookie", cookie)
      .expect(201);
    await request(server)
      .post(`/batches/${harvest.body.id}/transfer`)
      .set("Authorization", `Bearer ${adminAccess.body.accessToken}`)
      .set("x-idempotency-key", "e2e-transfer-20260706")
      .send({
        status: "collected",
        eventTime: "2026-07-06T10:00:00+07:00",
        actualWeightKg: 495
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.status).toBe("collected");
        expect(body.events).toHaveLength(2);
      });

    await request(server)
      .post("/admin/anchors/2026-07-06")
      .set("Cookie", cookie)
      .expect(201)
      .expect(({ body }) => {
        expect(body.status).toBe("confirmed");
        expect(body.merkleRoot).toMatch(/^[a-f0-9]{64}$/);
      });

    const { gtin, lot, serial } = harvest.body.identity;
    await request(server)
      .get(`/01/${gtin}/10/${lot}/21/${serial}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.batch.status).toBe("collected");
        expect(body.proofs).toHaveLength(2);
        expect(body.proofs.every((proof: { proofValid: boolean }) => proof.proofValid)).toBe(true);
        expect(body.anchor.status).toBe("confirmed");
      });

    await request(server)
      .get(`/epcis/${gtin}/${lot}/${serial}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.type).toBe("EPCISDocument");
        expect(body.schemaVersion).toBe("2.0");
        expect(body.epcisBody.eventList).toHaveLength(2);
      });
  });
});

function restore(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}
