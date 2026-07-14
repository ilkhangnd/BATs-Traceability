import React, { useEffect, useState } from "react";
import { Copy, ExternalLink, Calendar, Layers, QrCode, ShieldCheck, X } from "lucide-react";
import { API_BASE_URL, fetchWithTimeout } from "../config.js";
import { BatsZaloSession, copyTextToClipboard, openBatsWebview } from "../zalo-session.js";
import { HarvestHistoryBatch, readHarvestHistory, subscribeHarvestHistory } from "../harvest-history.js";

interface HistoryPageProps {
  session: BatsZaloSession | null;
}

type Batch = HarvestHistoryBatch & {
  id: string;
  cropType: string;
  quantityKg: number;
  status: "COLLECTED" | "ANCHORED" | "PENDING_SYNC";
  createdAt: string;
  actorId: string;
  plotId: string;
};

function normalizeServerBatch(batch: any): Batch {
  return {
    id: String(batch.id ?? batch.batchId ?? "SR-LOCAL"),
    cropType: String(batch.cropType ?? batch.variety ?? "Sầu riêng Ri6"),
    quantityKg: Number(batch.quantityKg ?? 0),
    status: batch.status === "ANCHORED" ? "ANCHORED" : "COLLECTED",
    createdAt: String(batch.createdAt ?? batch.eventTime ?? new Date().toISOString()),
    actorId: String(batch.actorId ?? "FARMER-0001"),
    plotId: String(batch.plotId ?? batch.farmPlotId ?? "PLOT-EAYONG-01")
  };
}

