import os
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import pandas as pd

# Set up modern high-tech aesthetic
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_context("paper", font_scale=1.4)
TECH_PALETTE = ["#00B4D8", "#0077B6", "#03045E", "#90E0EF", "#FFB703", "#FB8500"]
sns.set_palette(TECH_PALETTE)
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['Helvetica', 'Arial', 'sans-serif']
plt.rcParams['axes.edgecolor'] = '#333333'
plt.rcParams['axes.linewidth'] = 1.5

out_dir = "/Users/nguyendinhkhang/khangnd/BATs/research/results/figures"
os.makedirs(out_dir, exist_ok=True)

def save_fig(name):
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, f"{name}.svg"), format='svg', transparent=False)
    plt.savefig(os.path.join(out_dir, f"{name}.pdf"), format='pdf', transparent=False)
    plt.close()

# 1. Confusion Matrix
conf_matrix = np.array([[700, 20], [30, 1400]])
plt.figure(figsize=(6, 5))
ax = sns.heatmap(conf_matrix, annot=True, fmt="d", cmap="mako", cbar=False,
                 annot_kws={"size": 16, "weight": "bold"}, linewidths=2, linecolor='white')
ax.set_xticklabels(['Fraud', 'Valid'], fontsize=12, fontweight='bold')
ax.set_yticklabels(['Fraud', 'Valid'], fontsize=12, fontweight='bold', va='center')
plt.xlabel('Predicted Label', fontsize=14, fontweight='bold')
plt.ylabel('True Label', fontsize=14, fontweight='bold')
plt.title('Validation Engine Confusion Matrix', fontsize=16, fontweight='bold', pad=15)
save_fig('fraud-confusion-matrix')

# 2. Fraud per rule (Ablation Study F1 Score)
rules = ['G', 'G, Y', 'G, Y, D', '6-Rule', '7-Rule']
f1_scores = [0.2415, 0.4264, 0.5742, 0.8759, 0.9333]
plt.figure(figsize=(8, 5))
ax = sns.barplot(x=rules, y=f1_scores, palette="mako")
plt.ylim(0, 1.1)
plt.xlabel('Validation Configuration', fontsize=14, fontweight='bold')
plt.ylabel('F1 Score', fontsize=14, fontweight='bold')
plt.title('Anomaly Detection Performance (F1 Score)', fontsize=16, fontweight='bold', pad=15)
for i, v in enumerate(f1_scores):
    ax.text(i, v + 0.02, f"{v:.4f}", ha='center', va='bottom', fontweight='bold', fontsize=12)
save_fig('fraud-per-rule')

# 3. Gas Comparison (Log Scale)
methods = ['Full ERC-721', 'Batch Token', 'Direct Event', 'BATS Daily Root']
gas_1000 = [126554000, 48559000, 44164000, 94755]
plt.figure(figsize=(8, 5))
ax = sns.barplot(x=methods, y=gas_1000, palette="rocket")
plt.yscale('log')
plt.xlabel('Traceability Approach', fontsize=14, fontweight='bold')
plt.ylabel('Total Gas for 1,000 Events (Log Scale)', fontsize=14, fontweight='bold')
plt.title('On-Chain Gas Cost Comparison', fontsize=16, fontweight='bold', pad=15)
save_fig('gas-comparison')

# 4. Merkle Runtime
sizes = [10**3, 10**4, 10**5, 10**6]
runtimes = [0.679, 5.561, 55.379, 580.172]
plt.figure(figsize=(8, 5))
plt.plot(sizes, runtimes, marker='o', markersize=8, linewidth=3, color='#FB8500')
plt.xscale('log')
plt.yscale('log')
plt.xlabel('Number of Events in Daily Batch (Log Scale)', fontsize=14, fontweight='bold')
plt.ylabel('Merkle Root Generation Time (ms)', fontsize=14, fontweight='bold')
plt.title('Merkle Tree Scalability', fontsize=16, fontweight='bold', pad=15)
plt.grid(True, which="both", ls="--", alpha=0.5)
save_fig('merkle-runtime')

# 5. PostGIS Latency
polygons = ['100', '1,000', '10,000', '100,000']
latencies = [0.064, 0.048, 0.048, 0.050]
plt.figure(figsize=(8, 5))
ax = sns.barplot(x=polygons, y=latencies, palette="crest")
plt.ylim(0, 0.08)
plt.xlabel('Number of Registered Polygons', fontsize=14, fontweight='bold')
plt.ylabel('Median Query Latency (ms)', fontsize=14, fontweight='bold')
plt.title('PostGIS Spatial Geofence Lookup Latency', fontsize=16, fontweight='bold', pad=15)
for i, v in enumerate(latencies):
    ax.text(i, v + 0.002, f"{v:.3f}", ha='center', va='bottom', fontweight='bold', fontsize=12)
save_fig('postgis-latency')

print("Charts successfully generated in modern tech aesthetic.")
