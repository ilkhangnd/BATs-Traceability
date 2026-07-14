import React, { useEffect, useState } from "react";
import { ensureQueueForPendingHistory, filterQueuedHarvestsByActor, QueuedHarvest, readQueuedHarvests, subscribeQueueChanges, syncHarvestQueue } from "../offline-queue.js";
import { API_BASE_URL, fetchWithTimeout } from "../config.js";
import { BatsZaloSession } from "../zalo-session.js";
import { Wifi, WifiOff, RefreshCw, Clock, Package, CheckCircle2 } from "lucide-react";

interface QueuePageProps {
  session: BatsZaloSession | null;
  isOnline: boolean;
  onSyncCompleted: () => void;
}

export const QueuePage: React.FC<QueuePageProps> = ({ session, isOnline, onSyncCompleted }) => {
  const [items, setItems] = useState<QueuedHarvest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const justifiedText = { textAlign: "justify" as const, textJustify: "inter-word" as const };
  const actorId = session?.actor.id;
  const isCollector = session?.actor.role === "COLLECTOR";

  const getActorQueue = async () => filterQueuedHarvestsByActor(await readQueuedHarvests(), actorId);

  const refreshActorToken = async () => {
    const phone = session?.actor.phone?.trim();
    if (!phone) return session?.accessToken;
    try {
      const endpoint = isCollector ? "/auth/collector/login" : "/auth/farmer/login";
      const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, role: session?.actor.role })
      }, 2500);
      if (!response.ok) return session?.accessToken;
      const data = await response.json();
      if (!data?.accessToken) return session?.accessToken;
      try {
        window.localStorage.setItem("bats_user_session", JSON.stringify({
          ...session,
          accessToken: data.accessToken,
          expiresIn: data.expiresIn ?? session?.expiresIn,
          actor: data.actor ?? session?.actor
        }));
      } catch {}
      return data.accessToken as string;
    } catch {
      return session?.accessToken;
    }
  };

  const loadQueue = async () => {
    setLoading(true);
    try {
      await ensureQueueForPendingHistory(actorId, session?.accessToken);
      setItems(await getActorQueue());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQueue();
    const unsubscribe = subscribeQueueChanges(() => {
      void getActorQueue().then(setItems);
    });
    return unsubscribe;
  }, [actorId]);

  const handleManualSync = async () => {
    if (!isOnline) {
      setSyncResult("❌ Mạng vẫn đang ngoại tuyến. Không thể đồng bộ!");
      return;
    }
    setSyncing(true);
    setSyncResult(null);
    try {
      const freshToken = await refreshActorToken();
      const count = await syncHarvestQueue(API_BASE_URL, actorId, freshToken);
      if (count > 0) {
        setSyncResult(`Đã đồng bộ thành công ${count} ${isCollector ? "phiếu thu mua" : "lô thu hoạch"} lên máy chủ BATS!`);
        onSyncCompleted();
        await loadQueue();
      } else {
        await loadQueue();
        const currentItems = await getActorQueue();
        const firstError = currentItems.find((item) => item.lastError)?.lastError;
        setSyncResult(
          currentItems.length > 0
            ? `Chưa đẩy được lô nào lên máy chủ. ${firstError ? `Lý do gần nhất: ${firstError}` : "Hàng chờ vẫn được giữ trên máy để thử lại."}`
            : "Không có lô nào cần đồng bộ."
        );
      }
    } catch {
      setSyncResult("❌ Lỗi khi đồng bộ với máy chủ Staging.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ padding: "16px", paddingBottom: "16px", flex: 1 }}>
      {/* Network Status Header Banner */}
      <div
        style={{
          backgroundColor: isOnline ? "#f0fdf4" : "#fffbeb",
          border: `1px solid ${isOnline ? "#86efac" : "#fde68a"}`,
          borderRadius: "14px",
          padding: "14px",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {isOnline ? <Wifi size={22} color="#16a34a" /> : <WifiOff size={22} color="#d97706" />}
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: isOnline ? "#15803d" : "#b45309" }}>
              {isOnline ? "Đang trực tuyến (Online)" : "Ngoại tuyến (Offline Mode)"}
            </div>
            <div style={{ fontSize: "12px", color: isOnline ? "#166534" : "#92400e", ...justifiedText }}>
              {isOnline
                ? "Dữ liệu được đẩy ngay lập tức lên CSDL PostgreSQL"
                : "Dữ liệu được lưu an toàn trong bộ nhớ máy và sẽ gửi lại khi có mạng"}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
          📦 Hàng chờ đồng bộ ({items.length})
        </h3>
        <button
          type="button"
          onClick={handleManualSync}
          disabled={syncing || items.length === 0}
          style={{
            backgroundColor: "#0068FF",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "8px 14px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: items.length === 0 ? "not-allowed" : "pointer",
            opacity: items.length === 0 ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Đang đẩy lên..." : "Đồng bộ ngay"}
        </button>
      </div>

      {syncResult && (
        <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: "#f1f5f9", fontSize: "13px", marginBottom: "14px", fontWeight: 500, ...justifiedText }}>
          {syncResult}
        </div>
      )}

      {loading ? (
        <div style={{ padding: "40px", color: "#64748b", ...justifiedText }}>Đang kiểm tra kho hàng chờ trên máy...</div>
      ) : items.length === 0 ? (
        <div style={{ padding: "48px 16px", backgroundColor: "#fff", borderRadius: "16px", border: "1px dashed #cbd5e1" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
            <CheckCircle2 size={40} color="#16a34a" />
          </div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", textAlign: "center" }}>{isCollector ? "Không còn phiếu thu mua tồn đọng" : "Không còn lô thu hoạch tồn đọng"}</div>
          <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px", textAlign: "center", lineHeight: 1.5 }}>
            Toàn bộ dữ liệu của tài khoản này đã được đẩy thành công lên hệ thống BATS.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {items.map((item) => {
            const p = item.payload as any;
            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "14px",
                  padding: "14px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Package size={18} color="#d97706" />
                    <span style={{ fontSize: "14.5px", fontWeight: 700, color: "#0f172a" }}>
                      {p.cropType ?? p.variety ?? "Sầu riêng Ri6"} - {p.quantityKg ?? 0} Kg
                    </span>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 600, backgroundColor: "#fef3c7", color: "#b45309", padding: "3px 8px", borderRadius: "6px" }}>
                    Đang chờ ({item.attempts} lần thử)
                  </span>
                </div>
                <div style={{ fontSize: "12.5px", color: "#64748b", marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Clock size={13} /> Tạo lúc: {new Date(item.createdAt).toLocaleString("vi-VN")}
                </div>
                <div style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "4px" }}>
                  Idempotency UUID: <code>{item.id.slice(0, 18)}...</code>
                </div>
                {item.lastError && (
                  <div style={{ fontSize: "12px", color: "#b45309", marginTop: "8px", lineHeight: 1.45, backgroundColor: "#fff7ed", borderRadius: "10px", padding: "8px" }}>
                    Lỗi gần nhất: {item.lastError}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
