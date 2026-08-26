import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import { relative, resolve } from "node:path";
import { ValidationService } from "../../validation.service.js";
import { evaluateBatsV1, expectedBaselineRules } from "./baseline-adapter.js";
import { AGRIGUARD_SEED, preliminaryRegistry } from "./fixtures.js";
import { PcieService } from "./pcie.service.js";
import { addAblationDeltas, COMMON_SUPPORT_POLICY, commonSupportDecision } from "./reporting.js";
import type { PcieRuleCode, ScenarioDefinition, ScenarioManifest } from "./types.js";

const RULES: PcieRuleCode[] = ["G", "I", "S", "Y", "M", "C"];
const BASELINE_RULES = ["G", "Y", "D", "T", "R", "W", "A"];
const OUTPUT_DIR = resolve("research/results/agriguard-preliminary");
const MANIFEST_PATH = resolve("research/scenarios/agriguard/preliminary-scenarios.json");
const CAVEAT = "These results are synthetic scenario/rule-coverage measurements from an incomplete preliminary prototype and are not estimates of real-world fraud-detection accuracy.";

interface EvaluationRow {
  scenario: ScenarioDefinition;
  pcie: { predictedFraud: boolean; accepted: boolean; triggeredRules: string[]; riskScore: number };
  baseline: ReturnType<typeof evaluateBatsV1>;
}

interface ConfusionMetrics {
  tp: number; fp: number; tn: number; fn: number;
  precision: number; recall: number; f1: number;
  falsePositiveRate: number; falseNegativeRate: number;
}

function divide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

function confusion<T>(rows: T[], expected: (row: T) => boolean, predicted: (row: T) => boolean): ConfusionMetrics {
  const tp = rows.filter((row) => expected(row) && predicted(row)).length;
  const fp = rows.filter((row) => !expected(row) && predicted(row)).length;
  const tn = rows.filter((row) => !expected(row) && !predicted(row)).length;
  const fn = rows.filter((row) => expected(row) && !predicted(row)).length;
  const precision = divide(tp, tp + fp);
  const recall = divide(tp, tp + fn);
  return {
    tp, fp, tn, fn, precision, recall,
    f1: divide(2 * precision * recall, precision + recall),
    falsePositiveRate: divide(fp, fp + tn),
    falseNegativeRate: divide(fn, fn + tp)
  };
}

function percentile(values: number[], quantile: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.min(sorted.length - 1, Math.ceil(quantile * sorted.length) - 1));
  return sorted[index] ?? 0;
}

function evaluateScenario(engine: PcieService, scenario: ScenarioDefinition, disabled = new Set<PcieRuleCode>()) {
  const results = scenario.events.map((event) => engine.evaluate(event, { disabledRules: disabled }));
  const triggeredRules = [...new Set(results.flatMap((result) => result.triggeredRules))];
  return {
    predictedFraud: results.some((result) => !result.accepted),
    accepted: results.every((result) => result.accepted),
    triggeredRules,
    riskScore: Math.max(0, ...results.map((result) => result.riskScore))
  };
}

