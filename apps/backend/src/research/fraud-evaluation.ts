import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Actor, Batch, CreateHarvestInput, FarmPlot } from "../domain.js";
import { ValidationService } from "../validation.service.js";

type Scenario =
  | "valid"
  | "geofence_boundary_valid"
  | "yield_edge_valid"
  | "duplicate_document_valid"
  | "temporal_bulk_entry_valid"
  | "role_proxy_valid"
  | "weight_moisture_loss_valid"
  | "degraded_gps_valid"
  | "geofence"
  | "gps_spoof"
  | "yield"
  | "duplicate"
  | "temporal"
  | "role"
  | "device"
  | "weight";

interface Sample {
  id: string;
  scenario: Scenario;
  expectedFraud: boolean;
  predictedFraud: boolean;
  expectedRule: string;
  detectedRules: string;
  riskScore: number;
  accepted: boolean;
}

const RULES = ["G", "Y", "D", "T", "R", "W", "A"] as const;
const plot: FarmPlot = {
  id: "research-plot",
  farmerId: "research-farmer",
  farmerName: "Synthetic farmer",
  plantingAreaCode: "VN-RESEARCH-0001",
  crop: "durian",
  variety: "Ri6",
  areaHa: 1,
  province: "Đắk Lắk",
  district: "Krông Pắc",
  commune: "Ea Yông",
  polygon: [
    { latitude: 12.67, longitude: 108.12 },
    { latitude: 12.67, longitude: 108.13 },
    { latitude: 12.68, longitude: 108.13 },
    { latitude: 12.68, longitude: 108.12 }
  ],
  status: "active"
};
const farmer: Actor = {
  id: plot.farmerId,
  name: "Synthetic farmer",
  role: "FARMER",
  status: "active",
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: "2026-07-01T00:00:00Z"
};

let randomState = 0x5eed1234;
function random(): number {
  randomState = (1664525 * randomState + 1013904223) >>> 0;
  return randomState / 0x1_0000_0000;
}

function input(index: number, scenario: Scenario): CreateHarvestInput {
  const evidence = `evidence-${index}`;
  const inside = {
    latitude: 12.671 + random() * 0.008,
    longitude: 108.121 + random() * 0.008
  };
  const location =
    scenario === "geofence" || scenario === "geofence_boundary_valid"
      ? { latitude: 10.77, longitude: 106.69 }
      : inside;
  return {
    farmPlotId: plot.id,
    actorId: plot.farmerId,
    variety: "Ri6",
    quantityKg:
      scenario === "yield" || scenario === "yield_edge_valid"
        ? 20_001
        : 300 + Math.round(random() * 400),
    eventTime: `2026-07-04T08:${String(index % 60).padStart(2, "0")}:00+07:00`,
    location,
    evidenceHashes: [
      scenario === "duplicate" || scenario === "duplicate_document_valid"
        ? "known-evidence"
        : evidence
    ],
    device:
      scenario === "device"
        ? { integrity: "compromised", gpsAccuracyM: 5 }
        : scenario === "degraded_gps_valid"
          ? { integrity: "trusted", gpsAccuracyM: 120 }
          : { integrity: "trusted", gpsAccuracyM: 8 + random() * 20 }
  };
}

function batch(id: string, eventTime: string, quantityKg = 100): Batch {
  return {
    id,
    identity: { gtin: "8930000000019", lot: id, serial: "0001" },
    farmPlotId: plot.id,
    farmerId: plot.farmerId,
    crop: "durian",
    variety: "Ri6",
    quantityKg,
    status: "harvested",
    riskScore: 0,
    riskBand: "green",
    accepted: true,
    issues: [],
    createdAt: eventTime,
    events: []
  };
}

function safeDivide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

function confusion(samples: Sample[], rule?: string) {
  const positive = (sample: Sample) =>
    rule ? sample.expectedRule === rule : sample.expectedFraud;
  const predicted = (sample: Sample) =>
    rule ? sample.detectedRules.split("|").includes(rule) : sample.predictedFraud;
  const tp = samples.filter((sample) => positive(sample) && predicted(sample)).length;
  const fp = samples.filter((sample) => !positive(sample) && predicted(sample)).length;
  const tn = samples.filter((sample) => !positive(sample) && !predicted(sample)).length;
  const fn = samples.filter((sample) => positive(sample) && !predicted(sample)).length;
  const precision = safeDivide(tp, tp + fp);
  const recall = safeDivide(tp, tp + fn);
  return {
    tp,
    fp,
    tn,
    fn,
    precision,
    recall,
    f1: safeDivide(2 * precision * recall, precision + recall),
    falsePositiveRate: safeDivide(fp, fp + tn),
    falseNegativeRate: safeDivide(fn, fn + tp)
  };
}

