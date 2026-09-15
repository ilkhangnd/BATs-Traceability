import React, { useState, useEffect } from "react";
import { FarmPlot, PRESET_PLOTS } from "../types.js";
import { captureHarvestLocation, chooseHarvestEvidence, BatsZaloSession } from "../zalo-session.js";
import { enqueueHarvest } from "../offline-queue.js";
import { saveHarvestHistory } from "../harvest-history.js";
import { API_BASE_URL, fetchWithTimeout } from "../config.js";
import { MapPin, Camera, CheckCircle, AlertTriangle, Send, RefreshCw, Sprout } from "lucide-react";

interface HarvestPageProps {
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

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createManualPlotId(plotName: string, actorId: string) {
  const slug = normalizeText(plotName).slice(0, 28) || "vuon-tu-nhap";
  return `manual-${actorId.toLowerCase()}-${slug}`;
}

function cropPrefix(cropType: string) {
  const crop = normalizeText(cropType);
  if (/(ca-phe|coffee|robusta)/.test(crop)) return "CP";
  if (/(thanh-long|dragon)/.test(crop)) return "TL";
  if (/(xoai|mango)/.test(crop)) return "XC";
  if (/(buoi|pomelo)/.test(crop)) return "BD";
  if (/(nhan|longan)/.test(crop)) return "HY";
  if (/(bo|avocado)/.test(crop)) return "LD";
  if (/(mang-cut|mangosteen)/.test(crop)) return "MC";
  return "SR";
}

export const HarvestPage: React.FC<HarvestPageProps> = ({ session, isOnline, onSubmitted, onViewHistory }) => {
  const [plotsList, setPlotsList] = useState<FarmPlot[]>(PRESET_PLOTS);
  const [selectedPlot, setSelectedPlot] = useState<FarmPlot>(PRESET_PLOTS[0]!);
  const [harvestPlotName, setHarvestPlotName] = useState<string>(PRESET_PLOTS[0]?.name ?? "");
  const [cropType, setCropType] = useState<string>("Sầu riêng Ri6");
  const [quantityKg, setQuantityKg] = useState<number>(1250);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>({
    latitude: 12.6789,
    longitude: 108.1234
  });
  const [isLocating, setIsLocating] = useState(false);
  const [evidences, setEvidences] = useState<string[]>([]);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "warning" | "error"; text: string } | null>(null);
  const [submittedReceipt, setSubmittedReceipt] = useState<SubmissionReceipt | null>(null);
  const justifiedText = { textAlign: "justify" as const, textJustify: "inter-word" as const };
  const normalizedHarvestPlotName = harvestPlotName.trim();
  const matchedPlot = plotsList.find((plot) => normalizeText(plot.name) === normalizeText(normalizedHarvestPlotName));
  const activePlot = matchedPlot ?? selectedPlot;
  const hasMatchedPlot = Boolean(matchedPlot);
  const plotLocationIsValid = (() => {
    if (!location) return false;
    if (!hasMatchedPlot) return true;
    const distLat = Math.abs(location.latitude - activePlot.centerLat);
    const distLng = Math.abs(location.longitude - activePlot.centerLng);
    return distLat < 0.05 && distLng < 0.05;
  })();

  useEffect(() => {
    if (!session?.actor.organization) return;
    setHarvestPlotName(`${session.actor.organization} - Vườn thu hoạch`);
  }, [session?.actor.organization]);

