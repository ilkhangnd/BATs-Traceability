import React, { useState } from "react";
import { AlertTriangle, Camera, CheckCircle, Keyboard, MapPin, PackageCheck, RefreshCw, ScanLine, Send } from "lucide-react";
import { BatsZaloSession, captureHarvestLocation, chooseHarvestEvidence, scanGs1QrCode } from "../zalo-session.js";
import { enqueueHarvest } from "../offline-queue.js";
import { saveHarvestHistory } from "../harvest-history.js";
import { API_BASE_URL, fetchWithTimeout } from "../config.js";

interface CollectorPageProps {
  session: BatsZaloSession | null;
  isOnline: boolean;
  onSubmitted: () => void;
  onViewHistory: () => void;
}

interface SubmissionReceipt {
  title: string;
  description: string;
  code: string;
  statusText: string;
}

function createClientId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 10)}`;
}

function labelCropFromBatch(batch: any) {
  const cropLabel: Record<string, string> = {
    durian: "Sầu riêng",
    mango: "Xoài",
    coffee: "Cà phê",
    dragon_fruit: "Thanh long",
    pomelo: "Bưởi",
    longan: "Nhãn",
    avocado: "Bơ",
    mangosteen: "Măng cụt"
  };
  const crop = cropLabel[String(batch?.crop ?? "")] ?? String(batch?.cropType ?? batch?.variety ?? "Sầu riêng");
  const variety = String(batch?.variety ?? "").trim();
  if (variety && !crop.toLowerCase().includes(variety.toLowerCase())) return `${crop} ${variety}`;
  return crop;
}

function normalizeBatchId(value: string) {
  const raw = value.trim();
  try {
    const url = new URL(raw);
    const parts = url.pathname.split("/").filter(Boolean);
    const verifyIndex = parts.findIndex((part) => part === "verify");
    if (verifyIndex >= 0 && parts[verifyIndex + 2]) return decodeURIComponent(parts[verifyIndex + 2]!);
    const lotIndex = parts.findIndex((part) => part === "10");
    if (lotIndex >= 0 && parts[lotIndex + 1]) return decodeURIComponent(parts[lotIndex + 1]!);
  } catch {
    // Manual entry is already the batch ID.
  }
  return raw;
}

export const CollectorPage: React.FC<CollectorPageProps> = ({ session, isOnline, onSubmitted, onViewHistory }) => {
  const [sourceBatchId, setSourceBatchId] = useState("");
  const [entryMode, setEntryMode] = useState<"scan" | "manual">("scan");
  const [farmerPhone, setFarmerPhone] = useState("");
  const [cropType, setCropType] = useState("Sầu riêng Ri6");
  const [quantityKg, setQuantityKg] = useState<number>(1250);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>({
    latitude: session?.actor.collectorProfile?.baseLatitude ?? 12.6789,
    longitude: session?.actor.collectorProfile?.baseLongitude ?? 108.1234
  });
  const [evidences, setEvidences] = useState<string[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "warning" | "error"; text: string } | null>(null);
  const [submittedReceipt, setSubmittedReceipt] = useState<SubmissionReceipt | null>(null);
  const justifiedText = { textAlign: "justify" as const, textJustify: "inter-word" as const };

  const handleGetGPS = async () => {
    setIsLocating(true);
    setMessage(null);
    try {
      const loc = await captureHarvestLocation(API_BASE_URL, session?.accessToken);
      setLocation(loc);
    } catch {
      setMessage({ type: "error", text: "Không thể đo GPS điểm nhận hàng. Vui lòng bật quyền định vị rồi thử lại." });
    } finally {
      setIsLocating(false);
    }
  };

  const handleCapturePhoto = async () => {
    try {
      const paths = await chooseHarvestEvidence();
      setEvidences((prev) => [...prev, ...paths]);
    } catch {
      setMessage({ type: "error", text: "Không thể chọn ảnh minh chứng lúc này." });
    }
  };

  const handleScanQr = async () => {
    setIsScanning(true);
    setMessage(null);
    try {
      const parsed = await scanGs1QrCode();
      const lot = parsed.lot?.trim() || parsed.raw;
      setSourceBatchId(lot);
      setEntryMode("scan");

      if (parsed.gtin && parsed.serial && lot) {
        try {
          const res = await fetchWithTimeout(`${API_BASE_URL}/verify/${encodeURIComponent(parsed.gtin)}/${encodeURIComponent(lot)}/${encodeURIComponent(parsed.serial)}`, {}, 2500);
          if (res.ok) {
            const data = await res.json();
            if (data?.batch) {
              setCropType(labelCropFromBatch(data.batch));
              if (typeof data.batch.quantityKg === "number") {
                setQuantityKg(data.batch.quantityKg);
              }
            }
          }
        } catch {
          // QR still filled the lot code; manual details remain editable.
        }
      }

      setMessage({ type: "success", text: "Đã quét QR và tự điền mã lô. Hãy đối chiếu thông tin, khối lượng cân và bằng chứng trước khi gửi sự kiện bàn giao." });
    } catch {
      setMessage({ type: "warning", text: "Chưa quét được QR. Có thể chuyển sang nhập tay mã lô/GS1." });
      setEntryMode("manual");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedBatchId = normalizeBatchId(sourceBatchId);
    if (!normalizedBatchId || !farmerPhone.trim() || Number(quantityKg) <= 0) {
      setMessage({ type: "error", text: "Vui lòng nhập mã lô/QR, số điện thoại nông dân và khối lượng cân nhận." });
      return;
    }

    setLoadingSubmit(true);
    setMessage(null);

    const idempotencyKey = createClientId();
    const eventTime = new Date().toISOString();
    const transferId = `TR-${eventTime.slice(0, 10).replace(/-/g, "")}-${idempotencyKey.slice(0, 6).toUpperCase()}`;
    const actorId = session?.actor.id ?? "COLLECTOR-LOCAL";
    const payload = {
      id: transferId,
      transferId,
      batchId: normalizedBatchId,
      actorId,
      actorRole: "COLLECTOR",
      farmerPhone: farmerPhone.trim(),
      organization: session?.actor.organization ?? "Điểm thu mua BATS",
      cropType,
      quantityKg: Number(quantityKg),
      eventTime,
      location: location ?? { latitude: 12.6789, longitude: 108.1234 },
      evidenceHashes: evidences.length > 0 ? evidences : ["sha256:collector-scale-slip-local"],
      eventType: "ObjectEvent",
      bizStep: "receiving",
      disposition: "in_transit",
      device: {
        deviceId: `ZMP-${actorId}`,
        integrity: "trusted" as const,
        capturedAt: eventTime,
        appVersion: "v2.44.3"
      }
    };

    const historyBase = {
      id: transferId,
      cropType,
      quantityKg: Number(quantityKg),
      createdAt: eventTime,
      actorId,
      plotId: normalizedBatchId
    };

    const enqueueTransfer = async () => {
      try {
        await enqueueHarvest(payload, evidences, session?.accessToken, transferId, "/batches/transfer");
        return true;
      } catch {
        return false;
      }
    };

    try {
      saveHarvestHistory({ ...historyBase, status: "PENDING_SYNC" });

      if (!isOnline) {
        const queued = await enqueueTransfer();
        setMessage({
          type: "warning",
          text: queued
            ? "Đã lưu phiếu nhận lô vào hàng chờ. Khi có mạng, thương lái có thể đồng bộ lại."
            : "Đã lưu phiếu nhận lô vào lịch sử trên máy. Hãy thử đồng bộ lại khi mạng ổn hơn."
        });
        setSubmittedReceipt({
          title: "Đã ghi nhận nhận lô",
          description: queued
            ? "Phiếu thu mua đã được lưu vào sổ tay và đưa vào hàng chờ đồng bộ."
            : "Phiếu thu mua đã được lưu vào lịch sử trên máy.",
          code: transferId,
          statusText: queued ? "Chờ đồng bộ" : "Đã lưu trên máy"
        });
        onSubmitted();
        return;
      }

      const response = await fetchWithTimeout(`${API_BASE_URL}/batches/${encodeURIComponent(normalizedBatchId)}/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": idempotencyKey,
          ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {})
        },
        body: JSON.stringify({
          status: "collected",
          eventTime,
          actualWeightKg: Number(quantityKg),
          location: payload.location,
          evidenceHashes: payload.evidenceHashes,
          device: payload.device
        })
      });

      if (response.ok) {
        saveHarvestHistory({ ...historyBase, status: "COLLECTED" }, transferId);
        setMessage({ type: "success", text: "Đã gửi sự kiện bàn giao. Hệ thống sẽ kiểm tra chuỗi custody và cân bằng khối lượng trước khi cập nhật trạng thái." });
        setSubmittedReceipt({
          title: "Đã ghi nhận nhận lô",
          description: "Phiếu bàn giao đã được lưu. Trạng thái kiểm tra custody và cân bằng khối lượng sẽ được cập nhật sau.",
          code: transferId,
          statusText: "Đã gửi kiểm tra"
        });
        onSubmitted();
      } else {
        const queued = await enqueueTransfer();
        setMessage({
          type: "warning",
          text: queued
            ? "Máy chủ chưa nhận được phiếu thu mua. Dữ liệu đã được giữ trong hàng chờ để gửi lại."
            : "Phiếu thu mua đã được ghi vào lịch sử trên máy. Hãy thử gửi lại khi mạng ổn hơn."
        });
        setSubmittedReceipt({
          title: "Đã ghi nhận nhận lô",
          description: queued
            ? "Máy chủ chưa nhận được dữ liệu, nhưng phiếu thu mua đã được lưu vào sổ tay và hàng chờ."
            : "Phiếu thu mua đã được lưu vào lịch sử trên máy.",
          code: transferId,
          statusText: queued ? "Chờ đồng bộ" : "Đã lưu trên máy"
        });
        onSubmitted();
      }
    } catch {
      saveHarvestHistory({ ...historyBase, status: "PENDING_SYNC" });
      const queued = await enqueueTransfer();
      setMessage({
        type: "warning",
        text: queued
          ? "Kết nối chưa ổn định. Phiếu nhận lô đã được lưu vào hàng chờ."
          : "Đã ghi phiếu nhận lô vào lịch sử trên máy. Vui lòng thử lại khi có mạng."
      });
      setSubmittedReceipt({
        title: "Đã ghi nhận nhận lô",
        description: queued
          ? "Phiếu thu mua đã được lưu vào sổ tay và hàng chờ đồng bộ."
          : "Phiếu thu mua đã được lưu vào lịch sử trên máy.",
        code: transferId,
        statusText: queued ? "Chờ đồng bộ" : "Đã lưu trên máy"
      });
      onSubmitted();
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (submittedReceipt) {
    return (
      <div style={{ minHeight: "100%", padding: "var(--sp-lg)", backgroundColor: "var(--farm-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", backgroundColor: "#ffffff", borderRadius: "20px", padding: "28px 18px", border: "1px solid #dfe3da", boxShadow: "0 10px 28px rgba(12, 62, 41, 0.08)", textAlign: "center" }}>
          <div style={{ width: "78px", height: "78px", borderRadius: "50%", backgroundColor: "#16a34a", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", boxShadow: "0 8px 18px rgba(22, 163, 74, 0.22)" }}>
            <CheckCircle size={48} color="#ffffff" strokeWidth={2.8} />
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", marginBottom: "10px", lineHeight: 1.3 }}>
            {submittedReceipt.title}
          </h2>
          <p style={{ fontSize: "13.5px", color: "#667069", lineHeight: 1.55, margin: "0 auto 18px", maxWidth: "280px" }}>
            {submittedReceipt.description}
          </p>
          <div style={{ backgroundColor: "#f5f5ef", borderRadius: "14px", padding: "12px", marginBottom: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "11.5px", color: "#667069", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.3px" }}>Mã phiếu</div>
            <div style={{ fontSize: "14px", color: "#172019", fontWeight: 800, marginTop: "4px", wordBreak: "break-word" }}>{submittedReceipt.code}</div>
            <div style={{ display: "inline-flex", marginTop: "8px", padding: "4px 10px", borderRadius: "999px", backgroundColor: "#e8f0eb", color: "#155d3b", fontSize: "12px", fontWeight: 800 }}>
              {submittedReceipt.statusText}
            </div>
          </div>
          <button
            type="button"
            onClick={onViewHistory}
            style={{ width: "100%", minHeight: "52px", borderRadius: "14px", border: "1px solid #155d3b", backgroundColor: "#ffffff", color: "#155d3b", fontSize: "14px", fontWeight: 800, cursor: "pointer" }}
          >
            Xem lịch sử
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "var(--sp-lg)", paddingBottom: "var(--sp-lg)", flex: 1, backgroundColor: "var(--farm-bg)", textAlign: "left" }}>
      {message && (
        <div
          style={{
            padding: "13px 14px",
            borderRadius: "14px",
            marginBottom: "16px",
            fontSize: "13px",
            lineHeight: "1.5",
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            backgroundColor: message.type === "success" ? "#e8f0eb" : message.type === "warning" ? "#fff9e6" : "#ffebe8",
            color: message.type === "success" ? "#0c3e29" : message.type === "warning" ? "#8c6500" : "#8b312c",
            border: `1px solid ${message.type === "success" ? "#cbe0d3" : message.type === "warning" ? "#fce39e" : "#f1c1bc"}`,
            ...justifiedText
          }}
        >
          {message.type === "success" ? (
            <CheckCircle size={18} style={{ flexShrink: 0, marginTop: 2, color: "#155d3b" }} />
          ) : (
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2, color: message.type === "warning" ? "#e4a734" : "#8b312c" }} />
          )}
          <div>{message.text}</div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "18px",
          padding: "20px",
          boxShadow: "0 4px 16px rgba(21, 93, 59, 0.08)",
          border: "1px solid #dfe3da"
        }}
      >
        <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0c3e29", marginBottom: "18px", display: "flex", alignItems: "center", gap: "10px", lineHeight: 1.2 }}>
          <PackageCheck size={26} color="#59b22c" />
          <span>Ghi nhận sự kiện bàn giao</span>
        </h2>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: 800, color: "#172019", marginBottom: "8px" }}>
            Mã lô / QR GS1 từ nông dân (*)
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", backgroundColor: "#e8f0eb", borderRadius: "14px", padding: "4px", marginBottom: "10px" }}>
            {([
              { id: "scan" as const, label: "Quét QR", icon: <ScanLine size={16} /> },
              { id: "manual" as const, label: "Nhập tay", icon: <Keyboard size={16} /> }
            ]).map((mode) => {
              const active = entryMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setEntryMode(mode.id)}
                  style={{
                    border: "none",
                    borderRadius: "10px",
                    padding: "9px 8px",
                    backgroundColor: active ? "#155d3b" : "transparent",
                    color: active ? "#ffffff" : "#667069",
                    fontSize: "13px",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    cursor: "pointer"
                  }}
                >
                  {mode.icon}
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>
          {entryMode === "scan" && (
            <button
              type="button"
              onClick={handleScanQr}
              disabled={isScanning}
              style={{ width: "100%", minHeight: "48px", borderRadius: "12px", border: "1px dashed #155d3b", backgroundColor: "#f0faf3", color: "#0c3e29", fontSize: "14px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "10px", cursor: isScanning ? "not-allowed" : "pointer" }}
            >
              <ScanLine size={18} />
              <span>{isScanning ? "Đang mở camera quét..." : "Quét QR từ nông dân"}</span>
            </button>
          )}
          <input
            type="text"
            value={sourceBatchId}
            onChange={(e) => setSourceBatchId(e.target.value)}
            placeholder="SR-20260714-ABC123"
            style={{ width: "100%", height: "52px", padding: "0 14px", borderRadius: "12px", border: "1px solid #dfe3da", fontSize: "14px", fontWeight: 700, color: "#172019", outline: "none" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: 800, color: "#172019", marginBottom: "8px" }}>
            Số điện thoại nông dân (*)
          </label>
          <input
            type="tel"
            value={farmerPhone}
            onChange={(e) => setFarmerPhone(e.target.value)}
            placeholder="09xxxxxx10"
            style={{ width: "100%", height: "52px", padding: "0 14px", borderRadius: "12px", border: "1px solid #dfe3da", fontSize: "14px", fontWeight: 700, color: "#172019", outline: "none" }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 800, color: "#172019", marginBottom: "8px" }}>
              Loại hàng
            </label>
            <input
              type="text"
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              style={{ width: "100%", height: "52px", padding: "0 12px", borderRadius: "12px", border: "1px solid #dfe3da", fontSize: "14px", fontWeight: 700, color: "#172019", outline: "none" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 800, color: "#172019", marginBottom: "8px" }}>
              Cân nhận (Kg) (*)
            </label>
            <input
              type="number"
              min="1"
              value={quantityKg}
              onChange={(e) => setQuantityKg(Number(e.target.value))}
              style={{ width: "100%", height: "52px", padding: "0 12px", borderRadius: "12px", border: "1px solid #dfe3da", fontSize: "15px", fontWeight: 800, color: "#155d3b", outline: "none" }}
            />
          </div>
        </div>

        <div style={{ backgroundColor: "#e8f0eb", border: "1px solid #cbe0d3", borderRadius: "14px", padding: "14px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(21, 93, 59, 0.08)", flexShrink: 0 }}>
            <MapPin size={22} color="#155d3b" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#0c3e29" }}>Điểm nhận hàng</div>
            <div style={{ fontSize: "12.5px", color: "#667069", marginTop: "3px" }}>
              {location ? `Tọa độ: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : "Chưa có tọa độ"}
            </div>
          </div>
          <button
            type="button"
            onClick={handleGetGPS}
            disabled={isLocating}
            aria-label="Đo lại GPS"
            style={{ width: "44px", height: "44px", borderRadius: "12px", border: "none", backgroundColor: "#ffffff", color: "#155d3b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <RefreshCw size={22} className={isLocating ? "animate-spin" : ""} />
          </button>
        </div>

        <div style={{ marginBottom: "18px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: 800, color: "#172019", marginBottom: "8px" }}>
            Ảnh phiếu cân / xe hàng
          </label>
          <button
            type="button"
            onClick={handleCapturePhoto}
            style={{ width: "100%", minHeight: "54px", borderRadius: "14px", border: "2px dashed #155d3b", backgroundColor: "#f0faf3", color: "#0c3e29", fontSize: "14px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
          >
            <Camera size={20} />
            <span>{evidences.length > 0 ? `Đã chọn ${evidences.length} ảnh` : "Chụp ảnh / chọn từ máy"}</span>
          </button>
        </div>

        <button
          type="submit"
          disabled={loadingSubmit}
          style={{
            width: "100%",
            minHeight: "58px",
            borderRadius: "14px",
            border: "none",
            background: "linear-gradient(135deg, #155d3b, #0c3e29)",
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: 800,
            cursor: loadingSubmit ? "not-allowed" : "pointer",
            boxShadow: "0 5px 14px rgba(21, 93, 59, 0.22)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px"
          }}
        >
          <Send size={20} />
          <span>{loadingSubmit ? "Đang ghi nhận..." : "Xác nhận nhận lô"}</span>
        </button>
      </form>
    </div>
  );
};