function evaluate(service: ValidationService, scenario: Scenario, index: number): Sample {
  const harvestInput = input(index, scenario);
  const expectedRule: Record<Scenario, string> = {
    valid: "",
    geofence_boundary_valid: "",
    yield_edge_valid: "",
    duplicate_document_valid: "",
    temporal_bulk_entry_valid: "",
    role_proxy_valid: "",
    weight_moisture_loss_valid: "",
    degraded_gps_valid: "",
    geofence: "G",
    gps_spoof: "G",
    yield: "Y",
    duplicate: "D",
    temporal: "T",
    role: "R",
    device: "A",
    weight: "W"
  };
  const expectedFraud = ![
    "valid",
    "geofence_boundary_valid",
    "yield_edge_valid",
    "duplicate_document_valid",
    "temporal_bulk_entry_valid",
    "role_proxy_valid",
    "weight_moisture_loss_valid",
    "degraded_gps_valid"
  ].includes(scenario);
  let result;
  if (scenario === "weight" || scenario === "weight_moisture_loss_valid") {
    result = service.validateTransfer(batch(`weight-${index}`, harvestInput.eventTime, 1000), {
      actorId: "collector",
      status: "collected",
      eventTime: harvestInput.eventTime,
      actualWeightKg: scenario === "weight_moisture_loss_valid" ? 880 : 800
    });
  } else {
    const recent =
      scenario === "temporal" || scenario === "temporal_bulk_entry_valid"
        ? [0, 1, 2].map((offset) =>
            batch(`recent-${index}-${offset}`, harvestInput.eventTime)
          )
        : [];
    result = service.validateHarvest(
      harvestInput,
      plot,
      scenario === "duplicate" || scenario === "duplicate_document_valid"
        ? new Set(["known-evidence"])
        : new Set(),
      recent,
      undefined,
      scenario === "role" || scenario === "role_proxy_valid"
        ? { ...farmer, id: "other-farmer" }
        : farmer
    );
  }
  const detected = result.issues.map((issue) => issue.code);
  return {
    id: `SYN-${String(index + 1).padStart(4, "0")}`,
    scenario,
    expectedFraud,
    predictedFraud: detected.length > 0,
    expectedRule: expectedRule[scenario],
    detectedRules: detected.join("|"),
    riskScore: result.score,
    accepted: result.accepted
  };
}

