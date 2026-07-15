import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const resultsDir = resolve(process.env.RESEARCH_OUTPUT_DIR ?? "research/results");
const figuresDir = resolve(resultsDir, "figures");
mkdirSync(figuresDir, { recursive: true });

const escapeXml = (value) =>
  String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

function frame(title, subtitle, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720">
  <rect width="1200" height="720" fill="#fbfcf8"/>
  <style>
    text{font-family:Inter,Arial,sans-serif;fill:#14251b}
    .title{font-size:30px;font-weight:700}.subtitle{font-size:15px;fill:#52625a}
    .axis{stroke:#85928b;stroke-width:1}.grid{stroke:#dfe5e0;stroke-width:1}
    .label{font-size:14px}.value{font-size:13px;font-weight:600}
  </style>
  <text x="75" y="58" class="title">${escapeXml(title)}</text>
  <text x="75" y="86" class="subtitle">${escapeXml(subtitle)}</text>
  ${body}
</svg>`;
}

function merkleChart() {
  const data = JSON.parse(readFileSync(resolve(resultsDir, "merkle-benchmark.json"), "utf8"));
  const grouped = new Map();
  for (const row of data.results) {
    const values = grouped.get(row.size) ?? [];
    values.push(row.rootMs);
    grouped.set(row.size, values);
  }
  const points = [...grouped].map(([size, values]) => ({
    size,
    median: [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
  }));
  const left = 100;
  const top = 130;
  const width = 1020;
  const height = 480;
  const maxY = Math.max(...points.map((point) => point.median)) * 1.1;
  const x = (index) => left + (index * width) / Math.max(1, points.length - 1);
  const y = (value) => top + height - (value / maxY) * height;
  const grid = Array.from({ length: 6 }, (_, index) => {
    const value = (maxY * index) / 5;
    const py = y(value);
    return `<line x1="${left}" y1="${py}" x2="${left + width}" y2="${py}" class="grid"/>
      <text x="${left - 14}" y="${py + 5}" text-anchor="end" class="label">${value.toFixed(
        0
      )}</text>`;
  }).join("");
  const path = points.map((point, index) => `${x(index)},${y(point.median)}`).join(" ");
  const marks = points
    .map(
      (point, index) => `<circle cx="${x(index)}" cy="${y(point.median)}" r="7" fill="#17683f"/>
      <text x="${x(index)}" y="${y(point.median) - 16}" text-anchor="middle" class="value">${point.median.toFixed(
        2
      )} ms</text>
      <text x="${x(index)}" y="${top + height + 34}" text-anchor="middle" class="label">${point.size.toLocaleString(
        "en-US"
      )}</text>`
    )
    .join("");
  return frame(
    "Merkle root generation scalability",
    `Median of ${data.repeats} runs · ${data.node} · ${data.platform}`,
    `${grid}<line x1="${left}" y1="${top}" x2="${left}" y2="${top + height}" class="axis"/>
    <line x1="${left}" y1="${top + height}" x2="${left + width}" y2="${top + height}" class="axis"/>
    <polyline points="${path}" fill="none" stroke="#17683f" stroke-width="4"/>
    ${marks}
    <text x="30" y="${top + height / 2}" transform="rotate(-90 30 ${
      top + height / 2
    })" text-anchor="middle" class="label">Root generation time (ms)</text>
    <text x="${left + width / 2}" y="690" text-anchor="middle" class="label">Daily EPCIS events (N)</text>`
  );
}

function gasChart() {
  const data = JSON.parse(readFileSync(resolve(resultsDir, "gas-benchmark.json"), "utf8"));
  const rows = data.rows.filter((row) => row.events === 1000);
  const labels = {
    full_erc721_traceability_baseline: "Full ERC-721",
    minimal_batch_token_baseline: "Minimal token",
    direct_event_log_baseline: "Direct event log",
    bats_daily_merkle_anchor: "BATS daily root"
  };
  const colors = ["#8a3f2d", "#b66b39", "#657b70", "#17683f"];
  const left = 110;
  const top = 140;
  const height = 460;
  const barWidth = 170;
  const gap = 60;
  const maxLog = Math.max(...rows.map((row) => Math.log10(Number(row.gas))));
  const bars = rows
    .map((row, index) => {
      const value = Number(row.gas);
      const barHeight = (Math.log10(value) / maxLog) * height;
      const x = left + index * (barWidth + gap);
      const y = top + height - barHeight;
      return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="10" fill="${
        colors[index] || "#2f8056"
      }"/>
      <text x="${x + barWidth / 2}" y="${y - 16}" text-anchor="middle" class="value">${value.toLocaleString(
        "en-US"
      )} gas</text>
      <text x="${x + barWidth / 2}" y="${top + height + 34}" text-anchor="middle" class="label">${
        labels[row.approach] || row.approach
      }</text>`;
    })
    .join("");
  return frame(
    "Projected EVM gas at 1,000 events per day",
    `Median of ${data.samples} local Hardhat samples · logarithmic y-axis`,
    `<line x1="${left - 30}" y1="${top + height}" x2="1110" y2="${top + height}" class="axis"/>
    ${bars}
    <text x="34" y="${top + height / 2}" transform="rotate(-90 34 ${
      top + height / 2
    })" text-anchor="middle" class="label">Gas used (log scale)</text>
    <text x="600" y="680" text-anchor="middle" class="subtitle">Baselines include minimal research contracts and OpenZeppelin Full ERC-721.</text>`
  );
}

