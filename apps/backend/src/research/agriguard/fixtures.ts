import type { PcieRegistry } from "./types.js";

export const AGRIGUARD_SEED = "0x51a7c0de";

export const preliminaryRegistry = Object.freeze({
  plantations: Object.freeze([
    Object.freeze({
      plantationCode: "PLANT-A",
      polygon: Object.freeze([
        Object.freeze({ latitude: 10, longitude: 106 }),
        Object.freeze({ latitude: 10, longitude: 107 }),
        Object.freeze({ latitude: 11, longitude: 107 }),
        Object.freeze({ latitude: 11, longitude: 106 })
      ]),
      areaHa: 2,
      crop: "durian",
      variety: "Ri6",
      validFrom: "2025-01-01T00:00:00.000Z",
      validTo: "2027-12-31T23:59:59.999Z",
      status: "ACTIVE" as const
    }),
    Object.freeze({
      plantationCode: "PLANT-B",
      polygon: Object.freeze([
        Object.freeze({ latitude: 12, longitude: 108 }),
        Object.freeze({ latitude: 12, longitude: 109 }),
        Object.freeze({ latitude: 13, longitude: 109 }),
        Object.freeze({ latitude: 13, longitude: 108 })
      ]),
      areaHa: 1.5,
      crop: "durian",
      variety: "Ri6",
      validFrom: "2025-01-01T00:00:00.000Z",
      validTo: "2027-12-31T23:59:59.999Z",
      status: "ACTIVE" as const
    }),
    Object.freeze({
      plantationCode: "PLANT-INACTIVE",
      polygon: Object.freeze([
        Object.freeze({ latitude: 14, longitude: 108 }),
        Object.freeze({ latitude: 14, longitude: 109 }),
        Object.freeze({ latitude: 15, longitude: 109 }),
        Object.freeze({ latitude: 15, longitude: 108 })
      ]),
      areaHa: 1,
      crop: "durian",
      variety: "Ri6",
      validFrom: "2025-01-01T00:00:00.000Z",
      validTo: "2027-12-31T23:59:59.999Z",
      status: "INACTIVE" as const
    })
  ]),
  authorizations: Object.freeze([
    Object.freeze({
      plantationCode: "PLANT-A",
      actorId: "FARMER-A",
      validFrom: "2026-01-01T00:00:00.000Z",
      validTo: "2026-12-31T23:59:59.999Z",
      status: "ACTIVE" as const
    }),
    Object.freeze({
      plantationCode: "PLANT-A",
      actorId: "FARMER-HISTORICAL",
      validFrom: "2025-01-01T00:00:00.000Z",
      validTo: "2026-06-30T23:59:59.999Z",
      status: "ACTIVE" as const
    }),
    Object.freeze({
      plantationCode: "PLANT-B",
      actorId: "FARMER-B",
      validFrom: "2026-01-01T00:00:00.000Z",
      validTo: "2026-12-31T23:59:59.999Z",
      status: "ACTIVE" as const
    }),
    Object.freeze({
      plantationCode: "PLANT-INACTIVE",
      actorId: "FARMER-INACTIVE",
      validFrom: "2026-01-01T00:00:00.000Z",
      validTo: "2026-12-31T23:59:59.999Z",
      status: "ACTIVE" as const
    })
  ]),
  yieldPolicies: Object.freeze([
    Object.freeze({
      crop: "durian",
      variety: "Ri6",
      season: "2026",
      maxYieldKgPerHa: 10_000,
      tolerancePct: 0.05,
      policyVersion: "durian-ri6-2026-v1"
    })
  ])
}) satisfies PcieRegistry;