  useEffect(() => {
    if (isOnline) {
      fetchWithTimeout(`${API_BASE_URL}/plots?status=active`, {}, 2500)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.plots && Array.isArray(data.plots) && data.plots.length > 0) {
            const mapped: FarmPlot[] = data.plots.map((p: any) => ({
              id: p.id,
              name: `${p.commune || p.district || p.province || "Đắk Lắk"} - ${p.crop || "Sầu riêng"} (${p.variety || "Ri6"})`,
              cropType: p.variety || p.crop || "Sầu riêng Ri6",
              areaHa: Number(p.areaHa || 2.0),
              centerLat: p.polygon?.[0]?.latitude ?? 12.6789,
              centerLng: p.polygon?.[0]?.longitude ?? 108.1234,
              expectedYieldKg: Number(p.areaHa || 2.0) * 20000
            }));
            setPlotsList(mapped);
          }
        })
        .catch(() => {
          // Fallback to PRESET_PLOTS
        });
    }
  }, [isOnline]);

  const handleGetGPS = async () => {
    setIsLocating(true);
    setMessage(null);
    try {
      const loc = await captureHarvestLocation(API_BASE_URL, session?.accessToken);
      setLocation(loc);
    } catch {
      setMessage({ type: "error", text: "⚠️ Không thể định vị tự động. Bác hãy bật quyền định vị GPS trên điện thoại." });
    } finally {
      setIsLocating(false);
    }
  };

  const handleCapturePhoto = async () => {
    try {
      const paths = await chooseHarvestEvidence();
      setEvidences((prev) => [...prev, ...paths]);
    } catch {
      setMessage({ type: "error", text: "⚠️ Không thể chụp ảnh lúc này." });
    }
  };

  const isWithinPlot = () => {
    return plotLocationIsValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalizedHarvestPlotName) {
      setMessage({ type: "error", text: "Vui lòng nhập tên vườn hoặc khu vực thu hoạch thực tế." });
      return;
    }
    setLoadingSubmit(true);
    setMessage(null);

    const idempotencyKey = createClientId();
    const eventTime = new Date().toISOString();
    const selectedCrop = cropType || activePlot.cropType || "Sầu riêng Ri6";
    const localBatchId = `${cropPrefix(selectedCrop)}-${eventTime.slice(0, 10).replace(/-/g, "")}-${idempotencyKey.slice(0, 6).toUpperCase()}`;
    const actorId = session?.actor.id ?? "FARMER-0001";
    const plotId = matchedPlot?.id ?? session?.actor.plot?.id ?? createManualPlotId(normalizedHarvestPlotName, actorId);
    const historyBase = {
      id: localBatchId,
      cropType: selectedCrop,
      quantityKg: Number(quantityKg),
      createdAt: eventTime,
      actorId,
      plotId
    };
    const payload = {
      id: localBatchId,
      batchId: localBatchId,
      farmPlotId: plotId,
      farmPlotName: normalizedHarvestPlotName,
      actorId,
      variety: selectedCrop,
      quantityKg: Number(quantityKg),
      eventTime,
      location: location
        ? { latitude: location.latitude, longitude: location.longitude }
        : { latitude: activePlot.centerLat ?? 12.6789, longitude: activePlot.centerLng ?? 108.1234 },
      evidenceHashes: evidences.length > 0 ? evidences : ["sha256:4a222e784d38eayongdev01"],
      device: {
        deviceId: session?.actor.id ? `ZMP-${session.actor.id}` : "ZMP-DEVICE",
        integrity: "trusted" as const,
        capturedAt: new Date().toISOString(),
        appVersion: "v2.44.3"
      }
    };
    const savePendingHistory = () => saveHarvestHistory({ ...historyBase, status: "PENDING_SYNC" });
    const enqueueForSync = async () => {
      try {
        await enqueueHarvest(payload, evidences, session?.accessToken, localBatchId);
        return true;
      } catch {
        return false;
      }
    };

    try {
      savePendingHistory();

      if (!isOnline) {
        const queued = await enqueueForSync();
        setMessage({
          type: "warning",
          text: queued
            ? `📴 Điện thoại đang ngoài rẫy mất mạng! Lô quả ${quantityKg} kg đã tự động lưu an toàn vào bộ nhớ máy. Khi về nhà có mạng Wifi/4G, bác chỉ cần bấm gửi là xong!`
            : `📴 Đã ghi lô quả ${quantityKg} kg vào lịch sử trên máy. Nếu Zalo chưa cho lưu hàng chờ, bác chỉ cần mở lại app khi có mạng để kiểm tra và gửi lại.`
        });
        setSubmittedReceipt({
          title: "Đã ghi nhận thu hoạch",
          description: queued
            ? "Lô thu hoạch đã được lưu vào sổ tay và đưa vào hàng chờ đồng bộ."
            : "Lô thu hoạch đã được lưu vào lịch sử trên máy.",
          code: localBatchId,
          statusText: queued ? "Chờ đồng bộ" : "Đã lưu trên máy"
        });
        onSubmitted();
        return;
      }

      const response = await fetchWithTimeout(`${API_BASE_URL}/batches/harvest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": idempotencyKey,
          ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        const batchId = data.id ?? data.batch?.id ?? localBatchId;
        saveHarvestHistory({
          ...historyBase,
          id: batchId,
          status: data.status === "ANCHORED" || data.batch?.status === "ANCHORED" ? "ANCHORED" : "HARVESTED"
        }, localBatchId);
        setMessage({
          type: "success",
          text: `Đã gửi sự kiện thu hoạch #${batchId} lên BATS-AgriGuard. PCIE sẽ kiểm tra mã vùng, vị trí, thời gian, sản lượng và bằng chứng trước khi cập nhật trạng thái.`
        });
        setSubmittedReceipt({
          title: "Đã ghi nhận thu hoạch",
          description: "Sự kiện thu hoạch đã được lưu. Trạng thái kiểm tra PCIE sẽ được cập nhật sau.",
          code: batchId,
          statusText: "Đã gửi kiểm tra"
        });
        onSubmitted();
      } else {
        const queued = await enqueueForSync();
        setMessage({
          type: "warning",
          text: queued
            ? "📴 Mạng chập chờn! Lô thu hoạch đã được lưu tạm an toàn vào máy của bác để gửi lại sau."
            : "📴 Lô thu hoạch đã được ghi vào lịch sử trên máy. Hàng chờ đồng bộ chưa sẵn sàng nên bác thử gửi lại khi mạng ổn hơn nha."
        });
        setSubmittedReceipt({
          title: "Đã ghi nhận thu hoạch",
          description: queued
            ? "Máy chủ chưa nhận được dữ liệu, nhưng lô đã được lưu vào sổ tay và hàng chờ."
            : "Lô thu hoạch đã được lưu vào lịch sử trên máy.",
          code: localBatchId,
          statusText: queued ? "Chờ đồng bộ" : "Đã lưu trên máy"
        });
        onSubmitted();
      }
    } catch {
      savePendingHistory();
      const queued = await enqueueForSync();
      setMessage({
        type: "warning",
        text: queued
          ? "📴 Mất sóng 4G! Lô thu hoạch đã được tự động lưu vào bộ nhớ điện thoại."
          : "📴 Đã ghi lô thu hoạch vào lịch sử trên máy. Zalo chưa lưu được hàng chờ đồng bộ, bác thử gửi lại khi mạng ổn hơn nha."
      });
      setSubmittedReceipt({
        title: "Đã ghi nhận thu hoạch",
        description: queued
          ? "Lô thu hoạch đã được lưu vào sổ tay và hàng chờ đồng bộ."
          : "Lô thu hoạch đã được lưu vào lịch sử trên máy.",
        code: localBatchId,
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
            <div style={{ fontSize: "11.5px", color: "#667069", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.3px" }}>Mã lô</div>
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

      {/* Harvest Form Card */}
      <form onSubmit={handleSubmit} style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "20px", boxShadow: "0 10px 28px rgba(12, 62, 41, 0.08)", border: "1px solid #dfe3da", textAlign: "left" }}>
        <h3 style={{ fontSize: "21px", fontWeight: 800, color: "#0c3e29", marginBottom: "18px", display: "flex", alignItems: "center", gap: "9px", lineHeight: 1.2 }}>
          <Sprout size={24} color="#63b51f" strokeWidth={2.4} />
          Ghi nhận sự kiện thu hoạch
        </h3>

        {/* Plot Name */}
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="harvest-plot-name" style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#172019", marginBottom: "7px", lineHeight: 1.35 }}>
            Vườn thu hoạch thực tế (*)
          </label>
          <div>
            <input
              id="harvest-plot-name"
              type="text"
              required
              list="harvest-plot-suggestions"
              value={harvestPlotName}
              onChange={(e) => {
                const nextName = e.target.value;
                setHarvestPlotName(nextName);
                const plot = plotsList.find((p) => normalizeText(p.name) === normalizeText(nextName));
                if (plot) {
                  setSelectedPlot(plot);
                  if (plot.cropType) setCropType(plot.cropType);
                }
              }}
              style={{
                width: "100%",
                height: "54px",
                padding: "0 16px",
                borderRadius: "14px",
                border: "1px solid #dfe3da",
                fontSize: "14px",
                fontWeight: 800,
                lineHeight: 1.2,
                backgroundColor: "#fbfcf9",
                color: "#172019",
                outline: "none"
              }}
              placeholder="Nhập tên vườn, HTX hoặc khu vực thu hoạch"
              onFocus={(e) => (e.target.style.borderColor = "#155d3b")}
              onBlur={(e) => (e.target.style.borderColor = "#dfe3da")}
            />
            <datalist id="harvest-plot-suggestions">
              {plotsList.map((p) => (
                <option key={p.id} value={p.name} />
              ))}
            </datalist>
          </div>
          <div style={{ marginTop: "6px", fontSize: "12px", fontWeight: 600, color: "#667069", lineHeight: 1.35 }}>
            {matchedPlot ? `Diện tích vườn: ${matchedPlot.areaHa} ha` : "Vườn tự nhập, hệ thống sẽ dùng tọa độ GPS hiện tại."}
          </div>
        </div>

        {/* Crop Variety */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#172019", marginBottom: "7px", lineHeight: 1.35 }}>
            Loại nông sản / giống cây (*)
          </label>
          <input
            type="text"
            value={cropType}
            onChange={(e) => setCropType(e.target.value)}
            style={{
              width: "100%",
              padding: "13px 14px",
              borderRadius: "12px",
              border: "1px solid #dfe3da",
              fontSize: "15px",
              lineHeight: 1.35,
              backgroundColor: "#fbfcf9",
              color: "#172019"
            }}
          />
        </div>

        {/* Quantity */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#172019", marginBottom: "7px", lineHeight: 1.35 }}>
            Sản lượng vừa hái (Kilôgam) (*)
          </label>
          <div style={{ position: "relative" }}>
            <input
              type="number"
              min="1"
              max="100000"
              value={quantityKg}
              onChange={(e) => setQuantityKg(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "14px 52px 14px 16px",
                borderRadius: "12px",
                border: "1px solid #dfe3da",
                fontSize: "18px",
                fontWeight: 800,
                lineHeight: 1.25,
                color: "#155d3b",
                backgroundColor: "#fbfcf9"
              }}
            />
            <span style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", fontWeight: 800, color: "#667069" }}>
              Kg
            </span>
          </div>
        </div>

        {/* GPS Location Check */}
        <div
          style={{
            backgroundColor: isWithinPlot() ? "#e8f0eb" : "#fff9e6",
            border: `1px solid ${isWithinPlot() ? "#cbe0d3" : "#fce39e"}`,
            borderRadius: "12px",
            padding: "10px 12px",
            marginBottom: "16px",
            textAlign: "left"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "9px", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 1px 3px rgba(21, 93, 59, 0.08)" }}>
                <MapPin size={16} color={isWithinPlot() ? "#155d3b" : "#e4a734"} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "3px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "999px", backgroundColor: isWithinPlot() ? "#20b22d" : "#e4a734", boxShadow: `0 0 0 3px ${isWithinPlot() ? "rgba(32, 178, 45, 0.14)" : "rgba(228, 167, 52, 0.18)"}`, flexShrink: 0 }} />
                  <span style={{ fontSize: "13px", fontWeight: 800, lineHeight: 1.2, color: isWithinPlot() ? "#0c3e29" : "#8c6500" }}>
                    {isWithinPlot() ? (hasMatchedPlot ? "GPS phù hợp sơ bộ với vùng đã chọn" : "Đã ghi nhận GPS hiện trường") : "Cần kiểm tra lại vị trí"}
                  </span>
                </div>
                <div style={{ fontSize: "11.5px", lineHeight: 1.35, color: isWithinPlot() ? "#4f6358" : "#8c6500" }}>
                  {isWithinPlot() ? (hasMatchedPlot ? "Kết quả cuối cùng do PCIE đánh giá cùng các dữ liệu liên quan." : "Dùng GPS hiện tại cho vườn tự nhập.") : "Nên đo lại trước khi gửi sự kiện."}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGetGPS}
              disabled={isLocating}
              aria-label="Đo lại GPS"
              title="Đo lại GPS"
              style={{
                background: "transparent",
                border: "none",
                borderRadius: "999px",
                width: "30px",
                height: "30px",
                padding: 0,
                fontWeight: 800,
                color: "#155d3b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              <RefreshCw size={18} strokeWidth={2.4} className={isLocating ? "animate-spin" : ""} />
            </button>
          </div>
          {location && (
            <div style={{ fontSize: "11px", color: "#667069", marginTop: "8px", lineHeight: 1.3, paddingLeft: "39px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Tọa độ ghi nhận: <code>{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</code>
            </div>
          )}
        </div>

        {/* Photo Evidence */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#172019", marginBottom: "8px", lineHeight: 1.35 }}>
            Hình ảnh thực tế tại vườn (ảnh giỏ quả, phiếu cân)
          </label>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              onClick={handleCapturePhoto}
              style={{
                border: "2px dashed #155d3b",
                backgroundColor: "#e8f0eb",
                borderRadius: "14px",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "14px",
                fontWeight: 800,
                color: "#0c3e29",
                cursor: "pointer",
                width: "100%"
              }}
            >
              <Camera size={18} color="#155d3b" /> Chụp ảnh / chọn từ máy
            </button>
            {evidences.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt="Minh chứng"
                style={{ width: "54px", height: "54px", borderRadius: "10px", objectFit: "cover", border: "1px solid #dfe3da" }}
              />
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loadingSubmit}
          style={{
            width: "100%",
            padding: "15px 16px",
            minHeight: "54px",
            borderRadius: "14px",
            background: isOnline ? "linear-gradient(135deg, #155d3b, #0c3e29)" : "linear-gradient(135deg, #e4a734, #b8831f)",
            color: "#fff",
            border: "none",
            fontSize: "15px",
            fontWeight: 800,
            lineHeight: 1.35,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: "0 6px 16px rgba(21, 93, 59, 0.22)"
          }}
        >
          <Send size={18} />
          {loadingSubmit
            ? "Đang ghi nhận vào sổ tay nông nghiệp..."
            : isOnline
            ? "Gửi sự kiện thu hoạch để kiểm tra"
            : "📴 Lưu tạm vào máy (chờ có mạng gửi sau)"}
        </button>
      </form>
    </div>
  );
};