function csvCell(value: unknown): string {
  const text = Array.isArray(value) ? value.join("|") : String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  return `${headers.join(",")}\n${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

function markdownCell(value: unknown): string {
  return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
}

function writeJson(filename: string, value: unknown): void {
  writeFileSync(resolve(OUTPUT_DIR, filename), `${JSON.stringify(value, null, 2)}\n`);
}

function command(commandName: string, args: string[]): string {
  try {
    const executable = process.platform === "win32" && commandName === "pnpm" ? "pnpm.cmd" : commandName;
    return execFileSync(executable, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "unavailable";
  }
}

function detectedPnpmVersion(): string {
  if (process.env.npm_execpath) {
    const version = command(process.execPath, [process.env.npm_execpath, "--version"]);
    if (version !== "unavailable") return version;
  }
  const match = process.env.npm_config_user_agent?.match(/pnpm\/([^\s]+)/);
  return match?.[1] ?? command("pnpm", ["--version"]);
}

function systemMetadata() {
  return {
    nodeVersion: process.version,
    os: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: { model: os.cpus()[0]?.model ?? "unavailable", logicalCores: os.cpus().length },
    ramBytes: os.totalmem()
  };
}

function perClass(rows: EvaluationRow[], selector: (row: EvaluationRow) => boolean) {
  return Object.fromEntries([...new Set(rows.map((row) => row.scenario.scenarioClass))].map((scenarioClass) => {
    const selected = rows.filter((row) => row.scenario.scenarioClass === scenarioClass);
    return [scenarioClass, confusion(selected, (row) => row.scenario.expectedFraud, selector)];
  }));
}

function supportCounts(rows: EvaluationRow[], engine: "pcie" | "baseline") {
  if (engine === "pcie") return { supported: rows.length, partial: 0, unsupported: 0 };
  return Object.fromEntries(["supported", "partial", "unsupported"].map((support) =>
    [support, rows.filter((row) => row.baseline.support === support).length]));
}

function sensitivity(engine: PcieService) {
  const cases = [
    { id: "MB-LEG-1", expectedFraud: false, inputKg: 1000, outputKg: 800 },
    { id: "MB-LEG-2", expectedFraud: false, inputKg: 1000, outputKg: 850 },
    { id: "MB-LEG-3", expectedFraud: false, inputKg: 1000, outputKg: 900 },
    { id: "MB-ADV-1", expectedFraud: true, inputKg: 1000, outputKg: 960 },
    { id: "MB-ADV-2", expectedFraud: true, inputKg: 1000, outputKg: 1001 },
    { id: "MB-ADV-3", expectedFraud: true, inputKg: 1000, outputKg: 1100 }
  ];
  const results = [0.85, 0.9, 0.95, 1].flatMap((rho) => [0, 0.02, 0.05, 0.1].map((epsilonPct) => {
    const evaluated = cases.map((item) => {
      const result = engine.evaluate({
        id: `${item.id}-${rho}-${epsilonPct}`,
        eventTime: "2026-07-01T00:00:00.000Z",
        actorId: "FARMER-A",
        plantationCode: "PLANT-A",
        massBalance: {
          provenancePlantationCode: "PLANT-A",
          openingInventoryKg: 0,
          verifiedInputs: [{ plantationCode: "PLANT-A", quantityKg: item.inputKg }],
          outputKg: item.outputKg,
          rho,
          epsilonPct
        }
      });
      return { ...item, predictedFraud: result.triggeredRules.includes("M") };
    });
    return { rho, epsilonPct, ...confusion(evaluated, (row) => row.expectedFraud, (row) => row.predictedFraud) };
  }));
  return { cases, results };
}

function performance(engine: PcieService, scenarios: ScenarioDefinition[]) {
  const events = scenarios.flatMap((scenario) => scenario.events);
  const run = () => {
    const started = process.hrtime.bigint();
    for (const event of events) engine.evaluate(event);
    return Number(process.hrtime.bigint() - started) / 1_000_000;
  };
  for (let index = 0; index < 5; index += 1) run();
  const repetitions = 50;
  const durations = Array.from({ length: repetitions }, run);
  const perEventMs = durations.map((duration) => duration / events.length);
  const totalMs = durations.reduce((sum, duration) => sum + duration, 0);
  return {
    benchmark: "local in-memory/single-process rule-engine microbenchmark",
    scopeExclusions: ["HTTP/API", "PostGIS", "persistence", "EPCIS", "Merkle", "blockchain"],
    warmupRuns: 5,
    measuredRepetitions: repetitions,
    eventsPerRepetition: events.length,
    totalEvents: repetitions * events.length,
    p50PerEventMs: percentile(perEventMs, 0.5),
    p95PerEventMs: percentile(perEventMs, 0.95),
    p99PerEventMs: percentile(perEventMs, 0.99),
    throughputEventsPerSecond: divide(repetitions * events.length, totalMs / 1000),
    clock: "process.hrtime.bigint",
    environment: systemMetadata()
  };
}

function hashFile(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function readPostgisSummary(): any | undefined {
  const path = resolve(OUTPUT_DIR, "agriguard-postgis-summary.json");
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : undefined;
}

function main(): void {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as ScenarioManifest;
  if (manifest.seed !== AGRIGUARD_SEED) throw new Error("Scenario manifest seed does not match fixture seed.");
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const engine = new PcieService(preliminaryRegistry);
  const baselineService = new ValidationService();
  const rows: EvaluationRow[] = manifest.scenarios.map((scenario) => ({
    scenario,
    pcie: evaluateScenario(engine, scenario),
    baseline: evaluateBatsV1(baselineService, scenario)
  }));
  const supportDecisions = rows.map((row) => ({
    row,
    ...commonSupportDecision(row.scenario.scenarioClass, row.baseline.support, row.baseline.supportReason)
  }));
  const commonRows = supportDecisions.filter((decision) => decision.included).map((decision) => decision.row);

  const pcieOverall = confusion(rows, (row) => row.scenario.expectedFraud, (row) => row.pcie.predictedFraud);
  const baselineOverall = confusion(rows, (row) => row.scenario.expectedFraud, (row) => row.baseline.predictedFraud);
  const metrics = {
    evaluationView: "full-scope synthetic scenario coverage",
    caveat: CAVEAT,
    seed: manifest.seed,
    datasetSize: rows.length,
    eventCount: manifest.scenarios.flatMap((scenario) => scenario.events).length,
    groundTruthCounts: {
      legitimate: rows.filter((row) => !row.scenario.expectedFraud).length,
      adversarial: rows.filter((row) => row.scenario.expectedFraud).length
    },
    limitations: [
      "Perfect PCIE coverage is expected on hand-authored rule fixtures and does not demonstrate generalization.",
      "Synthetic scenario labels do not establish real-world fraud-detection accuracy.",
      "Registry and policy data are immutable research fixtures rather than production persistence models.",
      "BATS v1 unsupported scenarios remain in this full-scope view for coverage transparency; unsupported capability is not a detector defect."
    ],
    engines: {
      pciePreliminary: {
        overall: pcieOverall,
        supportCounts: supportCounts(rows, "pcie"),
        perRule: Object.fromEntries(RULES.map((rule) => [rule,
          confusion(rows, (row) => row.scenario.expectedRules.includes(rule),
            (row) => row.pcie.triggeredRules.includes(rule))])),
        perScenarioClass: perClass(rows, (row) => row.pcie.predictedFraud)
      },
      batsV1Frozen: {
        overall: baselineOverall,
        supportCounts: supportCounts(rows, "baseline"),
        perRule: Object.fromEntries(BASELINE_RULES.map((rule) => [rule,
          confusion(rows, (row) => expectedBaselineRules(row.scenario).includes(rule),
            (row) => row.baseline.triggeredRules.includes(rule))])),
        perScenarioClass: perClass(rows, (row) => row.baseline.predictedFraud)
      }
    }
  };

  const commonMetrics = {
    evaluationView: "common-support apples-to-apples comparison",
    caveat: CAVEAT,
    seed: manifest.seed,
    inclusionPolicy: COMMON_SUPPORT_POLICY,
    datasetSize: commonRows.length,
    groundTruthCounts: {
      legitimate: commonRows.filter((row) => !row.scenario.expectedFraud).length,
      adversarial: commonRows.filter((row) => row.scenario.expectedFraud).length
    },
    includedScenarioIds: commonRows.map((row) => row.scenario.id),
    excludedScenarios: supportDecisions.filter((decision) => !decision.included).map((decision) => ({
      scenarioId: decision.row.scenario.id,
      supportClassification: decision.row.baseline.support,
      reason: decision.reason
    })),
    engines: {
      pciePreliminary: {
        overall: confusion(commonRows, (row) => row.scenario.expectedFraud, (row) => row.pcie.predictedFraud),
        supportCounts: supportCounts(commonRows, "pcie")
      },
      batsV1Frozen: {
        overall: confusion(commonRows, (row) => row.scenario.expectedFraud, (row) => row.baseline.predictedFraud),
        supportCounts: supportCounts(commonRows, "baseline")
      }
    }
  };

  const ablationRuns = [
    { configuration: "Full", disabledRule: undefined },
    ...RULES.map((rule) => ({ configuration: `Full-${rule}`, disabledRule: rule }))
  ].map(({ configuration, disabledRule }) => {
    const rerun = rows.map((row) => ({
      expectedFraud: row.scenario.expectedFraud,
      predictedFraud: evaluateScenario(engine, row.scenario,
        disabledRule ? new Set([disabledRule]) : new Set()).predictedFraud
    }));
    return {
      configuration,
      disabledRule: disabledRule ?? null,
      execution: "full engine re-run",
      ...confusion(rerun, (row) => row.expectedFraud, (row) => row.predictedFraud)
    };
  });
  const ablation = addAblationDeltas(ablationRuns);
  const massSensitivity = sensitivity(engine);
  const performanceResult = performance(engine, manifest.scenarios);

  const datasetPath = resolve(OUTPUT_DIR, "agriguard-dataset.csv");
  const metricsPath = resolve(OUTPUT_DIR, "agriguard-metrics.json");
  const commonMetricsPath = resolve(OUTPUT_DIR, "agriguard-common-support-metrics.json");
  writeFileSync(datasetPath, toCsv(
    ["id", "scenario_class", "expected_fraud", "expected_rules", "pcie_predicted_fraud", "pcie_rules", "pcie_accepted", "pcie_risk_score", "bats_v1_predicted_fraud", "bats_v1_rules", "bats_v1_support", "bats_v1_support_reason"],
    rows.map((row) => [row.scenario.id, row.scenario.scenarioClass, row.scenario.expectedFraud,
      row.scenario.expectedRules, row.pcie.predictedFraud, row.pcie.triggeredRules, row.pcie.accepted,
      row.pcie.riskScore, row.baseline.predictedFraud, row.baseline.triggeredRules,
      row.baseline.support, row.baseline.supportReason])));
  writeJson("agriguard-metrics.json", metrics);
  writeFileSync(resolve(OUTPUT_DIR, "agriguard-metrics.csv"), toCsv(
    ["engine", "evaluation_view", "scenario_count", "supported", "partial", "unsupported", "tp", "fp", "tn", "fn", "precision", "recall", "f1", "false_positive_rate", "false_negative_rate"],
    [["pcie-preliminary", metrics.evaluationView, rows.length, ...Object.values(metrics.engines.pciePreliminary.supportCounts), ...Object.values(pcieOverall)],
      ["bats-v1-frozen", metrics.evaluationView, rows.length, ...Object.values(metrics.engines.batsV1Frozen.supportCounts), ...Object.values(baselineOverall)]]));
  writeJson("agriguard-common-support-metrics.json", commonMetrics);
  writeFileSync(resolve(OUTPUT_DIR, "agriguard-common-support-metrics.csv"), toCsv(
    ["engine", "evaluation_view", "scenario_count", "supported", "partial", "unsupported", "tp", "fp", "tn", "fn", "precision", "recall", "f1", "false_positive_rate", "false_negative_rate"],
    [["pcie-preliminary", commonMetrics.evaluationView, commonRows.length, ...Object.values(commonMetrics.engines.pciePreliminary.supportCounts), ...Object.values(commonMetrics.engines.pciePreliminary.overall)],
      ["bats-v1-frozen", commonMetrics.evaluationView, commonRows.length, ...Object.values(commonMetrics.engines.batsV1Frozen.supportCounts), ...Object.values(commonMetrics.engines.batsV1Frozen.overall)]]));

  const supportHeaders = ["scenarioId", "groundTruth", "primaryRule", "PCIE support", "BATS v1 support", "BATS support classification", "PCIE detected", "BATS detected", "notes"];
  const supportRows = supportDecisions.map((decision) => {
    const row = decision.row;
    return [row.scenario.id, row.scenario.expectedFraud ? "adversarial" : "legitimate",
      row.scenario.expectedRules[0] ?? "none", "supported", decision.included ? "sufficient" : "insufficient",
      row.baseline.support, row.pcie.predictedFraud, row.baseline.predictedFraud,
      `${row.scenario.description} ${decision.included ? decision.reason : `Common-support exclusion: ${decision.reason}`}`];
  });
  writeFileSync(resolve(OUTPUT_DIR, "agriguard-support-matrix.csv"), toCsv(supportHeaders, supportRows));
  writeFileSync(resolve(OUTPUT_DIR, "agriguard-support-matrix.md"),
    `# BATS-AgriGuard scenario support matrix\n\n> **${CAVEAT}**\n\n` +
    `Common-support policy: ${COMMON_SUPPORT_POLICY.inclusionRule} ${COMMON_SUPPORT_POLICY.exclusionRule}\n\n` +
    `| ${supportHeaders.join(" | ")} |\n|${supportHeaders.map(() => "---").join("|")}|\n` +
    supportRows.map((row) => `| ${row.map(markdownCell).join(" | ")} |`).join("\n") + "\n");

  writeJson("agriguard-ablation.json", {
    label: "true remove-one-rule engine re-execution",
    interpretation: "Within the current scenario suite, Full-M has the largest recall and F1 decrease versus Full; this is scenario coverage evidence, not a general importance ranking.",
    results: ablation
  });
  writeFileSync(resolve(OUTPUT_DIR, "agriguard-ablation.csv"), toCsv(
    ["configuration", "disabled_rule", "tp", "fp", "tn", "fn", "precision", "recall", "f1", "delta_f1_vs_full", "delta_recall_vs_full", "false_positive_rate", "false_negative_rate"],
    ablation.map((row) => [row.configuration, row.disabledRule ?? "", row.tp, row.fp, row.tn, row.fn,
      row.precision, row.recall, row.f1, row.deltaF1VsFull, row.deltaRecallVsFull,
      row.falsePositiveRate, row.falseNegativeRate])));
  writeJson("agriguard-mass-balance-sensitivity.json", {
    label: "fixed synthetic mass-balance sensitivity grid; no post-hoc threshold selection",
    scenarioCount: massSensitivity.cases.length,
    groundTruthCounts: {
      legitimate: massSensitivity.cases.filter((item) => !item.expectedFraud).length,
      adversarial: massSensitivity.cases.filter((item) => item.expectedFraud).length
    },
    interpretation: [
      "Within these six fixed sensitivity scenarios, stricter recovery assumptions can flag legitimate process loss and introduce false positives.",
      "Within these six fixed sensitivity scenarios, larger tolerance can accept adversarial over-output and reduce recall."
    ],
    results: massSensitivity.results
  });
  writeFileSync(resolve(OUTPUT_DIR, "agriguard-mass-balance-sensitivity.csv"), toCsv(
    ["rho", "epsilon_pct", "tp", "fp", "tn", "fn", "precision", "recall", "f1", "false_positive_rate", "false_negative_rate"],
    massSensitivity.results.map((row) => [row.rho, row.epsilonPct, row.tp, row.fp, row.tn, row.fn,
      row.precision, row.recall, row.f1, row.falsePositiveRate, row.falseNegativeRate])));
  writeJson("agriguard-performance.json", performanceResult);

  const deterministicArtifacts = [MANIFEST_PATH, datasetPath, metricsPath, commonMetricsPath].map((path) => ({
    path: relative(resolve(), path).replaceAll("\\", "/"),
    sha256: hashFile(path)
  }));
  writeJson("deterministic-artifact-hashes.json", {
    algorithm: "SHA-256",
    note: "Timing outputs are intentionally excluded because they are not deterministic artifacts.",
    artifacts: deterministicArtifacts
  });
  writeFileSync(resolve(OUTPUT_DIR, "deterministic-artifact-hashes.sha256"),
    deterministicArtifacts.map((artifact) => `${artifact.sha256}  ${artifact.path}`).join("\n") + "\n");

  const gitStatus = command("git", ["status", "--short"]);
  const environment = {
    timestamp: new Date().toISOString(),
    git: { commit: command("git", ["rev-parse", "HEAD"]), dirty: gitStatus !== "", status: gitStatus },
    ...systemMetadata(),
    pnpmVersion: detectedPnpmVersion(),
    database: readPostgisSummary()?.databaseMetadata ?? "Run pnpm research:agriguard:postgis to capture database metadata.",
    seed: manifest.seed,
    ruleSet: RULES,
    datasetSize: rows.length,
    deterministicArtifacts,
    benchmarkProtocol: {
      pcie: { label: performanceResult.benchmark, warmupRuns: 5, measuredRepetitions: 50, clock: "process.hrtime.bigint" },
      postgis: { label: "single-client indexed ST_Covers lookup benchmark", polygonCounts: [100, 1000, 10000, 100000], warmupRuns: 3, measuredRuns: 10, predicate: "ST_Covers" }
    }
  };
  writeJson("environment.json", environment);

  const report = preliminaryMarkdown(metrics, commonMetrics, ablation, massSensitivity, performanceResult,
    readPostgisSummary(), deterministicArtifacts);
  writeFileSync(resolve(OUTPUT_DIR, "PRELIMINARY_RESEARCH_SUMMARY.md"), report);
  writeFileSync(resolve(OUTPUT_DIR, "PRELIMINARY_RESULTS.md"), report);
  console.log(JSON.stringify({ fullScope: metrics.engines, commonSupport: commonMetrics.engines, performance: performanceResult }, null, 2));
}

