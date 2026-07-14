import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ethers } from "hardhat";

async function gasUsed(transaction: Promise<{ wait(): Promise<{ gasUsed: bigint } | null> }>) {
  const receipt = await (await transaction).wait();
  if (!receipt) throw new Error("Transaction was not mined.");
  return receipt.gasUsed;
}

function median(values: bigint[]): bigint {
  const sorted = [...values].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return sorted[Math.floor(sorted.length / 2)] ?? 0n;
}

async function main() {
  const anchor = await ethers.deployContract("BATSAnchor");
  const direct = await ethers.deployContract("DirectEventLogBaseline");
  const token = await ethers.deployContract("MinimalBatchTokenBaseline");
  await Promise.all([anchor.waitForDeployment(), direct.waitForDeployment(), token.waitForDeployment()]);

  const samples = Number(process.env.GAS_SAMPLES ?? "30");
  const anchorGas: bigint[] = [];
  const directGas: bigint[] = [];
  const tokenGas: bigint[] = [];

  for (let index = 0; index < samples; index += 1) {
    const root = ethers.sha256(ethers.toUtf8Bytes(`root-${index}`));
    const eventHash = ethers.sha256(ethers.toUtf8Bytes(`event-${index}`));
    anchorGas.push(
      await gasUsed(
        anchor.getFunction("anchorDailyRoot")(
          root,
          `2026-08-${String(index + 1).padStart(2, "0")}`,
          "bats-epcis-0.1"
        )
      )
    );
    directGas.push(await gasUsed(direct.getFunction("logEvent")(eventHash)));
    tokenGas.push(await gasUsed(token.getFunction("mintBatch")()));
  }

  const medians = {
    anchor: median(anchorGas),
    direct: median(directGas),
    token: median(tokenGas)
  };
  const volumes = [1_000, 10_000, 100_000, 1_000_000];
  const rows = volumes.flatMap((events) => {
    const anchorTotal = medians.anchor;
    return [
      {
        approach: "minimal_batch_token_baseline",
        events,
        gas: medians.token * BigInt(events),
        savingVsBaselinePercent:
          100 * (1 - Number(anchorTotal) / Number(medians.token * BigInt(events)))
      },
      {
        approach: "direct_event_log_baseline",
        events,
        gas: medians.direct * BigInt(events),
        savingVsBaselinePercent:
          100 * (1 - Number(anchorTotal) / Number(medians.direct * BigInt(events)))
      },
      {
        approach: "bats_daily_merkle_anchor",
        events,
        gas: anchorTotal,
        savingVsBaselinePercent: 0
      }
    ];
  });

  const outputDir = resolve(process.env.RESEARCH_OUTPUT_DIR ?? "../../research/results");
  mkdirSync(outputDir, { recursive: true });
  const csv = [
    "approach,events,projected_gas,bats_saving_vs_approach_percent",
    ...rows.map((row) =>
      [row.approach, row.events, row.gas, row.savingVsBaselinePercent.toFixed(6)].join(",")
    )
  ].join("\n");
  writeFileSync(resolve(outputDir, "gas-benchmark.csv"), `${csv}\n`);
  writeFileSync(
    resolve(outputDir, "gas-benchmark.json"),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        network: (await ethers.provider.getNetwork()).name,
        samples,
        medianGas: Object.fromEntries(
          Object.entries(medians).map(([key, value]) => [key, value.toString()])
        ),
        methodology:
          "Measured median transaction gas on the local Hardhat EVM, then projected per-event baselines linearly. Token baseline is not a full ERC-721 implementation.",
        rows: rows.map((row) => ({ ...row, gas: row.gas.toString() }))
      },
      null,
      2
    )}\n`
  );
  console.log({
    samples,
    medianGas: Object.fromEntries(
      Object.entries(medians).map(([key, value]) => [key, value.toString()])
    )
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
