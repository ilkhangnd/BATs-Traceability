#!/usr/bin/env python3
"""Generate publication-ready figures from BATS-AgriGuard preliminary artifacts.

The script reads the existing CSV/JSON result files directly; measured metrics are
not hard-coded. Run it from the repository root:

    python research/visualize_agriguard.py

or specify paths explicitly:

    python research/visualize_agriguard.py \
      --input-dir research/results/agriguard-preliminary \
      --output-dir research/results/agriguard-preliminary/figures

Outputs are written as both PNG (300 DPI) and SVG.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
from pathlib import Path
from typing import Iterable

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np


ENGINE_LABELS = {
    "pcie-preliminary": "Preliminary PCIE",
    "bats-v1-frozen": "Frozen BATS v1",
}


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def read_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def as_float(value: str | int | float | None) -> float:
    if value is None or value == "":
        return math.nan
    return float(value)


def engine_label(raw: str) -> str:
    return ENGINE_LABELS.get(raw, raw)


def save_figure(fig: plt.Figure, output_dir: Path, stem: str) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    png = output_dir / f"{stem}.png"
    svg = output_dir / f"{stem}.svg"
    fig.savefig(png, dpi=300, bbox_inches="tight")
    fig.savefig(svg, bbox_inches="tight")
    plt.close(fig)
    print(f"[OK] {png}")
    print(f"[OK] {svg}")


def add_bar_labels(ax: plt.Axes, bars: Iterable, decimals: int = 3) -> None:
    for bar in bars:
        height = bar.get_height()
        if not np.isfinite(height):
            continue
        ax.annotate(
            f"{height:.{decimals}f}",
            xy=(bar.get_x() + bar.get_width() / 2, height),
            xytext=(0, 3),
            textcoords="offset points",
            ha="center",
            va="bottom",
            fontsize=8,
        )


def plot_engine_metrics(csv_path: Path, output_dir: Path, stem: str, title: str) -> None:
    rows = read_csv(csv_path)
    if not rows:
        raise ValueError(f"No rows in {csv_path}")

    metrics = ["recall", "f1", "false_negative_rate"]
    metric_labels = ["Recall", "F1", "FNR"]
    engines = [engine_label(r["engine"]) for r in rows]

    x = np.arange(len(metric_labels), dtype=float)
    width = 0.34 if len(rows) <= 2 else 0.8 / len(rows)

    fig, ax = plt.subplots(figsize=(8.2, 4.8))
    for idx, row in enumerate(rows):
        values = [as_float(row[m]) for m in metrics]
        offset = (idx - (len(rows) - 1) / 2) * width
        bars = ax.bar(x + offset, values, width=width, label=engines[idx])
        add_bar_labels(ax, bars)

    ax.set_title(title)
    ax.set_ylabel("Giá trị")
    ax.set_xticks(x, metric_labels)
    ax.set_ylim(0, 1.12)
    ax.legend()
    ax.grid(axis="y", alpha=0.25)
    fig.tight_layout()
    save_figure(fig, output_dir, stem)


def plot_support_coverage(csv_path: Path, output_dir: Path) -> None:
    rows = read_csv(csv_path)
    engines = [engine_label(r["engine"]) for r in rows]
    supported = np.array([as_float(r["supported"]) for r in rows])
    partial = np.array([as_float(r["partial"]) for r in rows])
    unsupported = np.array([as_float(r["unsupported"]) for r in rows])

    x = np.arange(len(rows))
    fig, ax = plt.subplots(figsize=(7.6, 4.8))
    b1 = ax.bar(x, supported, label="Supported")
    b2 = ax.bar(x, partial, bottom=supported, label="Partial")
    b3 = ax.bar(x, unsupported, bottom=supported + partial, label="Unsupported")

    for bars, bottoms in [(b1, np.zeros_like(supported)), (b2, supported), (b3, supported + partial)]:
        for bar, bottom in zip(bars, bottoms):
            value = bar.get_height()
            if value <= 0:
                continue
            ax.text(
                bar.get_x() + bar.get_width() / 2,
                bottom + value / 2,
                f"{int(value)}",
                ha="center",
                va="center",
                fontsize=9,
            )

    ax.set_title("Semantic support trên full-scope scenario suite")
    ax.set_ylabel("Số scenario")
    ax.set_xticks(x, engines)
    ax.legend()
    ax.grid(axis="y", alpha=0.25)
    fig.tight_layout()
    save_figure(fig, output_dir, "support_coverage")


def plot_ablation(csv_path: Path, output_dir: Path) -> None:
    rows = read_csv(csv_path)
    labels = [r["configuration"] for r in rows]
    f1 = [as_float(r["f1"]) for r in rows]

    y = np.arange(len(rows))
    fig, ax = plt.subplots(figsize=(8.2, 5.0))
    bars = ax.barh(y, f1)
    ax.set_yticks(y, labels)
    ax.invert_yaxis()
    ax.set_xlim(0, 1.08)
    ax.set_xlabel("F1")
    ax.set_title("True remove-one-rule ablation của PCIE")
    ax.grid(axis="x", alpha=0.25)

    for bar, value in zip(bars, f1):
        ax.text(
            min(value + 0.01, 1.04),
            bar.get_y() + bar.get_height() / 2,
            f"{value:.4f}",
            va="center",
            fontsize=9,
        )

    fig.tight_layout()
    save_figure(fig, output_dir, "ablation_f1")


def build_sensitivity_matrix(rows: list[dict[str, str]], field: str):
    rhos = sorted({as_float(r["rho"]) for r in rows})
    eps = sorted({as_float(r["epsilon_pct"]) for r in rows})
    lookup = {(as_float(r["rho"]), as_float(r["epsilon_pct"])): as_float(r[field]) for r in rows}
    matrix = np.array([[lookup[(rho, epsilon)] for epsilon in eps] for rho in rhos], dtype=float)
    return rhos, eps, matrix


def plot_heatmap(
    rows: list[dict[str, str]],
    field: str,
    title: str,
    output_dir: Path,
    stem: str,
) -> None:
    rhos, eps, matrix = build_sensitivity_matrix(rows, field)

    fig, ax = plt.subplots(figsize=(7.4, 5.2))
    image = ax.imshow(matrix, aspect="auto", vmin=0, vmax=1)
    cbar = fig.colorbar(image, ax=ax)
    cbar.set_label(field.replace("_", " ").title())

    ax.set_xticks(np.arange(len(eps)), [f"{e * 100:.0f}%" for e in eps])
    ax.set_yticks(np.arange(len(rhos)), [f"{r:.2f}" for r in rhos])
    ax.set_xlabel("Dung sai ε")
    ax.set_ylabel("Tỷ lệ thu hồi ρ")
    ax.set_title(title)

    for i in range(len(rhos)):
        for j in range(len(eps)):
            ax.text(j, i, f"{matrix[i, j]:.2f}", ha="center", va="center", fontsize=9)

    fig.tight_layout()
    save_figure(fig, output_dir, stem)


def plot_mass_balance_sensitivity(csv_path: Path, output_dir: Path) -> None:
    rows = read_csv(csv_path)
    plot_heatmap(
        rows,
        field="recall",
        title="Mass-balance sensitivity: Recall theo ρ và ε",
        output_dir=output_dir,
        stem="mass_balance_recall_heatmap",
    )
    plot_heatmap(
        rows,
        field="false_positive_rate",
        title="Mass-balance sensitivity: FPR theo ρ và ε",
        output_dir=output_dir,
        stem="mass_balance_fpr_heatmap",
    )


def plot_postgis(summary_path: Path, output_dir: Path) -> None:
    data = read_json(summary_path)
    groups = data["groups"]
    polygon_counts = [g["polygonCount"] for g in groups]
    median = [g["medianMs"] for g in groups]
    p95 = [g["p95Ms"] for g in groups]

    fig, ax = plt.subplots(figsize=(8.2, 4.8))
    ax.plot(polygon_counts, median, marker="o", label="Median")
    ax.plot(polygon_counts, p95, marker="o", label="p95")
    ax.set_xscale("log")
    ax.set_xlabel("Số polygon (log scale)")
    ax.set_ylabel("Thời gian lookup (ms)")
    ax.set_title("Indexed ST_Covers lookup benchmark")
    ax.legend()
    ax.grid(alpha=0.25)
    ax.text(
        0.01,
        -0.22,
        "Lưu ý: single-client DB lookup; không phải API/end-to-end latency.",
        transform=ax.transAxes,
        fontsize=9,
    )
    fig.tight_layout()
    save_figure(fig, output_dir, "postgis_st_covers")


def plot_performance(perf_path: Path, output_dir: Path) -> None:
    data = read_json(perf_path)
    labels = ["p50", "p95", "p99"]
    values = [data["p50PerEventMs"], data["p95PerEventMs"], data["p99PerEventMs"]]

    fig, ax = plt.subplots(figsize=(7.4, 4.6))
    bars = ax.bar(labels, values)
    add_bar_labels(ax, bars, decimals=5)
    ax.set_ylabel("ms/event")
    ax.set_title("PCIE rule-engine-only latency percentiles")
    ax.grid(axis="y", alpha=0.25)
    ax.text(
        0.01,
        -0.22,
        "Loại trừ HTTP/API, PostGIS, persistence, EPCIS, Merkle và blockchain.",
        transform=ax.transAxes,
        fontsize=9,
    )
    fig.tight_layout()
    save_figure(fig, output_dir, "pcie_latency_percentiles")


def plot_per_rule(metrics_json_path: Path, output_dir: Path) -> None:
    data = read_json(metrics_json_path)
    per_rule = data["engines"]["pciePreliminary"]["perRule"]
    rules = list(per_rule.keys())
    tp = [per_rule[r]["tp"] for r in rules]

    fig, ax = plt.subplots(figsize=(7.8, 4.6))
    bars = ax.bar(rules, tp)
    ax.set_xlabel("Rule family")
    ax.set_ylabel("True-positive scenarios")
    ax.set_title("PCIE per-rule adversarial scenario coverage")
    ax.set_ylim(0, max(tp) + 1)
    ax.grid(axis="y", alpha=0.25)

    for bar, value in zip(bars, tp):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            value + 0.08,
            str(value),
            ha="center",
            va="bottom",
            fontsize=9,
        )

    fig.tight_layout()
    save_figure(fig, output_dir, "pcie_per_rule_coverage")


def require_files(input_dir: Path, names: list[str]) -> dict[str, Path]:
    result = {name: input_dir / name for name in names}
    missing = [str(path) for path in result.values() if not path.exists()]
    if missing:
        joined = "\n  - ".join(missing)
        raise FileNotFoundError(f"Missing required result files:\n  - {joined}")
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description="Visualize BATS-AgriGuard preliminary experiment results.")
    parser.add_argument(
        "--input-dir",
        type=Path,
        default=Path("research/results/agriguard-preliminary"),
        help="Directory containing AgriGuard result CSV/JSON files.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=None,
        help="Figure output directory. Default: <input-dir>/figures",
    )
    args = parser.parse_args()

    input_dir = args.input_dir
    output_dir = args.output_dir or (input_dir / "figures")

    files = require_files(
        input_dir,
        [
            "agriguard-metrics.csv",
            "agriguard-common-support-metrics.csv",
            "agriguard-ablation.csv",
            "agriguard-mass-balance-sensitivity.csv",
            "agriguard-postgis-summary.json",
            "agriguard-performance.json",
            "agriguard-metrics.json",
        ],
    )

    plot_engine_metrics(
        files["agriguard-metrics.csv"],
        output_dir,
        stem="full_scope_comparison",
        title="Full-scope synthetic scenario coverage",
    )
    plot_engine_metrics(
        files["agriguard-common-support-metrics.csv"],
        output_dir,
        stem="common_support_comparison",
        title="Common-support comparison (n=7)",
    )
    plot_support_coverage(files["agriguard-metrics.csv"], output_dir)
    plot_ablation(files["agriguard-ablation.csv"], output_dir)
    plot_mass_balance_sensitivity(files["agriguard-mass-balance-sensitivity.csv"], output_dir)
    plot_postgis(files["agriguard-postgis-summary.json"], output_dir)
    plot_performance(files["agriguard-performance.json"], output_dir)
    plot_per_rule(files["agriguard-metrics.json"], output_dir)

    print(f"\nGenerated figures in: {output_dir.resolve()}")


if __name__ == "__main__":
    main()
