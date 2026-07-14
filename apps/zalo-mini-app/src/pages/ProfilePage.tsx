import React, { useState } from "react";
import { BatsZaloSession } from "../zalo-session.js";
import { API_BASE_URL } from "../config.js";
import { clearHarvestHistory } from "../harvest-history.js";
import { clearQueuedHarvests } from "../offline-queue.js";
import { User, ShieldCheck, Award, MapPin, Phone, Edit3, Check, X, LogOut, Trash2, AlertTriangle } from "lucide-react";

interface ProfilePageProps {
  session: BatsZaloSession | null;
  onUpdateSession?: (updated: BatsZaloSession | null) => void;
}

function buildAccountKey(role: string | undefined, phone: string | undefined) {
  if (!role || !phone) return null;
  return `${role}:${phone.trim()}`;
}

function inferVietnamRegion(latitude?: number, longitude?: number) {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return "Chưa có dữ liệu GPS";
  }

  const candidates = [
    { name: "Đắk Lắk", lat: 12.67, lng: 108.05 },
    { name: "Tiền Giang", lat: 10.36, lng: 106.36 },
    { name: "Tây Ninh", lat: 11.31, lng: 106.10 },
    { name: "Bình Thuận", lat: 11.09, lng: 108.07 },
    { name: "Lâm Đồng", lat: 11.58, lng: 108.14 },
    { name: "Đồng Nai", lat: 11.02, lng: 107.18 }
  ];

  const nearest = candidates
    .map((candidate) => ({
      ...candidate,
      distance: Math.hypot(latitude - candidate.lat, longitude - candidate.lng)
    }))
    .sort((a, b) => a.distance - b.distance)[0];

  if (!nearest || nearest.distance > 1.2) {
    return `Khu vực theo GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
  }

  return `${nearest.name} - GPS ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ session, onUpdateSession }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(session?.actor.name ?? "Nguyễn Văn Hùng");
  const [phone, setPhone] = useState(session?.actor.phone ?? "0900000001");
  const [organization, setOrganization] = useState(session?.actor.organization ?? "HTX Nông Nghiệp Ea Yông");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const justifiedText = { textAlign: "justify" as const, textJustify: "inter-word" as const };
  const isCollector = session?.actor.role === "COLLECTOR";
  const primaryLatitude = isCollector ? session?.actor.collectorProfile?.baseLatitude : session?.actor.plot?.latitude;
  const primaryLongitude = isCollector ? session?.actor.collectorProfile?.baseLongitude : session?.actor.plot?.longitude;
  const primaryRegion = inferVietnamRegion(primaryLatitude, primaryLongitude);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/profile/me`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({ name, phone, organization })
      });
      let updatedActor = { ...session.actor, name, phone, organization };
      if (res.ok) {
        const data = await res.json();
        if (data.actor) updatedActor = data.actor;
      }
      const newSession = { ...session, actor: updatedActor };
      try {
        localStorage.setItem("bats_user_session", JSON.stringify(newSession));
        const savedMap = localStorage.getItem("bats_registered_accounts");
        if (savedMap) {
          const dict = JSON.parse(savedMap);
          const accountKey = buildAccountKey(updatedActor.role, updatedActor.phone);
          if (accountKey) dict[accountKey] = newSession;
          localStorage.setItem("bats_registered_accounts", JSON.stringify(dict));
        }
      } catch {}
      if (onUpdateSession) onUpdateSession(newSession);
      setMessage({ text: "✅ Đã cập nhật & đồng bộ thông tin Nông hộ thành công!", type: "success" });
      setIsEditing(false);
    } catch {
      const updatedActor = { ...session.actor, name, phone, organization };
      const newSession = { ...session, actor: updatedActor };
      try {
        localStorage.setItem("bats_user_session", JSON.stringify(newSession));
        const savedMap = localStorage.getItem("bats_registered_accounts");
        if (savedMap) {
          const dict = JSON.parse(savedMap);
          const accountKey = buildAccountKey(updatedActor.role, updatedActor.phone);
          if (accountKey) dict[accountKey] = newSession;
          localStorage.setItem("bats_registered_accounts", JSON.stringify(dict));
        }
      } catch {}
      if (onUpdateSession) onUpdateSession(newSession);
      setMessage({ text: "✅ Đã cập nhật & đồng bộ thông tin Nông hộ thành công!", type: "success" });
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const finishLogout = () => {
    try {
      localStorage.removeItem("bats_user_session");
    } catch {}
    if (onUpdateSession) {
      onUpdateSession(null);
    }
  };

  const handleLogout = () => {
    if (!confirm("Hộ nông dân có chắc chắn muốn đăng xuất khỏi thiết bị này không?")) return;
    finishLogout();
    alert("Đã đăng xuất khỏi thiết bị. Lịch sử và hàng chờ trên máy vẫn được giữ lại.");
  };

  const handleLogoutAndClearDevice = async () => {
    if (!confirm("Thao tác này sẽ đăng xuất và xoá lịch sử/hàng chờ đã lưu trên thiết bị này. Hộ nông dân có chắc chắn không?")) return;
    setLoading(true);
    try {
      clearHarvestHistory();
      await clearQueuedHarvests();
      finishLogout();
      alert("Đã đăng xuất và xoá lịch sử/hàng chờ trên thiết bị này.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "var(--sp-lg)", paddingBottom: "var(--sp-lg)", flex: 1, backgroundColor: "var(--farm-bg)", textAlign: "left" }}>
      {/* Top Banner Card */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "24px 16px", textAlign: "left", border: "1px solid #dfe3da", boxShadow: "0 4px 12px rgba(21,93,59,0.06)" }}>
        <div
          style={{
            width: "74px",
            height: "74px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #155d3b, #0c3e29)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            fontWeight: 800,
            margin: "0 auto 12px",
            boxShadow: "0 4px 12px rgba(21, 93, 59, 0.25)"
          }}
        >
          {session?.actor.name ? session.actor.name.charAt(0) : "N"}
        </div>
        <h3 style={{ fontSize: "19px", fontWeight: 800, color: "#172019", textAlign: "center" }}>
          {session?.actor.name ?? "Nguyễn Văn Hùng"}
        </h3>
        <div style={{ fontSize: "12px", color: "#667069", marginTop: "8px", textAlign: "center" }}>
          Mã định danh rẫy: <code>#{session?.actor.id?.slice(-6) ?? "0001"}</code>
        </div>

        {!isEditing && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              style={{
                marginTop: "16px",
                padding: "10px 18px",
                backgroundColor: "#155d3b",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                boxShadow: "0 3px 8px rgba(21,93,59,0.2)"
              }}
            >
              <Edit3 size={16} />
              <span>Sửa thông tin cá nhân</span>
            </button>
          </div>
        )}
      </div>

      {message && (
        <div style={{
          marginTop: "14px",
          padding: "12px 14px",
          borderRadius: "12px",
          backgroundColor: message.type === "success" ? "#e8f0eb" : "#ffebe8",
          color: message.type === "success" ? "#0c3e29" : "#8b312c",
          fontSize: "13px",
          fontWeight: 600,
          border: message.type === "success" ? "1px solid #cbe0d3" : "1px solid #f1c1bc",
          ...justifiedText
        }}>
          {message.text}
        </div>
      )}

      {/* Edit Form */}
      {isEditing ? (
        <form onSubmit={handleSaveProfile} style={{ marginTop: "16px", backgroundColor: "#ffffff", borderRadius: "16px", padding: "18px", border: "2px solid #155d3b", boxShadow: "0 4px 14px rgba(21,93,59,0.08)", textAlign: "left" }}>
          <h4 style={{ fontSize: "15px", fontWeight: 800, color: "#0c3e29", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Edit3 size={18} color="#155d3b" />
            <span>Chỉnh sửa hồ sơ nông hộ</span>
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#172019", display: "block", marginBottom: "5px" }}>
                Họ và tên chủ vườn (*)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ví dụ: Nguyễn Văn Hùng"
                style={{ width: "100%", padding: "11px 13px", borderRadius: "10px", border: "1px solid #dfe3da", fontSize: "14px", color: "#172019", backgroundColor: "#fbfcf9" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#172019", display: "block", marginBottom: "5px" }}>
                Số điện thoại liên hệ
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ví dụ: 0912 345 678"
                style={{ width: "100%", padding: "11px 13px", borderRadius: "10px", border: "1px solid #dfe3da", fontSize: "14px", color: "#172019", backgroundColor: "#fbfcf9" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#172019", display: "block", marginBottom: "5px" }}>
                Tên vườn hoặc Hợp tác xã sinh hoạt
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Ví dụ: HTX Nông Nghiệp Ea Yông"
                style={{ width: "100%", padding: "11px 13px", borderRadius: "10px", border: "1px solid #dfe3da", fontSize: "14px", color: "#172019", backgroundColor: "#fbfcf9" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
              <button
                type="submit"
                disabled={loading}
                style={{ flex: 1, padding: "12px", backgroundColor: "#155d3b", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <Check size={18} />
                <span>{loading ? "Đang lưu..." : "Lưu thay đổi"}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{ padding: "12px 16px", backgroundColor: "#f5f5ef", color: "#667069", border: "1px solid #dfe3da", borderRadius: "10px", fontWeight: 700, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* Profile Info List */
        <div style={{ marginTop: "16px", backgroundColor: "#ffffff", borderRadius: "16px", padding: "18px", border: "1px solid #dfe3da", textAlign: "left" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#0c3e29", marginBottom: "14px" }}>
            📋 Thông tin vườn & xác thực
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", fontSize: "13.5px" }}>
              <Award size={20} color="#155d3b" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <div style={{ fontSize: "12px", color: "#667069" }}>Đơn vị chủ quản / Hợp tác xã:</div>
                <div style={{ fontWeight: 700, color: "#172019", marginTop: "2px" }}>{session?.actor.organization ?? organization}</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", fontSize: "13.5px" }}>
              <Phone size={20} color="#155d3b" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <div style={{ fontSize: "12px", color: "#667069" }}>Số điện thoại đăng ký Zalo:</div>
                <div style={{ fontWeight: 700, color: "#172019", marginTop: "2px" }}>{phone}</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", fontSize: "13.5px" }}>
              <MapPin size={20} color="#155d3b" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <div style={{ fontSize: "12px", color: "#667069" }}>{isCollector ? "Khu vực thu mua chính:" : "Khu vực thu hoạch chính:"}</div>
                <div style={{ fontWeight: 700, color: "#172019", marginTop: "2px" }}>{primaryRegion}</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", fontSize: "13.5px", borderTop: "1px dashed #dfe3da", paddingTop: "12px" }}>
              <ShieldCheck size={20} color="#155d3b" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <div style={{ fontSize: "12px", color: "#667069" }}>Quyền hạn ghi nhận nông sản:</div>
                <div style={{ fontWeight: 700, color: "#0c3e29", marginTop: "2px" }}>Chủ hộ / nông dân chính thức (đã cấp phép)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Actions / Delete */}
      <div style={{ marginTop: "16px", backgroundColor: "#ffffff", borderRadius: "16px", padding: "16px", border: "1px solid #dfe3da", textAlign: "left" }}>
        <h4 style={{ fontSize: "13.5px", fontWeight: 800, color: "#8b312c", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
          <AlertTriangle size={16} color="#8b312c" />
          <span>Quản lý tài khoản an toàn</span>
        </h4>
        <p style={{ fontSize: "12px", color: "#667069", marginBottom: "12px", lineHeight: "1.5", ...justifiedText }}>
          Đăng xuất sẽ giữ lịch sử trên máy. Nếu muốn xoá dữ liệu đã lưu cục bộ trên thiết bị này, dùng tuỳ chọn xoá thông tin máy.
        </p>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "11px 14px",
            backgroundColor: "#f5f5ef",
            color: "#155d3b",
            border: "1px solid #dfe3da",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            cursor: "pointer"
          }}
        >
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </button>
        <button
          type="button"
          onClick={handleLogoutAndClearDevice}
          disabled={loading}
          style={{
            width: "100%",
            marginTop: "10px",
            padding: "11px 14px",
            backgroundColor: "#fff0ed",
            color: "#8b312c",
            border: "1px solid #f1c1bc",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.72 : 1
          }}
        >
          <Trash2 size={16} />
          <span>{loading ? "Đang xoá..." : "Đăng xuất & xoá thông tin máy"}</span>
        </button>
      </div>
    </div>
  );
};