function metricTable(engines: any): string {
  const percentage = (value: number) => `${(value * 100).toFixed(2)}%`;
  return `| Engine | Supported | Partial | Unsupported | TP | FP | TN | FN | Precision | Recall | F1 | FPR | FNR |\n` +
    `|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n` +
    [["Preliminary PCIE", engines.pciePreliminary], ["Frozen BATS v1", engines.batsV1Frozen]]
      .map(([name, engine]) => {
        const value = engine.overall;
        const support = engine.supportCounts;
        return `| ${name} | ${support.supported} | ${support.partial} | ${support.unsupported} | ${value.tp} | ${value.fp} | ${value.tn} | ${value.fn} | ${percentage(value.precision)} | ${percentage(value.recall)} | ${percentage(value.f1)} | ${percentage(value.falsePositiveRate)} | ${percentage(value.falseNegativeRate)} |`;
      }).join("\n");
}

function preliminaryMarkdown(
  metrics: any,
  commonMetrics: any,
  ablation: any[],
  massSensitivity: ReturnType<typeof sensitivity>,
  performanceResult: any,
  postgis: any | undefined,
  hashes: Array<{ path: string; sha256: string }>
): string {
  const excluded = commonMetrics.excludedScenarios as Array<{ scenarioId: string; supportClassification: string; reason: string }>;
  const postgisSection = postgis
    ? `| Polygons | Median (ms) | p95 (ms) | p99 (ms) |\n|---:|---:|---:|---:|\n${postgis.groups.map((group: any) => `| ${group.polygonCount} | ${group.medianMs.toFixed(3)} | ${group.p95Ms.toFixed(3)} | ${group.p99Ms.toFixed(3)} |`).join("\n")}\n\nDatabase metadata: ${postgis.databaseMetadata ? `\`${JSON.stringify(postgis.databaseMetadata)}\`` : "not captured in this older result; rerun the PostGIS benchmark."}`
    : "No PostGIS result is present. Run `pnpm research:agriguard:postgis`.";
  return `# BATS-AgriGuard preliminary research summary\n\n> **${CAVEAT}**\n\n` +
    `## Scope\n\nThis report hardens presentation of the unchanged preliminary rule executions. It does not validate field performance, tune the dataset, or alter either engine. Unsupported BATS v1 capabilities are coverage limitations, not detector defects.\n\n` +
    `## Dataset\n\n${metrics.datasetSize} independently labelled synthetic scenarios (${metrics.groundTruthCounts.legitimate} legitimate, ${metrics.groundTruthCounts.adversarial} adversarial), ${metrics.eventCount} events, seed \`${metrics.seed}\`. Labels remain stored in the scenario manifest independently of detector code.\n\n` +
    `## Full-scope synthetic scenario coverage\n\n${metricTable(metrics.engines)}\n\nThis view retains all 24 scenarios for transparent rule and capability coverage. It must not be presented as an apples-to-apples accuracy estimate.\n\n` +
    `## Common-support comparison\n\nPredeclared policy \`${COMMON_SUPPORT_POLICY.id}\`: ${COMMON_SUPPORT_POLICY.inclusionRule} ${COMMON_SUPPORT_POLICY.exclusionRule}\n\n${metricTable(commonMetrics.engines)}\n\nIncluded: ${commonMetrics.datasetSize}; excluded: ${excluded.length}. Membership was selected from semantic support before metric calculation, never from correctness.\n\n` +
    `| Excluded scenario | Classification | Semantic reason |\n|---|---|---|\n${excluded.map((item) => `| ${item.scenarioId} | ${item.supportClassification} | ${item.reason} |`).join("\n")}\n\nSee \`agriguard-support-matrix.csv\` and \`agriguard-support-matrix.md\` for every scenario.\n\n` +
    `## True remove-one-rule ablation\n\n| Configuration | Recall | F1 | Delta recall vs Full | Delta F1 vs Full |\n|---|---:|---:|---:|---:|\n${ablation.map((row) => `| ${row.configuration} | ${row.recall.toFixed(4)} | ${row.f1.toFixed(4)} | ${row.deltaRecallVsFull.toFixed(4)} | ${row.deltaF1VsFull.toFixed(4)} |`).join("\n")}\n\nEach row is an actual full engine re-run with the named rule removed. Within the current scenario suite, removing M produces the largest recall and F1 decrease; this is not a general rule-importance claim.\n\n` +
    `## Mass-balance sensitivity\n\nThe unchanged grid evaluates ${massSensitivity.cases.length} scenarios (${massSensitivity.cases.filter((item) => !item.expectedFraud).length} legitimate, ${massSensitivity.cases.filter((item) => item.expectedFraud).length} adversarial) over ${massSensitivity.results.length} predeclared rho/epsilon configurations. Within this fixed suite, stricter recovery assumptions can create false positives by flagging legitimate process loss, while larger tolerance can reduce recall by accepting adversarial over-output. No best threshold is selected post hoc.\n\n` +
    `## Performance\n\nPCIE label: **${performanceResult.benchmark}**. p50 ${performanceResult.p50PerEventMs.toFixed(6)} ms/event, p95 ${performanceResult.p95PerEventMs.toFixed(6)}, p99 ${performanceResult.p99PerEventMs.toFixed(6)} across ${performanceResult.totalEvents} measured event evaluations. This excludes API, database, EPCIS, Merkle, and blockchain work.\n\n<!-- AGRIGUARD_POSTGIS_START -->\nPostGIS label: **single-client indexed ST_Covers lookup benchmark**. This is not API or end-to-end latency.\n\n${postgisSection}\n<!-- AGRIGUARD_POSTGIS_END -->\n\nMachine metadata is recorded in \`environment.json\`; database metadata is recorded by the PostGIS runner. Timing files are intentionally absent from deterministic hashes.\n\n` +
    `## Reproducibility hashes\n\n| Deterministic artifact | SHA-256 |\n|---|---|\n${hashes.map((item) => `| ${item.path} | \`${item.sha256}\` |`).join("\n")}\n\n` +
    `## Limitations\n\n- Perfect PCIE coverage on hand-authored fixtures is expected and does not demonstrate generalization.\n- This is a small synthetic suite with no field prevalence, sampling frame, external validation, or confidence intervals.\n- Common-support results cover only seven scenarios and omit partial or unavailable BATS v1 semantics.\n- Registry and policy data are immutable fixtures, not production persistence models.\n- Sensitivity behavior is descriptive for six fixed cases and is not threshold optimization.\n- Microbenchmarks exclude network concurrency and end-to-end system costs.\n\n` +
    `## Exact reproduction commands\n\n\`\`\`text\npnpm research:agriguard\npnpm research:agriguard:postgis\npnpm --filter @bats/backend test\npnpm --filter @bats/backend test:integration\npnpm --filter @bats/backend typecheck\npnpm --filter @bats/backend build\ngit diff --check\n\`\`\`\n`;
}

main();
