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
    subtitle: "Quét QR nhận bàn giao từ nông dân, ghi khối lượng thực tế và bằng chứng phiếu cân điện tử.",
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
    subtitle: "Quản lý vùng trồng thành viên, chuẩn hóa sự kiện GS1 Digital Link và tổ chức hồ sơ lô hàng.",
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
    subtitle: "Quản lý quy tắc PCIE, người dùng, hàng đợi review và trạng thái neo Merkle root.",
    badge: "Toàn quyền BATS Central",
    colorClass: "role-admin",
    targetUrl: "/admin",
    defaultName: "Quản Trị BATS Central",
    defaultOrg: "Trung tâm Đăng ký & Kiểm định BATS",
    defaultCode: "#ADM-0001"
  }
];

const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function savePortalProfile(actor: { id: string; name: string; role: RoleType; organization?: string; phone?: string }, accessToken?: string) {
  const profile = {
    name: actor.name,
    org: actor.organization ?? "",
    code: actor.id,
    actorId: actor.id,
    role: actor.role,
    phone: actor.phone ?? "",
    accessToken
  };
  localStorage.setItem("bats_current_user", JSON.stringify(profile));
  localStorage.setItem("bats_current_role", actor.role);
  window.dispatchEvent(new Event("bats-auth-change"));
}

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
      if (roleObj.id === "ADMIN") setEmail("admin@bats.vn");
    }
  }, [selectedRole, mode]);

  const currentRoleInfo = ROLES.find((r) => r.id === selectedRole) || ROLES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (selectedRole === "ADMIN") {
        const response = await fetch(`${api}/auth/admin/login`, {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message ?? "Không thể đăng nhập quản trị.");
        savePortalProfile(data.actor);
        router.push(currentRoleInfo.targetUrl);
        return;
      }

      const rolePath = selectedRole.toLowerCase();
      const response = await fetch(`${api}/auth/${rolePath}/${mode === "register" ? "register" : "login"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(mode === "register"
          ? { phone, name: fullName, organization: orgName }
          : { phone })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message ?? "Không thể xác thực tài khoản.");
      savePortalProfile(data.actor, data.accessToken);
      router.push(currentRoleInfo.targetUrl);
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const quickLoginAs = async (roleId: RoleType) => {
    const roleObj = ROLES.find((r) => r.id === roleId) || ROLES[0];
    setLoading(true);
    setError("");
    try {
      if (roleId === "ADMIN") {
        setSelectedRole("ADMIN");
        setEmail("admin@bats.vn");
        setPassword("");
        setError("Vui lòng nhập mật khẩu quản trị để tiếp tục.");
        return;
      }
      const demoPhone = roleId === "FARMER" ? "0900000001" : roleId === "COLLECTOR" ? "0900000002" : "0900000003";
      const response = await fetch(`${api}/auth/${roleId.toLowerCase()}/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: demoPhone, name: roleObj.defaultName, organization: roleObj.defaultOrg })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message ?? "Không thể khởi tạo phiên trải nghiệm.");
      savePortalProfile(data.actor, data.accessToken);
      router.push(roleObj.targetUrl);
    } catch (quickError) {
      setError((quickError as Error).message);
    } finally {
      setLoading(false);
    }
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
              Dữ liệu được đồng bộ từ Zalo Mini App và Website vào luồng BATS-AgriGuard: chuẩn hóa sự kiện, kiểm tra PCIE, lưu EPCIS và neo tóm tắt bằng chứng.
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
                  <strong>Hợp tác xã tổ chức dữ liệu GS1 & QR/Digital Link</strong>
                  <small>Quản lý vùng trồng, lô hàng và dữ liệu truy xuất phục vụ liên thông giữa các tác nhân trong chuỗi.</small>
                </div>
              </div>
              <div className="authFeatureItem">
                <span className="authFeatureIcon"><LockIcon size={18} /></span>
                <div>
                  <strong>Neo bằng chứng bằng Merkle Root</strong>
                  <small>Các bằng chứng đã chọn được băm và neo commitment để hỗ trợ phát hiện thay đổi sau khi cam kết.</small>
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
              {mode === "register" && selectedRole !== "ADMIN" && (
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

              {mode === "register" && selectedRole !== "ADMIN" && (
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

              {selectedRole !== "ADMIN" && mode === "login" && <label>
                Số điện thoại đã đăng ký
                <input
                  type="tel"
                  placeholder="VD: 0900 000 001"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </label>}

              {selectedRole === "ADMIN" && <label>
                Email quản trị
                <input
                  type="email"
                  placeholder="admin@bats.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>}

              {selectedRole === "ADMIN" && <label>
                Mật khẩu
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>}

              {error && <div className="formErrorNotice">{error}</div>}

              <button type="submit" className="button primary authSubmitBtn" disabled={loading}>
                {loading ? "Đang xác thực quyền truy cập..." : selectedRole === "ADMIN" ? "Đăng nhập quản trị →" : mode === "login" ? `Đăng nhập ${currentRoleInfo.title} →` : `Đăng ký & vào dashboard →`}
              </button>
            </form>

            <div className="authQuickDemo">
              <div className="demoDivider">
                <span>Hoặc mở nhanh phiên trải nghiệm theo vai trò</span>
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
