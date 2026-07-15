"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { UsersIcon, PlotIcon, LockIcon, SproutIcon, AuditIcon, CheckCircleIcon, QrIcon, ScaleIcon, BoxIcon } from "../components/Icons";

type RoleType = "FARMER" | "COLLECTOR" | "COOPERATIVE" | "ADMIN";

interface RoleOption {
  id: RoleType;
  title: string;
  subtitle: string;
  badge: string;
  colorClass: string;
  targetUrl: string;
  defaultName: string;
  defaultOrg: string;
  defaultCode: string;
}

const ROLES: RoleOption[] = [
  {
    id: "FARMER",
    title: "Nông dân / Chủ vườn",
    subtitle: "Ghi nhận nhật ký thực địa, tạo lô thu hoạch, khai báo sản lượng ngay tại vườn trồng.",
    badge: "Zalo Mini App / Cổng Nông hộ",
    colorClass: "role-farmer",
    targetUrl: "/portal?role=farmer",
    defaultName: "Nguyễn Đình Khang",
    defaultOrg: "HTX Nông nghiệp Sầu Riêng Krông Pắc",
    defaultCode: "#R-1549"
  },
  {
    id: "COLLECTOR",
    title: "Thương lái / Điểm thu mua",
    subtitle: "Quét QR nhận bàn giao từ nông dân, kiểm định khối lượng thực tế, xác nhận phiếu cân điện tử.",
    badge: "Điều phối & Thu gom",
    colorClass: "role-collector",
    targetUrl: "/portal?role=collector",
    defaultName: "Lê Văn Hòa",
    defaultOrg: "Điểm thu mua Trái cây Sạch Tây Nguyên",
    defaultCode: "#C-8821"
  },
  {
    id: "COOPERATIVE",
    title: "Hợp tác xã / Cơ sở đóng gói",
    subtitle: "Giám sát vùng trồng thành viên, chuẩn hóa tem GS1 Digital Link, in mã QR cho lô hàng xuất khẩu.",
    badge: "Quản lý Đóng gói & GS1",
    colorClass: "role-cooperative",
    targetUrl: "/portal?role=cooperative",
    defaultName: "Trần Thị Mai",
    defaultOrg: "HTX Sầu Riêng Xuất Khẩu Krông Pắc",
    defaultCode: "#COOP-9012"
  },
  {
    id: "ADMIN",
    title: "Quản trị viên Hệ thống (Admin)",
    subtitle: "Kiểm duyệt quy tắc rủi ro 6 bước, quản lý người dùng, chốt khóa Merkle root lên Blockchain.",
    badge: "Toàn quyền BATS Central",
    colorClass: "role-admin",
    targetUrl: "/admin",
    defaultName: "Quản Trị BATS Central",
    defaultOrg: "Trung tâm Đăng ký & Kiểm định BATS",
    defaultCode: "#ADM-0001"
  }
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams?.get("mode") === "register" ? "register" : "login";

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [selectedRole, setSelectedRole] = useState<RoleType>("FARMER");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [plotCode, setPlotCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const roleObj = ROLES.find((r) => r.id === selectedRole);
    if (roleObj) {
      if (mode === "register" || !fullName) {
        setFullName(roleObj.defaultName);
        setOrgName(roleObj.defaultOrg);
        setPlotCode(roleObj.defaultCode);
      }
      setEmail(`${roleObj.id.toLowerCase()}@bats.vn`);
    }
  }, [selectedRole, mode]);

  const currentRoleInfo = ROLES.find((r) => r.id === selectedRole) || ROLES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    setTimeout(() => {
      const userProfile = {
        name: fullName || currentRoleInfo.defaultName,
        org: orgName || currentRoleInfo.defaultOrg,
        code: plotCode || currentRoleInfo.defaultCode,
        role: selectedRole,
        email: email || `${selectedRole.toLowerCase()}@bats.vn`,
        phone: phone || "0912345678"
      };
      localStorage.setItem("bats_current_user", JSON.stringify(userProfile));
      localStorage.setItem("bats_current_role", selectedRole);

      setLoading(false);
      router.push(currentRoleInfo.targetUrl);
    }, 450);
  };

  const quickLoginAs = (roleId: RoleType) => {
    const roleObj = ROLES.find((r) => r.id === roleId) || ROLES[0];
    const userProfile = {
      name: roleObj.defaultName,
      org: roleObj.defaultOrg,
      code: roleObj.defaultCode,
      role: roleObj.id,
      email: `${roleObj.id.toLowerCase()}@bats.vn`,
      phone: "0912345678"
    };
    localStorage.setItem("bats_current_user", JSON.stringify(userProfile));
    localStorage.setItem("bats_current_role", roleObj.id);
    router.push(roleObj.targetUrl);
  };

  return (
    <main className="authPageShell">
      <div className="authContainer">
        {/* Left Brand Panel */}
        <div className="authBrandSide">
          <Link href="/" className="authBrandHeader">
            <div className="brandLogoCircle">BATS</div>
            <div>
              <strong>BATS Traceability</strong>
              <span>Hệ thống Nông nghiệp Số chuẩn GS1 & Blockchain</span>
            </div>
          </Link>

          <div className="authBrandCopy">
            <div className="eyebrow">CỔNG XÁC THỰC & PHÂN QUYỀN ĐỒNG BỘ</div>
            <h1>Một nền tảng, kết nối minh bạch mọi vai trò trong chuỗi cung ứng.</h1>
            <p>
              Dữ liệu được đồng bộ realtime từ Zalo Mini App của nông hộ thực địa lên Cổng Sổ tay Nông hộ (`/portal`) và Sổ cái bảo mật Blockchain (`/admin`).
            </p>

            <div className="authFeatureList">
              <div className="authFeatureItem">
                <span className="authFeatureIcon"><SproutIcon size={18} /></span>
                <div>
                  <strong>Nông dân & Thương lái thao tác siêu tiện lợi</strong>
                  <small>Ghi nhật ký lô hàng, quét QR bàn giao ngay trên điện thoại di động mà không cần cài đặt.</small>
                </div>
              </div>
              <div className="authFeatureItem">
                <span className="authFeatureIcon"><BoxIcon size={18} /></span>
                <div>
                  <strong>Hợp tác xã chuẩn hóa GS1 & Tem QR Digital Link</strong>
                  <small>Tự động phát hành tem truy xuất thông minh chuẩn quốc tế cho từng lô nông sản xuất khẩu.</small>
                </div>
              </div>
              <div className="authFeatureItem">
                <span className="authFeatureIcon"><LockIcon size={18} /></span>
                <div>
                  <strong>Bảo mật bất biến trên Blockchain Merkle Root</strong>
                  <small>Mỗi sự kiện thu hoạch và bàn giao được băm SHA-256 và neo lên chuỗi khối không thể chỉnh sửa.</small>
                </div>
              </div>
            </div>
          </div>

          <div className="authBrandFooter">
            <span>Phiên bản BATS v1.0.0 (GS1 EPCIS 2.0 & Blockchain Ready)</span>
            <span>Hỗ trợ Kỹ thuật: 028 3724 7148</span>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="authFormSide">
          <div className="authTabsWrap">
            <button
              type="button"
              className={`authTabBtn ${mode === "login" ? "active" : ""}`}
              onClick={() => setMode("login")}
            >
              Đăng nhập tài khoản
            </button>
            <button
              type="button"
              className={`authTabBtn ${mode === "register" ? "active" : ""}`}
              onClick={() => setMode("register")}
            >
              Dùng thử miễn phí / Đăng ký
            </button>
          </div>

          <div className="authFormBody">
            <div className="authRoleHeader">
              <h3>Chọn vai trò của bạn trong chuỗi nông sản:</h3>
              <p>Hệ thống tự động điều hướng sang Sổ tay Nông hộ (`/portal`) hoặc Quản trị Admin (`/admin`).</p>
            </div>

            <div className="authRoleGrid">
              {ROLES.map((role) => (
                <div
                  key={role.id}
                  className={`authRoleItem ${selectedRole === role.id ? "selected" : ""}`}
                  onClick={() => setSelectedRole(role.id)}
                >
                  <div className="authRoleRadio">
                    <span className="radioOuter">
                      {selectedRole === role.id && <span className="radioInner" />}
                    </span>
                    <span className="roleBadge">{role.badge}</span>
                  </div>
                  <strong>{role.title}</strong>
                  <small>{role.subtitle}</small>
                </div>
              ))}
            </div>

            <form className="authMainForm" onSubmit={handleSubmit}>
              {mode === "register" && (
                <div className="formRowGrid">
                  <label>
                    Họ và tên / Người đại diện
                    <input
                      type="text"
                      placeholder="VD: Nguyễn Đình Khang"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Số điện thoại / Zalo ID
                    <input
                      type="tel"
                      placeholder="VD: 0912 345 678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </label>
                </div>
              )}

              {mode === "register" && (
                <div className="formRowGrid">
                  <label>
                    Tên HTX / Doanh nghiệp / Điểm thu mua
                    <input
                      type="text"
                      placeholder="VD: HTX Sầu Riêng Krông Pắc"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                    />
                  </label>
                  <label>
                    Mã định danh vùng / Mã số
                    <input
                      type="text"
                      placeholder="VD: #R-1549 hoặc VN-DLK-01"
                      value={plotCode}
                      onChange={(e) => setPlotCode(e.target.value)}
                    />
                  </label>
                </div>
              )}

              <label>
                Email đăng nhập
                <input
                  type="email"
                  placeholder={mode === "register" ? "nongdan@bats.vn" : `${selectedRole.toLowerCase()}@bats.vn`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label>
                Mật khẩu
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>

              {error && <div className="formErrorNotice">{error}</div>}

              <button type="submit" className="button primary authSubmitBtn" disabled={loading}>
                {loading ? "Đang đồng bộ quyền truy cập..." : mode === "login" ? `Đăng nhập vai trò ${currentRoleInfo.title} →` : `Đăng ký & Vào giao diện ${currentRoleInfo.title} →`}
              </button>
            </form>

            <div className="authQuickDemo">
              <div className="demoDivider">
                <span>Hoặc bấm chọn trải nghiệm nhanh tức thì (Không cần nhập mật khẩu)</span>
              </div>
              <div className="quickBtnGrid">
                <button type="button" className="quickRoleBtn" onClick={() => quickLoginAs("FARMER")}>
                  <SproutIcon size={15} /> Nông dân Nguyễn Đình Khang (#R-1549)
                </button>
                <button type="button" className="quickRoleBtn" onClick={() => quickLoginAs("COLLECTOR")}>
                  <ScaleIcon size={15} /> Thương lái Lê Văn Hòa (#C-8821)
                </button>
                <button type="button" className="quickRoleBtn" onClick={() => quickLoginAs("COOPERATIVE")}>
                  <BoxIcon size={15} /> HTX Krông Pắc (#COOP-9012)
                </button>
                <button type="button" className="quickRoleBtn adminQuick" onClick={() => quickLoginAs("ADMIN")}>
                  <LockIcon size={15} /> Quản trị BATS Central (#ADM-01)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="authPageShell"><div style={{ padding: 60, textAlign: "center", color: "#166a41" }}>Đang tải Cổng xác thực BATS...</div></main>}>
      <LoginContent />
    </Suspense>
  );
}
