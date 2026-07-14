import React, { useState } from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { BatsZaloSession, captureHarvestLocation } from "../zalo-session.js";
import { API_BASE_URL, fetchWithTimeout } from "../config.js";

interface LoginPageProps {
  onLoginSuccess: (session: BatsZaloSession) => void;
}

type RegisterRole = "FARMER" | "COLLECTOR";

function buildAccountKey(role: RegisterRole, phone: string) {
  return `${role}:${phone.trim()}`;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<"register" | "login">("register");
  const [selectedRole, setSelectedRole] = useState<RegisterRole>("FARMER");
  
  // Registration form state
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [crop, setCrop] = useState("durian");
  const [variety, setVariety] = useState("Ri6");
  
  // Login form state
  const [loginPhone, setLoginPhone] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "info" | "error" | "success" } | null>(null);
  const justifiedText = { textAlign: "justify" as const, textJustify: "inter-word" as const };
  const isCollectorRole = selectedRole === "COLLECTOR";
  const roleCopy = isCollectorRole
    ? {
        audience: "thương lái",
        registerTab: "Đăng ký tài khoản",
        title: "Thông tin đăng ký tài khoản",
        phoneLabel: "Số điện thoại thương lái (*)",
        nameLabel: "Họ và tên thương lái (*)",
        orgLabel: "Tên điểm thu mua / đơn vị (*)",
        orgPlaceholder: "Vựa thu mua B",
        gpsNote: "Khi bấm tạo tài khoản, ứng dụng sẽ lấy tọa độ GPS tại điểm thu mua để gắn với hồ sơ thương lái và hỗ trợ ghi nhận nhận lô sau này.",
        submitIdle: "LẤY VỊ TRÍ GPS & TẠO TÀI KHOẢN",
        submitLoading: "ĐANG ĐO GPS & TẠO...",
        loginTitle: "Đăng nhập Sổ tay BATS",
        loginPhoneLabel: "Số điện thoại thương lái (*)"
      }
    : {
        audience: "nông hộ",
        registerTab: "Đăng ký tài khoản",
        title: "Thông tin đăng ký tài khoản",
        phoneLabel: "Số điện thoại nông hộ (*)",
        nameLabel: "Họ và tên Hộ nông dân (*)",
        orgLabel: "Tên Hợp tác xã / Tổ hợp tác (*)",
        orgPlaceholder: "HTX Nông nghiệp B",
        gpsNote: "Khi bấm tạo tài khoản, ứng dụng sẽ thực hiện lấy tọa độ GPS chính xác tại vị trí của bạn để thiết lập mã định danh rẫy ngẫu nhiên.",
        submitIdle: "LẤY VỊ TRÍ GPS & TẠO TÀI KHOẢN",
        submitLoading: "ĐANG ĐO GPS & TẠO...",
        loginTitle: "Đăng nhập Sổ tay BATS",
        loginPhoneLabel: "Số điện thoại nông hộ (*)"
      };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !name.trim() || !organization.trim()) {
      setStatusMsg({ text: "Vui lòng nhập đầy đủ các thông tin bắt buộc (*)", type: "error" });
      return;
    }

    setLoading(true);
    setStatusMsg({ text: isCollectorRole ? "Đang đo định vị GPS điểm thu mua..." : "Đang đo định vị GPS rẫy của bạn để xác định lô...", type: "info" });

    try {
      const coords = await captureHarvestLocation(API_BASE_URL);
      const randomNumber = Math.floor(1000 + Math.random() * 9000);
      const randomFarmerNumber = Math.floor(1000 + Math.random() * 9000);
      const plotId = `PLOT-RND-${randomNumber}`;
      const plantingCode = `VN-DLK-PA-${randomNumber}`;
      const actorId = `${selectedRole}-${randomFarmerNumber}`;

      let actor: BatsZaloSession["actor"] = {
        id: actorId,
        name: name.trim(),
        role: selectedRole,
        organization: organization.trim(),
        phone: phone.trim()
      };

      if (isCollectorRole) {
        actor.collectorProfile = {
          baseLatitude: coords.latitude,
          baseLongitude: coords.longitude,
          pickupAreaCode: `PICKUP-${randomNumber}`
        };
      } else {
        actor.plot = {
          id: plotId,
          plantingAreaCode: plantingCode,
          crop,
          variety,
          latitude: coords.latitude,
          longitude: coords.longitude
        };
      }

      let accessToken = `bats-token-${actorId}`;

      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}${isCollectorRole ? "/auth/collector/register" : "/auth/farmer/register"}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: selectedRole,
            phone: phone.trim(),
            name: name.trim(),
            organization: organization.trim(),
            crop,
            variety,
            latitude: coords.latitude,
            longitude: coords.longitude,
            plotId,
            plantingAreaCode: plantingCode
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.actor) {
            actor = { ...actor, ...data.actor, plot: actor.plot, collectorProfile: actor.collectorProfile };
          }
          if (data.accessToken) accessToken = data.accessToken;
        }
      } catch {
        // Fallback lưu cục bộ nếu backend tạm thời không kết nối được
      }

      const newSession: BatsZaloSession = {
        accessToken,
        expiresIn: 31536000,
        actor
      };

      try {
        localStorage.setItem("bats_user_session", JSON.stringify(newSession));
        const savedMap = localStorage.getItem("bats_registered_accounts");
        const dict = savedMap ? JSON.parse(savedMap) : {};
        dict[buildAccountKey(selectedRole, phone)] = newSession;
        localStorage.setItem("bats_registered_accounts", JSON.stringify(dict));
      } catch {}

      setStatusMsg({ text: isCollectorRole ? "Đã thiết lập tài khoản thương lái thành công! Đang vào hệ thống..." : `Đã thiết lập lô rẫy ${plotId} thành công! Đang vào hệ thống...`, type: "success" });
      setTimeout(() => {
        onLoginSuccess(newSession);
      }, 700);
    } catch (err) {
      setStatusMsg({ text: "Không thể định vị GPS. Vui lòng kiểm tra quyền truy cập vị trí.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone.trim()) {
      setStatusMsg({ text: "Vui lòng nhập số điện thoại đã đăng ký", type: "error" });
      return;
    }

    setLoading(true);
    setStatusMsg({ text: `Đang kiểm tra tài khoản ${roleCopy.audience}...`, type: "info" });

    try {
      let foundSession: BatsZaloSession | null = null;

      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}${isCollectorRole ? "/auth/collector/login" : "/auth/farmer/login"}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: loginPhone.trim(), role: selectedRole })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.actor) {
            foundSession = {
              accessToken: data.accessToken ?? `bats-token-${data.actor.id}`,
              expiresIn: data.expiresIn ?? 31536000,
              actor: data.actor
            };
          }
        }
      } catch {}

      try {
        if (!foundSession) {
          const savedMap = localStorage.getItem("bats_registered_accounts");
          if (savedMap) {
            const dict = JSON.parse(savedMap);
            const roleKey = buildAccountKey(selectedRole, loginPhone);
            if (dict[roleKey]) {
              foundSession = dict[roleKey];
            } else if (dict[loginPhone.trim()] && (!dict[loginPhone.trim()]?.actor?.role || dict[loginPhone.trim()]?.actor?.role === selectedRole)) {
              foundSession = dict[loginPhone.trim()];
            }
          }
        }
      } catch {}

      if (foundSession) {
        localStorage.setItem("bats_user_session", JSON.stringify(foundSession));
        try {
          const savedMap = localStorage.getItem("bats_registered_accounts");
          const dict = savedMap ? JSON.parse(savedMap) : {};
          dict[buildAccountKey(selectedRole, loginPhone)] = foundSession;
          localStorage.setItem("bats_registered_accounts", JSON.stringify(dict));
        } catch {}
        setStatusMsg({ text: "Đăng nhập thành công!", type: "success" });
        setTimeout(() => {
          onLoginSuccess(foundSession!);
        }, 500);
      } else {
        setStatusMsg({ text: `Số điện thoại chưa được đăng ký trong hệ thống. Vui lòng chuyển qua tab '${roleCopy.registerTab}' bên dưới.`, type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scroll-area" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundColor: "#f8fafc", overflowY: "auto", paddingBottom: "30px" }}>
      {/* Guest Header */}
      <div style={{
        background: "linear-gradient(135deg, #155d3b 0%, #0c3e29 100%)",
        color: "#ffffff",
        padding: "24px 20px 28px 20px",
        borderBottomLeftRadius: "24px",
        borderBottomRightRadius: "24px",
        boxShadow: "0 6px 20px rgba(21, 93, 59, 0.24)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", minWidth: 0 }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "10px", padding: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <img src="./bats-logo.png" alt="BATS" style={{ width: "24px", height: "24px", objectFit: "contain" }} onError={(e) => { (e.target as HTMLElement).style.display = "none"; }} />
          </div>
          <h1 style={{ fontSize: "21px", fontWeight: 800, margin: 0, letterSpacing: 0, lineHeight: 1.16, minWidth: 0 }}>
            Sổ tay nông hộ BATS
          </h1>
        </div>
        <p style={{ fontSize: "13.5px", margin: 0, opacity: 0.92, lineHeight: "1.5", ...justifiedText }}>
          Đăng nhập hoặc đăng ký tài khoản {roleCopy.audience} để vào sổ tay thu hoạch BATS.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div style={{ padding: "16px 16px 0 16px" }}>
        <div style={{ display: "flex", backgroundColor: "#e8f0eb", borderRadius: "14px", padding: "4px" }}>
          <button
            type="button"
            onClick={() => { setActiveTab("register"); setStatusMsg(null); }}
            style={{
              flex: 1,
              padding: "10px 8px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: activeTab === "register" ? "#ffffff" : "transparent",
              color: activeTab === "register" ? "#155d3b" : "#667069",
              fontWeight: 700,
              fontSize: "13.5px",
              cursor: "pointer",
              boxShadow: activeTab === "register" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            {roleCopy.registerTab}
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("login"); setStatusMsg(null); }}
            style={{
              flex: 1,
              padding: "10px 8px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: activeTab === "login" ? "#ffffff" : "transparent",
              color: activeTab === "login" ? "#155d3b" : "#667069",
              fontWeight: 700,
              fontSize: "13.5px",
              cursor: "pointer",
              boxShadow: activeTab === "login" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            Đăng nhập SĐT
          </button>
        </div>
      </div>

      {/* Status Notification */}
      {statusMsg && (
        <div style={{ padding: "14px 16px 0 16px" }}>
          <div style={{
            padding: "12px 14px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13px",
            fontWeight: 600,
            lineHeight: "1.4",
            backgroundColor: statusMsg.type === "error" ? "#FEF2F2" : statusMsg.type === "success" ? "#F0FDF4" : "#EFF6FF",
            color: statusMsg.type === "error" ? "#DC2626" : statusMsg.type === "success" ? "#16A34A" : "#1D4ED8",
            border: `1px solid ${statusMsg.type === "error" ? "#FECACA" : statusMsg.type === "success" ? "#BBF7D0" : "#BFDBFE"}`
          }}>
            {statusMsg.type === "error" ? (
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
            ) : statusMsg.type === "success" ? (
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            ) : (
              <Loader2 size={18} style={{ flexShrink: 0 }} className="animate-spin" />
            )}
            <span style={justifiedText}>{statusMsg.text}</span>
          </div>
        </div>
      )}

      {/* Main Form Content */}
      <div style={{ padding: "16px" }}>
        {activeTab === "register" ? (
          <form onSubmit={handleRegister} style={{ backgroundColor: "#ffffff", borderRadius: "18px", padding: "18px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", margin: "0 0 14px 0" }}>
              <span>{roleCopy.title}</span>
            </h3>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                Vai trò (*)
              </label>
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value as RegisterRole);
                  setStatusMsg(null);
                }}
                style={{ width: "100%", height: "48px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid #cbd5e1", fontSize: "14px", fontWeight: 700, color: "#0f172a", outline: "none", backgroundColor: "#ffffff" }}
              >
                <option value="FARMER">Nông dân</option>
                <option value="COLLECTOR">Thương lái</option>
              </select>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                {roleCopy.phoneLabel}
              </label>
              <div style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="tel"
                  required
                  placeholder="09xxxxxx10"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: "100%", height: "48px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid #cbd5e1", fontSize: "14px", fontWeight: 600, color: "#0f172a", outline: "none" }}
                  onFocus={(e) => (e.target.style.borderColor = "#155d3b")}
                  onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                />
              </div>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                {roleCopy.nameLabel}
              </label>
              <div style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: "100%", height: "48px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid #cbd5e1", fontSize: "14px", fontWeight: 600, color: "#0f172a", outline: "none" }}
                  onFocus={(e) => (e.target.style.borderColor = "#155d3b")}
                  onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                />
              </div>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                {roleCopy.orgLabel}
              </label>
              <div style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="text"
                  required
                  placeholder={roleCopy.orgPlaceholder}
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  style={{ width: "100%", height: "48px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid #cbd5e1", fontSize: "14px", fontWeight: 600, color: "#0f172a", outline: "none" }}
                  onFocus={(e) => (e.target.style.borderColor = "#155d3b")}
                  onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  {isCollectorRole ? "Mặt hàng thu mua chính" : "Cây trồng chính"}
                </label>
                <select
                  value={crop}
                  onChange={(e) => {
                    setCrop(e.target.value);
                    if (e.target.value === "durian") setVariety("Ri6");
                    else if (e.target.value === "coffee") setVariety("Robusta Sẻ");
                    else if (e.target.value === "mango") setVariety("Cát Hòa Lộc");
                    else setVariety("Đặc sản local");
                  }}
                  style={{ width: "100%", height: "48px", padding: "0 12px", borderRadius: "12px", border: "1.5px solid #cbd5e1", fontSize: "14px", fontWeight: 600, color: "#0f172a", outline: "none", backgroundColor: "#ffffff" }}
                >
                  <option value="durian">Sầu riêng</option>
                  <option value="coffee">Cà phê</option>
                  <option value="mango">Xoài</option>
                  <option value="dragon_fruit">Thanh long</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  {isCollectorRole ? "Nhóm hàng trọng tâm" : "Giống nòng cốt"}
                </label>
                <input
                  type="text"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  style={{ width: "100%", height: "48px", padding: "0 12px", borderRadius: "12px", border: "1.5px solid #cbd5e1", fontSize: "14px", fontWeight: 600, color: "#0f172a", outline: "none" }}
                />
              </div>
            </div>

            {/* GPS Geofence Auto Info Box */}
            <div style={{ backgroundColor: "#e8f0eb", border: "1px dashed #155d3b", borderRadius: "12px", padding: "12px 14px", marginBottom: "18px" }}>
              <div style={{ fontSize: "12.5px", color: "#0c3e29", lineHeight: "1.5", ...justifiedText }}>
                <strong>{isCollectorRole ? "Cơ chế định vị điểm thu mua:" : "Cơ chế định vị rẫy:"}</strong> {roleCopy.gpsNote}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "14px",
                border: "none",
                background: "linear-gradient(135deg, #155d3b, #0c3e29)",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(21, 93, 59, 0.24)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "opacity 0.2s ease"
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>{roleCopy.submitLoading}</span>
                </>
              ) : (
                <>
                  <span>{roleCopy.submitIdle}</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} style={{ backgroundColor: "#ffffff", borderRadius: "18px", padding: "18px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", margin: "0 0 14px 0" }}>
              <span>{roleCopy.loginTitle}</span>
            </h3>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                Vai trò (*)
              </label>
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value as RegisterRole);
                  setStatusMsg(null);
                }}
                style={{ width: "100%", height: "48px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid #cbd5e1", fontSize: "14px", fontWeight: 700, color: "#0f172a", outline: "none", backgroundColor: "#ffffff" }}
              >
                <option value="FARMER">Nông dân</option>
                <option value="COLLECTOR">Thương lái</option>
              </select>
            </div>

            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                {roleCopy.loginPhoneLabel}
              </label>
              <div style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="tel"
                  required
                  placeholder="09xxxxxx10"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  style={{ width: "100%", height: "48px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid #cbd5e1", fontSize: "15px", fontWeight: 600, color: "#0f172a", outline: "none" }}
                  onFocus={(e) => (e.target.style.borderColor = "#155d3b")}
                  onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "14px",
                border: "none",
                background: "linear-gradient(135deg, #155d3b, #0c3e29)",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(21, 93, 59, 0.24)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>ĐANG ĐĂNG NHẬP...</span>
                </>
              ) : (
                <>
                  <span>ĐĂNG NHẬP SỔ TAY</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      <div style={{ padding: "12px 20px", fontSize: "12px", color: "#64748b", lineHeight: "1.5", ...justifiedText }}>
        Dữ liệu được định danh chuẩn GS1 EPCIS 2.0 và đồng bộ an toàn theo cơ chế phân quyền RBAC BATS.
      </div>
    </div>
  );
};