function mergeBatches(serverBatches: Batch[], localBatches: Batch[]): Batch[] {
  const byId = new Map<string, Batch>();
  for (const batch of [...localBatches, ...serverBatches]) {
    byId.set(batch.id, batch);
  }
  return [...byId.values()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function getDemoGtin(batchId: string) {
  if (batchId.startsWith("XC")) return "8930000000026";
  if (batchId.startsWith("CP")) return "8930000000033";
  return "8930000000019";
}

function createDigitalLink(batchId: string) {
  const verifyHost = import.meta.env.VITE_VERIFY_URL || "http://localhost:3000";
  return `${verifyHost}/verify/${getDemoGtin(batchId)}/${encodeURIComponent(batchId)}/0001`;
}

function createQrImageUrl(value: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=10&data=${encodeURIComponent(value)}`;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ session }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [copyStatus, setCopyStatus] = useState<{ batchId: string; text: string } | null>(null);
  const [portalPreview, setPortalPreview] = useState<{ batch: Batch; digitalLink: string } | null>(null);
  const [portalActionStatus, setPortalActionStatus] = useState<string | null>(null);
  const justifiedText = { textAlign: "justify" as const, textJustify: "inter-word" as const };
  const actorId = session?.actor.id ?? "FARMER-0001";
  const isCollector = session?.actor.role === "COLLECTOR";

  const fetchBatches = async () => {
    setLoading(true);
    const localBatches = readHarvestHistory(actorId);
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/batches?actorId=${encodeURIComponent(actorId)}`, {}, 2500);
      if (res.ok) {
        const data = await res.json();
        const rawItems = Array.isArray(data.items) ? data.items : Array.isArray(data.batches) ? data.batches : Array.isArray(data) ? data : [];
        const serverBatches = rawItems.map(normalizeServerBatch).filter((batch: Batch) => batch.actorId === actorId);
        setBatches(mergeBatches(serverBatches, localBatches));
        return;
      }
      setBatches(localBatches);
    } catch {
      // Lịch sử cục bộ vẫn hiển thị được khi backend không phản hồi.
      setBatches(localBatches);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const refreshLocalHistory = () => {
      setBatches((current) => mergeBatches(current, readHarvestHistory(actorId)));
    };
    const unsubscribe = subscribeHarvestHistory(refreshLocalHistory);
    void fetchBatches();
    return unsubscribe;
  }, [actorId]);

  const getStatusBadge = (status: Batch["status"]) => {
    if (status === "ANCHORED") {
      return {
        text: "Đã khóa chuỗi",
        backgroundColor: "#dcfce7",
        color: "#166534"
      };
    }
    if (status === "PENDING_SYNC") {
      return {
        text: "Chờ đồng bộ",
        backgroundColor: "#fef3c7",
        color: "#b45309"
      };
    }
    return {
      text: isCollector ? "Đã nhận lô" : "Đã thu gom",
      backgroundColor: "#eff6ff",
      color: "#1d4ed8"
    };
  };

  return (
    <div style={{ padding: "16px", paddingBottom: "16px", flex: 1 }}>
      {portalPreview && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 300,
            backgroundColor: "rgba(15, 23, 42, 0.42)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "18px"
          }}
        >
          <div style={{ width: "100%", maxWidth: "360px", backgroundColor: "#ffffff", borderRadius: "18px", padding: "18px", boxShadow: "0 18px 40px rgba(15, 23, 42, 0.28)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "14px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#155d3b", fontSize: "13px", fontWeight: 800, marginBottom: "4px" }}>
                  <ShieldCheck size={18} />
                  <span>Cổng kiểm chứng GS1</span>
                </div>
                <h4 style={{ margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: 800 }}>{portalPreview.batch.cropType}</h4>
              </div>
              <button
                type="button"
                onClick={() => setPortalPreview(null)}
                aria-label="Đóng"
                style={{ width: "36px", height: "36px", borderRadius: "999px", border: "1px solid #dfe3da", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", color: "#667069" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", gap: "14px", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ width: "104px", height: "104px", borderRadius: "14px", border: "1px solid #dfe3da", padding: "7px", flexShrink: 0 }}>
                <img src={createQrImageUrl(portalPreview.digitalLink)} alt="QR kiểm chứng GS1" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "12px", color: "#667069", fontWeight: 700 }}>Mã lô</div>
                <div style={{ fontSize: "14px", color: "#172019", fontWeight: 800, wordBreak: "break-word", marginBottom: "8px" }}>{portalPreview.batch.id}</div>
                <div style={{ fontSize: "12px", color: "#667069", fontWeight: 700 }}>Trạng thái</div>
                <div style={{ display: "inline-flex", marginTop: "4px", padding: "5px 10px", borderRadius: "999px", backgroundColor: portalPreview.batch.status === "PENDING_SYNC" ? "#fef3c7" : "#e8f0eb", color: portalPreview.batch.status === "PENDING_SYNC" ? "#b45309" : "#155d3b", fontSize: "12px", fontWeight: 800 }}>
                  {portalPreview.batch.status === "PENDING_SYNC" ? "Chờ đồng bộ" : "Đã ghi nhận"}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: "#f5f5ef", borderRadius: "12px", padding: "10px", fontSize: "12px", color: "#64748b", lineHeight: 1.45, wordBreak: "break-word", marginBottom: "14px" }}>
              {portalPreview.digitalLink}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button
                type="button"
                onClick={async () => {
                  setPortalActionStatus("Đang mở cổng web...");
                  await openBatsWebview(portalPreview.digitalLink);
                  setPortalActionStatus("Đã gửi yêu cầu mở web.");
                }}
                style={{ minHeight: "44px", border: "none", borderRadius: "12px", backgroundColor: "#eef4ff", color: "#0f4fbf", fontSize: "13px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}
              >
                <ExternalLink size={16} />
                <span>Mở web</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  const copied = await copyTextToClipboard(portalPreview.digitalLink);
                  setCopyStatus({ batchId: portalPreview.batch.id, text: copied ? "Đã copy link" : "Không copy được" });
                  setPortalActionStatus(copied ? "Đã copy link kiểm chứng." : "Không copy được, vui lòng giữ và chọn link.");
                }}
                style={{ minHeight: "44px", border: "1px solid #dfe3da", borderRadius: "12px", backgroundColor: "#ffffff", color: "#155d3b", fontSize: "13px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}
              >
                <Copy size={16} />
                <span>{copyStatus?.batchId === portalPreview.batch.id ? "Đã copy" : "Copy"}</span>
              </button>
            </div>
            {portalActionStatus && (
              <div style={{ marginTop: "10px", borderRadius: "10px", backgroundColor: "#e8f0eb", color: "#155d3b", padding: "8px 10px", fontSize: "12px", fontWeight: 800, textAlign: "center" }}>
                {portalActionStatus}
              </div>
            )}
          </div>
        </div>
      )}

      <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "14px" }}>
        {isCollector ? "Lịch sử phiếu thu mua & mã QR GS1" : "Lịch sử lô đã chốt & mã QR GS1"}
      </h3>

      {loading ? (
        <div style={{ padding: "40px", color: "#64748b", ...justifiedText }}>Đang tải danh sách lô...</div>
      ) : batches.length === 0 ? (
        <div style={{ padding: "40px", backgroundColor: "#fff", borderRadius: "16px", textAlign: "center" }}>
          {isCollector ? "Chưa có phiếu thu mua nào được ghi nhận." : "Chưa có lô thu hoạch nào được ghi nhận."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {batches.map((b) => (
            <div
              key={b.id}
              style={{
                backgroundColor: "#fff",
                borderRadius: "16px",
                padding: "16px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{b.cropType}</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#16a34a", marginTop: "2px" }}>
                    Sản lượng: {b.quantityKg.toLocaleString()} Kg
                  </div>
                </div>
                {(() => {
                  const badge = getStatusBadge(b.status);
                  return (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "4px 8px",
                        borderRadius: "8px",
                        backgroundColor: badge.backgroundColor,
                        color: badge.color
                      }}
                    >
                      {badge.text}
                    </span>
                  );
                })()}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#64748b", marginTop: "10px" }}>
                <Layers size={14} /> Mã lô: <code>{b.id}</code> | Vùng: {b.plotId}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                <Calendar size={13} /> Thời gian: {new Date(b.createdAt).toLocaleString("vi-VN")}
              </div>

              <div
                style={{
                  marginTop: "12px",
                  paddingTop: "12px",
                  borderTop: "1px dashed #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}
              >
                <div style={{ width: "92px", height: "92px", borderRadius: "14px", border: "1px solid #dfe3da", backgroundColor: "#ffffff", padding: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <img
                    src={createQrImageUrl(createDigitalLink(b.id))}
                    alt={`QR GS1 ${b.id}`}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </div>
                {(() => {
                  const digitalLink = createDigitalLink(b.id);
                  return (
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", fontWeight: 800, color: "#0068FF", marginBottom: "4px" }}>
                        <QrCode size={16} /> QR GS1 Digital Link
                      </div>
                      <div style={{ fontSize: "11.5px", color: "#64748b", lineHeight: 1.35, wordBreak: "break-word", marginBottom: "8px" }}>
                        {digitalLink}
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setPortalPreview({ batch: b, digitalLink });
                            setPortalActionStatus(null);
                          }}
                          style={{
                            border: "none",
                            borderRadius: "10px",
                            backgroundColor: "#eef4ff",
                            color: "#0f4fbf",
                            padding: "7px 9px",
                            fontSize: "11.5px",
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            cursor: "pointer"
                          }}
                        >
                          <ExternalLink size={13} />
                          <span>Mở cổng</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const copied = await copyTextToClipboard(digitalLink);
                            setCopyStatus({ batchId: b.id, text: copied ? "Đã copy link" : "Không copy được, vui lòng giữ và chọn link" });
                            window.setTimeout(() => {
                              setCopyStatus((current) => (current?.batchId === b.id ? null : current));
                            }, 1800);
                          }}
                          style={{
                            border: "1px solid #dfe3da",
                            borderRadius: "10px",
                            backgroundColor: "#ffffff",
                            color: "#155d3b",
                            padding: "7px 9px",
                            fontSize: "11.5px",
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            cursor: "pointer"
                          }}
                        >
                          <Copy size={13} />
                          <span>{copyStatus?.batchId === b.id ? copyStatus.text : "Copy"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