function main(): void {
  const outputFlag = process.argv.indexOf("--output");
  const outputDir = resolve(
    outputFlag >= 0 ? (process.argv[outputFlag + 1] ?? "research/results") : "research/results"
  );
  const scenarios: Scenario[] = [
    ...Array<Scenario>(1350).fill("valid"),
    ...Array<Scenario>(8).fill("geofence_boundary_valid"),
    ...Array<Scenario>(10).fill("yield_edge_valid"),
    ...Array<Scenario>(7).fill("duplicate_document_valid"),
    ...Array<Scenario>(10).fill("temporal_bulk_entry_valid"),
    ...Array<Scenario>(5).fill("role_proxy_valid"),
    ...Array<Scenario>(10).fill("weight_moisture_loss_valid"),
    ...Array<Scenario>(30).fill("degraded_gps_valid"),
    ...Array<Scenario>(100).fill("geofence"),
    ...Array<Scenario>(20).fill("gps_spoof"),
    ...Array<Scenario>(100).fill("yield"),
    ...Array<Scenario>(100).fill("duplicate"),
    ...Array<Scenario>(100).fill("temporal"),
    ...Array<Scenario>(100).fill("role"),
    ...Array<Scenario>(100).fill("device"),
    ...Array<Scenario>(100).fill("weight")
  ];
  const service = new ValidationService();
  const samples = scenarios.map((scenario, index) => evaluate(service, scenario, index));
  const overall = confusion(samples);

  // Compute Ablation Study across cumulative rule subsets
  const ablationLayers = [
    { name: "Geofence only (G)", rules: ["G"] },
    { name: "Geofence + Yield (G, Y)", rules: ["G", "Y"] },
    { name: "G + Y + Duplicate (G, Y, D)", rules: ["G", "Y", "D"] },
    { name: "G + Y + D + Temporal/Role/Weight (6-rule)", rules: ["G", "Y", "D", "T", "R", "W"] },
    { name: "Full 7-rule engine (+ Device/Attestation A)", rules: ["G", "Y", "D", "T", "R", "W", "A"] }
  ];

  const ablation = ablationLayers.map((layer) => {
    const layerRuleSet = new Set(layer.rules);
    const predictedLayerFraud = (sample: Sample) => {
      const triggered = sample.detectedRules.split("|").filter(Boolean);
      return triggered.some((r) => layerRuleSet.has(r));
    };
    const tp = samples.filter((s) => s.expectedFraud && predictedLayerFraud(s)).length;
    const fp = samples.filter((s) => !s.expectedFraud && predictedLayerFraud(s)).length;
    const tn = samples.filter((s) => !s.expectedFraud && !predictedLayerFraud(s)).length;
    const fn = samples.filter((s) => s.expectedFraud && !predictedLayerFraud(s)).length;
    const precision = safeDivide(tp, tp + fp);
    const recall = safeDivide(tp, tp + fn);
    const f1 = safeDivide(2 * precision * recall, precision + recall);
    return {
      configuration: layer.name,
      rulesIncluded: layer.rules.join(", "),
      tp,
      fp,
      tn,
      fn,
      precision,
      recall,
      f1
    };
  });

  const metrics = {
    generatedAt: new Date().toISOString(),
    seed: "0x5eed1234",
    dataset: "deterministic noisy synthetic validation set",
    total: samples.length,
    valid: samples.filter((sample) => !sample.expectedFraud).length,
    injectedFraud: samples.filter((sample) => sample.expectedFraud).length,
    confusionMatrix: {
      tp: overall.tp,
      fp: overall.fp,
      tn: overall.tn,
      fn: overall.fn
    },
    precision: overall.precision,
    recall: overall.recall,
    f1: overall.f1,
    falsePositiveRate: overall.falsePositiveRate,
    falseNegativeRate: overall.falseNegativeRate,
    perRule: Object.fromEntries(RULES.map((rule) => [rule, confusion(samples, rule)])),
    ablation,
    noiseCases: {
      geofenceBoundaryOperationallyValid: 8,
      yieldEdgeOperationallyValid: 10,
      duplicateDocumentOperationallyValid: 7,
      temporalBulkEntryOperationallyValid: 10,
      roleProxyOperationallyValid: 5,
      weightMoistureLossOperationallyValid: 10,
      degradedGpsOperationallyValid: 30,
      spoofedGpsInsidePolygon: 20
    },
    limitations: [
      "Synthetic labels and noise cases do not establish field accuracy.",
      "GPS spoofing that reports an in-geofence coordinate is intentionally missed by geofence-only validation.",
      "Degraded but legitimate GPS is intentionally counted as an operational false positive.",
      "Pilot labels must be assigned independently before thresholds are tuned."
    ]
  };
  mkdirSync(outputDir, { recursive: true });
  const header = [
    "id",
    "scenario",
    "expected_fraud",
    "predicted_fraud",
    "expected_rule",
    "detected_rules",
    "risk_score",
    "accepted"
  ].join(",");
  const rows = samples.map((sample) =>
    [
      sample.id,
      sample.scenario,
      sample.expectedFraud,
      sample.predictedFraud,
      sample.expectedRule,
      sample.detectedRules,
      sample.riskScore,
      sample.accepted
    ].join(",")
  );
  writeFileSync(resolve(outputDir, "fraud-dataset.csv"), `${header}\n${rows.join("\n")}\n`);
  writeFileSync(
    resolve(outputDir, "fraud-metrics.json"),
    `${JSON.stringify(metrics, null, 2)}\n`
  );
  writeFileSync(
    resolve(outputDir, "fraud-ablation.json"),
    `${JSON.stringify(ablation, null, 2)}\n`
  );
  const ablationHeader = "configuration,rules_included,tp,fp,tn,fn,precision,recall,f1";
  const ablationRows = ablation.map((a) =>
    `"${a.configuration}","${a.rulesIncluded}",${a.tp},${a.fp},${a.tn},${a.fn},${a.precision.toFixed(4)},${a.recall.toFixed(4)},${a.f1.toFixed(4)}`
  );
  writeFileSync(resolve(outputDir, "fraud-ablation.csv"), `${ablationHeader}\n${ablationRows.join("\n")}\n`);
  console.log(JSON.stringify(metrics, null, 2));
}

main();