function confusionMatrix() {
  const data = JSON.parse(readFileSync(resolve(resultsDir, "fraud-metrics.json"), "utf8"));
  const { tp, fp, tn, fn } = data.confusionMatrix;
  const cells = [
    { x: 0, y: 0, label: "True positive", value: tp, color: "#2f8056" },
    { x: 1, y: 0, label: "False negative", value: fn, color: "#d88c5a" },
    { x: 0, y: 1, label: "False positive", value: fp, color: "#d88c5a" },
    { x: 1, y: 1, label: "True negative", value: tn, color: "#2f8056" }
  ];
  const boxes = cells
    .map((cell) => {
      const x = 300 + cell.x * 330;
      const y = 180 + cell.y * 220;
      return `<rect x="${x}" y="${y}" width="300" height="190" rx="14" fill="${cell.color}" opacity="0.92"/>
      <text x="${x + 150}" y="${y + 75}" text-anchor="middle" font-size="20" fill="white">${cell.label}</text>
      <text x="${x + 150}" y="${y + 135}" text-anchor="middle" font-size="46" font-weight="700" fill="white">${cell.value}</text>`;
    })
    .join("");
  return frame(
    "Synthetic fraud-detection confusion matrix",
    `${data.total} deterministic samples · F1=${data.f1.toFixed(3)} · not a field-accuracy claim`,
    `<text x="465" y="140" text-anchor="middle" class="label">Predicted fraud</text>
    <text x="795" y="140" text-anchor="middle" class="label">Predicted valid</text>
    <text x="250" y="280" text-anchor="end" class="label">Actual fraud</text>
    <text x="250" y="500" text-anchor="end" class="label">Actual valid</text>
    ${boxes}`
  );
}

function perRuleFraudChart() {
  const data = JSON.parse(readFileSync(resolve(resultsDir, "fraud-metrics.json"), "utf8"));
  const entries = Object.entries(data.perRule);
  const left = 100;
  const top = 150;
  const height = 430;
  const barWidth = 90;
  const gap = 55;
  const bars = entries
    .map(([rule, metric], index) => {
      const barHeight = metric.f1 * height;
      const x = left + index * (barWidth + gap);
      const y = top + height - barHeight;
      return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="9" fill="#17683f"/>
      <text x="${x + barWidth / 2}" y="${y - 14}" text-anchor="middle" class="value">${metric.f1.toFixed(
        3
      )}</text>
      <text x="${x + barWidth / 2}" y="${top + height + 32}" text-anchor="middle" class="label">${rule}</text>`;
    })
    .join("");
  return frame(
    "Synthetic fraud detection by rule",
    "Per-rule F1 on deterministic noisy scenarios · not a field-accuracy claim",
    `<line x1="${left - 25}" y1="${top + height}" x2="1120" y2="${top + height}" class="axis"/>
    ${bars}
    <text x="34" y="${top + height / 2}" transform="rotate(-90 34 ${
      top + height / 2
    })" text-anchor="middle" class="label">F1 score</text>
    <text x="600" y="680" text-anchor="middle" class="subtitle">G includes undetected in-geofence spoofing; A includes legitimate degraded GPS.</text>`
  );
}

function postgisChart() {
  const data = JSON.parse(readFileSync(resolve(resultsDir, "postgis-summary.json"), "utf8"));
  const left = 120;
  const top = 150;
  const height = 430;
  const barWidth = 150;
  const gap = 90;
  const max = Math.max(...data.groups.map((group) => group.medianMs)) * 1.25;
  const bars = data.groups
    .map((group, index) => {
      const barHeight = (group.medianMs / max) * height;
      const x = left + index * (barWidth + gap);
      const y = top + height - barHeight;
      return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="10" fill="#17683f"/>
      <text x="${x + barWidth / 2}" y="${y - 15}" text-anchor="middle" class="value">${group.medianMs.toFixed(
        3
      )} ms</text>
      <text x="${x + barWidth / 2}" y="${top + height + 34}" text-anchor="middle" class="label">${group.polygonCount.toLocaleString(
        "en-US"
      )}</text>`;
    })
    .join("");
  return frame(
    "Indexed PostGIS geofence latency",
    "Median of 10 measured ST_Contains queries after 3 warm-up runs",
    `<line x1="${left - 30}" y1="${top + height}" x2="1100" y2="${top + height}" class="axis"/>
    ${bars}
    <text x="34" y="${top + height / 2}" transform="rotate(-90 34 ${
      top + height / 2
    })" text-anchor="middle" class="label">Median execution time (ms)</text>
    <text x="600" y="680" text-anchor="middle" class="label">Registered farm-plot polygons</text>`
  );
}

writeFileSync(resolve(figuresDir, "merkle-runtime.svg"), merkleChart());
writeFileSync(resolve(figuresDir, "gas-comparison.svg"), gasChart());
writeFileSync(resolve(figuresDir, "fraud-confusion-matrix.svg"), confusionMatrix());
writeFileSync(resolve(figuresDir, "fraud-per-rule.svg"), perRuleFraudChart());
writeFileSync(resolve(figuresDir, "postgis-latency.svg"), postgisChart());
console.log(`Wrote publication-ready SVG figures to ${figuresDir}`);
