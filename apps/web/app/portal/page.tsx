"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HomeIcon,
  PlotIcon,
  SyncIcon,
  AuditIcon,
  QrIcon,
  ChartIcon,
  HelpIcon,
  UsersIcon,
  SettingsIcon,
  LogoutIcon,
  SproutIcon,
  BoxIcon,
  CheckCircleIcon,
  ScaleIcon,
  BellIcon,
  FilterIcon,
  LockIcon
} from "../components/Icons";

interface BatchItem {
  id: string;
  variety: string;
  crop: string;
  quantityKg: number;
  status: "Đã đồng bộ" | "Đang chờ đồng bộ";
  createdAt: string;
  farmCode: string;
  qrCode: string;
  grade?: string;
  notes?: string;
}

export default function PortalPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [userName, setUserName] = useState("Nguyễn Đình Khang");
  const [userOrg, setUserOrg] = useState("HTX Nông nghiệp Sầu Riêng Krông Pắc");
  const [userCode, setUserCode] = useState("#R-1549");
  const [userRole, setUserRole] = useState("FARMER");
  const [userPhone, setUserPhone] = useState("0912 345 678");
  const [userAddress, setUserAddress] = useState("Xã Hòa Đông, Huyện Krông Pắc, Tỉnh Đắk Lắk");

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedBatchForModal, setSelectedBatchForModal] = useState<BatchItem | null>(null);

  // Create Batch Form state
  const [newVariety, setNewVariety] = useState("Ri6");
  const [newCrop, setNewCrop] = useState("Sầu riêng");
  const [newQuantity, setNewQuantity] = useState("1250");
  const [newPlotId, setNewPlotId] = useState("VN-DLK-PA-0001");
  const [newGrade, setNewGrade] = useState("Loại 1 (Xuất khẩu)");
  const [newNotes, setNewNotes] = useState("Trái chín đều 85%, thu hoạch lúc 06:30 sáng, không phun thuốc trước 14 ngày.");

  // Settings Toggles
  const [autoSync, setAutoSync] = useState(true);
  const [zaloNotify, setZaloNotify] = useState(true);
  const [highSecurity, setHighSecurity] = useState(false);

  // Initial batches
  const [batches, setBatches] = useState<BatchItem[]>([
    {
      id: "SR-20260714-277CF7",
      variety: "Ri6",
      crop: "Sầu riêng",
      quantityKg: 1250,
      status: "Đã đồng bộ",
      createdAt: "14/07/2026 09:52:18",
      farmCode: "#R-1549",
      qrCode: "8930000000019/SR-20260714-277CF7/0001",
      grade: "Loại 1 (Xuất khẩu)",
      notes: "Đạt chuẩn VietGAP, độ ngọt 32% Brix, không dư lượng thuốc BVTV."
    },
    {
      id: "SR-20260714-0C699F",
      variety: "Ri6",
      crop: "Sầu riêng",
      quantityKg: 1250,
      status: "Đang chờ đồng bộ",
      createdAt: "14/07/2026 09:51:46",
      farmCode: "#R-1549",
      qrCode: "8930000000019/SR-20260714-0C699F/0001",
      grade: "Loại 1 (Xuất khẩu)",
      notes: "Ghi nhận offline qua Zalo Mini App lúc vườn sóng yếu."
    },
    {
      id: "SR-20260714-D6D3C0",
      variety: "Ri6",
      crop: "Sầu riêng",
      quantityKg: 1250,
      status: "Đang chờ đồng bộ",
      createdAt: "14/07/2026 09:51:43",
      farmCode: "#R-1549",
      qrCode: "8930000000019/SR-20260714-D6D3C0/0001",
      grade: "Loại 1 (Xuất khẩu)",
      notes: "Lô thu hoạch ca chiều lúc 15:30, đóng sọt chuẩn GS1."
    },
    {
      id: "SR-20260713-49B2A1",
      variety: "Ri6",
      crop: "Sầu riêng",
      quantityKg: 980,
      status: "Đã đồng bộ",
      createdAt: "13/07/2026 16:21:10",
      farmCode: "#R-1549",
      qrCode: "8930000000019/SR-20260713-49B2A1/0001",
      grade: "Loại 2",
      notes: "Bàn giao cho thương lái Lê Văn Hòa (#C-8821), khớp trọng lượng phiếu cân."
    },
    {
      id: "SR-20260713-A1B2E3",
      variety: "Monthong",
      crop: "Sầu riêng",
      quantityKg: 1100,
      status: "Đã đồng bộ",
      createdAt: "13/07/2026 11:05:33",
      farmCode: "#R-1549",
      qrCode: "8930000000019/SR-20260713-A1B2E3/0001",
      grade: "Loại 1 (Xuất khẩu)",
      notes: "Đã xuất hồ sơ truy xuất sang cơ sở đóng gói HTX Krông Pắc."
    }
  ]);

  useEffect(() => {
    const savedUser = localStorage.getItem("bats_current_user");
    if (savedUser) {
      try {
        const profile = JSON.parse(savedUser);
        if (profile.name) setUserName(profile.name);
        if (profile.org) setUserOrg(profile.org);
        if (profile.code) setUserCode(profile.code);
        if (profile.role) setUserRole(profile.role);
        if (profile.phone) setUserPhone(profile.phone);
      } catch (e) {
        console.error("Error parsing saved profile:", e);
      }
    }
  }, []);

  const pendingCount = batches.filter((b) => b.status === "Đang chờ đồng bộ").length;
  const syncedCount = batches.filter((b) => b.status === "Đã đồng bộ").length;
  const totalCount = batches.length + 33;
  const totalWeight = batches.reduce((acc, b) => acc + b.quantityKg, 0) + 41420;

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    const newId = `SR-20260715-${randomHex}`;
    const newBatch: BatchItem = {
      id: newId,
      variety: newVariety,
      crop: newCrop,
      quantityKg: Number(newQuantity) || 1000,
      status: autoSync ? "Đã đồng bộ" : "Đang chờ đồng bộ",
      createdAt: new Date().toLocaleString("vi-VN"),
      farmCode: userCode,
      qrCode: `8930000000019/${newId}/0001`,
      grade: newGrade,
      notes: newNotes
    };
    setBatches([newBatch, ...batches]);
    setActiveTab("overview");
  };

  const handleSyncAll = () => {
    const updated = batches.map((b) => ({
      ...b,
      status: "Đã đồng bộ" as const
    }));
    setBatches(updated);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser = {
      name: userName,
      org: userOrg,
      code: userCode,
      role: userRole,
      phone: userPhone,
      address: userAddress
    };
    localStorage.setItem("bats_current_user", JSON.stringify(updatedUser));
    alert("✅ Đã cập nhật hồ sơ thành công vào hệ thống BATS!");
  };

  const handleLogout = () => {
    localStorage.removeItem("bats_current_user");
    localStorage.removeItem("bats_current_role");
    router.push("/login");
  };

  const filteredBatches = batches.filter((b) => {
    const matchesQuery = b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         b.variety.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         b.crop.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "ALL" || b.status === filterStatus;
    return matchesQuery && matchesFilter;
  });

  return (
    <div className="portalShell">
      {/* TOP APPLICATION BAR */}
      <header className="portalHeader">
        <Link href="/" className="portalBrand">
          <div className="portalLogoBadge">BATS</div>
          <div className="portalBrandTitles">
            <strong>HỆ THỐNG NÔNG NGHIỆP SỐ BATS</strong>
            <span>Cổng Sổ Tay Nông Hộ & Hợp Tác Xã</span>
          </div>
        </Link>

        <div className="portalHeaderRight">
          <div className="portalStatusPill">
            <span className="dotOnline" /> Online (Realtime Sync)
          </div>

          <div className="portalNotification" onClick={() => setActiveTab("pending")}>
            <BellIcon size={18} />
            {pendingCount > 0 && <span className="notifBadge">{pendingCount}</span>}
          </div>

          <div className="portalUserBox" onClick={() => setActiveTab("profile")}>
            <div className="userAvatarCircle">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="userAvatarText">
              <strong>{userName}</strong>
              <small>{userCode} ({userRole === "COLLECTOR" ? "Thương lái" : "Nông hộ"})</small>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN BODY GRID: SIDEBAR + CONTENT */}
      <div className="portalBodyGrid">
        <aside className="portalSidebar">
          <nav className="portalNav">
            <button
              type="button"
              className={activeTab === "overview" ? "active" : ""}
              onClick={() => setActiveTab("overview")}
            >
              <HomeIcon size={18} /> Tổng quan chuỗi
            </button>
            <button
              type="button"
              className={activeTab === "create" ? "active" : ""}
              onClick={() => setActiveTab("create")}
            >
              <PlotIcon size={18} /> Chốt lô thu hoạch mới
            </button>
            <button
              type="button"
              className={activeTab === "pending" ? "active" : ""}
              onClick={() => setActiveTab("pending")}
            >
              <SyncIcon size={18} /> Hàng chờ đồng bộ
              {pendingCount > 0 && <span className="sidebarBadge">{pendingCount}</span>}
            </button>
            <button
              type="button"
              className={activeTab === "history" ? "active" : ""}
              onClick={() => setActiveTab("history")}
            >
              <AuditIcon size={18} /> Lịch sử lô hàng
            </button>
            <button
              type="button"
              className={activeTab === "qr" ? "active" : ""}
              onClick={() => setActiveTab("qr")}
            >
              <QrIcon size={18} /> Tem QR & Mã GS1
            </button>
            <button
              type="button"
              className={activeTab === "reports" ? "active" : ""}
              onClick={() => setActiveTab("reports")}
            >
              <ChartIcon size={18} /> Báo cáo sản lượng
            </button>
            <button
              type="button"
              className={activeTab === "help" ? "active" : ""}
              onClick={() => setActiveTab("help")}
            >
              <HelpIcon size={18} /> Hướng dẫn Sổ tay
            </button>

            <div className="portalSidebarDivider" />

            <button
              type="button"
              className={activeTab === "profile" ? "active" : ""}
              onClick={() => setActiveTab("profile")}
            >
              <UsersIcon size={18} /> Hồ sơ {userRole === "COLLECTOR" ? "thương lái" : "nông hộ"}
            </button>
            <button
              type="button"
              className={activeTab === "settings" ? "active" : ""}
              onClick={() => setActiveTab("settings")}
            >
              <SettingsIcon size={18} /> Cài đặt & Zalo Mini App
            </button>
          </nav>

          <div className="portalSidebarBottom">
            <button type="button" className="portalLogoutBtn" onClick={handleLogout}>
              <LogoutIcon size={18} /> Đăng xuất khỏi hệ thống
            </button>
            <div className="portalVersionFooter">
              <span>BATS Portal v1.0.0</span>
              <span>© 2026 BATS Traceability</span>
            </div>
          </div>
        </aside>

        {/* MAIN DYNAMIC CONTENT AREA */}
        <main className="portalMainContent">
          {activeTab === "create" ? (
            <div className="portalPanelCard">
              <div className="panelTitleBar">
                <div>
                  <h2>🌱 Ghi Chép & Chốt Lô Thu Hoạch Mới</h2>
                  <p>Dữ liệu được băm Merkle root và neo bằng chứng bảo mật lên Blockchain ngay khi có sóng internet.</p>
                </div>
              </div>
              <form className="createBatchForm" onSubmit={handleCreateBatch}>
                <div className="formGroupGrid">
                  <label>
                    Loại nông sản
                    <select value={newCrop} onChange={(e) => setNewCrop(e.target.value)}>
                      <option value="Sầu riêng">🍈 Sầu riêng (Durian)</option>
                      <option value="Xoài Cát">🥭 Xoài Cát Hòa Lộc</option>
                      <option value="Cà phê">☕ Cà phê Đắk Lắk</option>
                      <option value="Thanh long">🐲 Thanh long Bình Thuận</option>
                    </select>
                  </label>
                  <label>
                    Giống cây / Phân loại
                    <input
                      type="text"
                      value={newVariety}
                      onChange={(e) => setNewVariety(e.target.value)}
                      placeholder="VD: Ri6, Monthong, Hòa Lộc..."
                      required
                    />
                  </label>
                </div>
                <div className="formGroupGrid">
                  <label>
                    Khối lượng thu hoạch (Kg)
                    <input
                      type="number"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(e.target.value)}
                      placeholder="1250"
                      required
                    />
                  </label>
                  <label>
                    Mã vùng trồng GPS / Lô đất
                    <input
                      type="text"
                      value={newPlotId}
                      onChange={(e) => setNewPlotId(e.target.value)}
                      placeholder="VN-DLK-PA-0001"
                      required
                    />
                  </label>
                </div>
                <div className="formGroupGrid">
                  <label>
                    Phân hạng chất lượng
                    <select value={newGrade} onChange={(e) => setNewGrade(e.target.value)}>
                      <option value="Loại 1 (Xuất khẩu)">⭐⭐⭐ Loại 1 (Đạt chuẩn Xuất khẩu GS1)</option>
                      <option value="Loại 2 (Siêu thị trong nước)">⭐⭐ Loại 2 (Phân phối siêu thị nội địa)</option>
                      <option value="Loại 3 (Chế biến thực phẩm)">⭐ Loại 3 (Phục vụ chế biến công nghiệp)</option>
                    </select>
                  </label>
                  <label>
                    Thời tiết lúc thu hoạch
                    <input
                      type="text"
                      defaultValue="Nắng nhẹ 28°C, độ ẩm 65%, không mưa"
                      required
                    />
                  </label>
                </div>
                <div className="formGroupFull">
                  <label>
                    Nhật ký thực địa & Ghi chú chất lượng
                    <textarea
                      rows={3}
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="Ghi nhận độ chín, thời gian cách ly phân bón, hoặc thông tin bàn giao cho thương lái..."
                    />
                  </label>
                </div>
                <div className="formActionButtons">
                  <button type="submit" className="button primary btnCreateSubmit">
                    🌱 Chốt & Ghi nhận lô vào sổ tay
                  </button>
                  <button type="button" className="button secondary btnCreateCancel" onClick={() => setActiveTab("overview")}>
                    Quay lại tổng quan
                  </button>
                </div>
              </form>
            </div>
          ) : activeTab === "pending" ? (
            <div className="portalPanelCard">
              <div className="panelTitleBar">
                <div>
                  <h2>🔄 Hàng Chờ Đồng Bộ Dữ Liệu Offline ({pendingCount} lô)</h2>
                  <p>Các lô ghi nhận khi mất mạng tại thực địa sẽ được lưu tạm tại đây. Bấm nút đồng bộ khi có kết nối Internet.</p>
                </div>
                {pendingCount > 0 && (
                  <button type="button" className="button primary btnSyncAll" onClick={handleSyncAll}>
                    ⚡ Đồng bộ tất cả lên Blockchain ({pendingCount} lô)
                  </button>
                )}
              </div>
              {pendingCount === 0 ? (
                <div className="emptyPortalNotice">
                  <span className="emptyNoticeIcon">🎉</span>
                  <strong>Tuyệt vời! Toàn bộ lô hàng thu hoạch đã được đồng bộ an toàn lên hệ thống & Blockchain.</strong>
                  <p>Khi bạn ghi nhận lô mới tại vùng sóng yếu qua Zalo Mini App, chúng sẽ xuất hiện tại đây.</p>
                  <button type="button" className="button secondary" onClick={() => setActiveTab("create")} style={{ marginTop: 12 }}>
                    + Ghi nhận lô thu hoạch mới
                  </button>
                </div>
              ) : (
                <div className="portalTableWrap">
                  <table className="portalTable">
                    <thead>
                      <tr>
                        <th>Mã lô</th>
                        <th>Loại nông sản</th>
                        <th>Khối lượng</th>
                        <th>Phân hạng</th>
                        <th>Ngày tạo</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batches.filter((b) => b.status === "Đang chờ đồng bộ").map((batch) => (
                        <tr key={batch.id}>
                          <td><strong>{batch.id}</strong></td>
                          <td>{batch.crop} ({batch.variety})</td>
                          <td><strong>{batch.quantityKg.toLocaleString("vi-VN")} Kg</strong></td>
                          <td>{batch.grade || "Loại 1"}</td>
                          <td>{batch.createdAt}</td>
                          <td><span className="badgePending">Đang chờ đồng bộ</span></td>
                          <td>
                            <button type="button" className="syncInlineBtn" onClick={handleSyncAll}>🔄 Đồng bộ ngay</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeTab === "history" ? (
            <div className="portalPanelCard">
              <div className="panelTitleBar">
                <div>
                  <h2>📂 Lịch Sử & Kho Lưu Trữ Lô Hàng</h2>
                  <p>Toàn bộ danh sách lô nông sản đã chốt, sẵn sàng xuất hồ sơ truy xuất cho thương lái hoặc doanh nghiệp.</p>
                </div>
                <div className="historyBarActions">
                  <button type="button" className="button secondary btnExport" onClick={() => alert("📊 Đang trích xuất file Excel (BATS_Export_History.xlsx)...")}>
                    📥 Xuất Excel / CSV
                  </button>
                </div>
              </div>
              <div className="tableSearchFilter" style={{ marginBottom: 18 }}>
                <input
                  type="text"
                  placeholder="🔍 Tìm theo mã lô, loại cây trồng, giống..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1px solid #c5dbcc" }}
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #c5dbcc" }}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="Đã đồng bộ">Đã đồng bộ</option>
                  <option value="Đang chờ đồng bộ">Đang chờ đồng bộ</option>
                </select>
              </div>
              <div className="portalTableWrap">
                <table className="portalTable">
                  <thead>
                    <tr>
                      <th>Mã lô</th>
                      <th>Nông sản</th>
                      <th>Khối lượng</th>
                      <th>Phân hạng</th>
                      <th>Ngày chốt</th>
                      <th>Mã nông hộ</th>
                      <th>Trạng thái</th>
                      <th>Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBatches.map((batch) => (
                      <tr key={batch.id}>
                        <td><strong>{batch.id}</strong></td>
                        <td>🍈 {batch.crop} ({batch.variety})</td>
                        <td><strong>{batch.quantityKg.toLocaleString("vi-VN")} Kg</strong></td>
                        <td>{batch.grade || "Loại 1"}</td>
                        <td>{batch.createdAt}</td>
                        <td><code>{batch.farmCode}</code></td>
                        <td>
                          <span className={batch.status === "Đã đồng bộ" ? "badgeSynced" : "badgePending"}>
                            {batch.status}
                          </span>
                        </td>
                        <td>
                          <button type="button" className="btnActionDetail" onClick={() => setSelectedBatchForModal(batch)}>
                            Xem nhật ký
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === "qr" ? (
            <div className="portalPanelCard">
              <div className="panelTitleBar">
                <div>
                  <h2>⌗ Trung Tâm Tem QR & Mã Định Danh GS1 Digital Link</h2>
                  <p>Mỗi lô hàng được tự động gán một chuỗi URL định danh GS1 EPCIS 2.0 chuẩn quốc tế, có thể in dán trực tiếp.</p>
                </div>
              </div>
              <div className="qrGridModern">
                {batches.map((b) => (
                  <div key={b.id} className="qrCardBox">
                    <div className="qrCardHeader">
                      <strong>LÔ #{b.id}</strong>
                      <span className="qrFruitBadge">{b.crop} {b.variety}</span>
                    </div>
                    <div className="qrPreviewCenter">
                      <div className="qrMockBox">
                        <QrIcon size={64} />
                        <div className="qrScanText">QUÉT TRUY XUẤT GS1</div>
                      </div>
                    </div>
                    <div className="qrUrlStrip">
                      <small>GS1 Digital Link URI:</small>
                      <code>https://id.bats.vn/01/8930000000019/10/{b.id}/21/0001</code>
                    </div>
                    <div className="qrCardFooter">
                      <Link href={`/verify/${b.qrCode}`} className="button primary btnQrVerify" target="_blank">
                        Xem trang công khai →
                      </Link>
                      <button type="button" className="button secondary btnQrPrint" onClick={() => alert(`🖨️ Đang chuẩn bị in tem chuẩn PNG/SVG cho lô #${b.id}...`)}>
                        In tem
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === "reports" ? (
            <div className="portalPanelCard">
              <div className="panelTitleBar">
                <div>
                  <h2>📊 Báo Cáo Sản Lượng & Phân Tích Thực Địa</h2>
                  <p>Dữ liệu tổng hợp theo thời gian thực từ các vườn trồng thuộc quyền sở hữu của nông hộ/HTX.</p>
                </div>
              </div>
              <div className="reportsGridModern">
                <div className="reportBox">
                  <h3>Tỷ trọng nông sản thu hoạch (Kg)</h3>
                  <div className="pieChartVisual">
                    <div className="pieBarItem">
                      <span>🍈 Sầu riêng Ri6</span>
                      <div className="barProgress"><div className="barFill green" style={{ width: "65%" }} /></div>
                      <strong>65% (30,710 Kg)</strong>
                    </div>
                    <div className="pieBarItem">
                      <span>☕ Cà phê Đắk Lắk</span>
                      <div className="barProgress"><div className="barFill orange" style={{ width: "20%" }} /></div>
                      <strong>20% (9,450 Kg)</strong>
                    </div>
                    <div className="pieBarItem">
                      <span>🥭 Xoài Cát Hòa Lộc</span>
                      <div className="barProgress"><div className="barFill blue" style={{ width: "15%" }} /></div>
                      <strong>15% (7,090 Kg)</strong>
                    </div>
                  </div>
                </div>
                <div className="reportBox">
                  <h3>Chỉ số Bất biến Blockchain & GS1</h3>
                  <div className="reportStatColumn">
                    <div className="rStat">
                      <strong>100%</strong>
                      <span>Tỷ lệ lô có chữ ký số nông hộ & tọa độ GPS thực địa</span>
                    </div>
                    <div className="rStat">
                      <strong>0%</strong>
                      <span>Tỷ lệ sai lệch trọng lượng khi bàn giao cho thương lái</span>
                    </div>
                    <div className="rStat">
                      <strong>#4,812,901</strong>
                      <span>Khối Block mới nhất neo bằng chứng Merkle Root</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === "profile" ? (
            <div className="portalPanelCard">
              <div className="panelTitleBar">
                <div>
                  <h2>👤 Hồ Sơ & Quyền Định Danh {userRole === "COLLECTOR" ? "Thương Lái" : "Nông Hộ"}</h2>
                  <p>Thông tin này được gắn vào chữ ký số và tem GS1 Digital Link cho mỗi lô thu hoạch của bạn.</p>
                </div>
              </div>
              <form className="profileFormModern" onSubmit={handleUpdateProfile}>
                <div className="formGroupGrid">
                  <label>
                    Họ và tên / Chủ vườn
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Tên Hợp tác xã / Điểm thu gom
                    <input
                      type="text"
                      value={userOrg}
                      onChange={(e) => setUserOrg(e.target.value)}
                      required
                    />
                  </label>
                </div>
                <div className="formGroupGrid">
                  <label>
                    Mã số thực địa (Farm Code)
                    <input
                      type="text"
                      value={userCode}
                      onChange={(e) => setUserCode(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Số điện thoại liên lạc
                    <input
                      type="tel"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      required
                    />
                  </label>
                </div>
                <div className="formGroupFull">
                  <label>
                    Địa chỉ vùng trồng & Tọa độ GPS mặc định
                    <input
                      type="text"
                      value={userAddress}
                      onChange={(e) => setUserAddress(e.target.value)}
                      required
                    />
                  </label>
                </div>
                <div className="formActionButtons">
                  <button type="submit" className="button primary">
                    💾 Lưu cập nhật hồ sơ vào hệ thống
                  </button>
                </div>
              </form>
            </div>
          ) : activeTab === "settings" ? (
            <div className="portalPanelCard">
              <div className="panelTitleBar">
                <div>
                  <h2>⚙️ Cài Đặt Hệ Thống & Kết Nối Zalo Mini App</h2>
                  <p>Tùy chỉnh hành vi đồng bộ, thông báo đẩy và xác thực bảo mật cho tài khoản BATS của bạn.</p>
                </div>
              </div>
              <div className="settingsListModern">
                <div className="settingRowItem">
                  <div>
                    <strong>Đồng bộ tự động Offline-first</strong>
                    <p>Tự động đẩy nhật ký thu hoạch lưu tạm trong máy lên máy chủ ngay khi thiết bị có kết nối Internet.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    className="toggleSwitch"
                  />
                </div>
                <div className="settingRowItem">
                  <div>
                    <strong>Thông báo đẩy Zalo Mini App</strong>
                    <p>Nhận thông báo tự động qua Zalo khi thương lái xác nhận nhận lô hoặc khi HTX phát hành tem QR.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={zaloNotify}
                    onChange={(e) => setZaloNotify(e.target.checked)}
                    className="toggleSwitch"
                  />
                </div>
                <div className="settingRowItem">
                  <div>
                    <strong>Chế độ bảo mật 2 lớp (OTP Zalo)</strong>
                    <p>Yêu cầu xác nhận mã OTP qua tin nhắn Zalo mỗi khi chốt lô có sản lượng lớn &gt; 5,000 Kg.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={highSecurity}
                    onChange={(e) => setHighSecurity(e.target.checked)}
                    className="toggleSwitch"
                  />
                </div>
              </div>
            </div>
          ) : activeTab === "help" ? (
            <div className="portalPanelCard">
              <div className="panelTitleBar">
                <div>
                  <h2>📖 Hướng Dẫn Sử Dụng Sổ Tay Nông Hộ & Zalo Mini App</h2>
                  <p>Quy trình 3 bước chuẩn hóa để ghi chép hành trình minh bạch cho nông sản Việt Nam.</p>
                </div>
              </div>
              <div className="helpStepsGrid">
                <div className="helpCardStep">
                  <div className="helpNumCircle">1</div>
                  <strong>Mở Zalo Mini App tại vườn</strong>
                  <p>Không cần tải hay tạo tài khoản phức tạp. Mở Zalo, tìm kiếm "BATS Traceability" và chọn "Ghi nhận thu hoạch".</p>
                </div>
                <div className="helpCardStep">
                  <div className="helpNumCircle">2</div>
                  <strong>Chốt lô & Nhập khối lượng</strong>
                  <p>Chọn giống cây trồng, điền sản lượng dự kiến và chụp ảnh minh chứng thực địa. Dữ liệu được băm Merkle ngay tức thì.</p>
                </div>
                <div className="helpCardStep">
                  <div className="helpNumCircle">3</div>
                  <strong>Quét bàn giao cho thương lái</strong>
                  <p>Khi xe thu gom đến, đưa mã QR trên Zalo cho thương lái quét. Khối lượng cân thực tế sẽ tự động khớp vào sổ tay!</p>
                </div>
              </div>
            </div>
          ) : (
            /* OVERVIEW TAB */
            <div className="portalOverviewContent">
              <div className="portalTopBar">
                <div className="portalGreeting">
                  <h1>Xin chào, {userName} 👋</h1>
                  <p>HTX: {userOrg} · Mã {userRole === "COLLECTOR" ? "thương lái" : "nông hộ"}: <strong>{userCode}</strong></p>
                </div>
                <div className="portalDateSelector">
                  <span className="dateRangeBtn">📅 14/06/2026 - 14/07/2026 ⌄</span>
                </div>
              </div>

              <div className="portalMetricGrid">
                <div className="metricBox" onClick={() => setActiveTab("history")}>
                  <div className="metricIconBox greenIcon"><SproutIcon size={22} /></div>
                  <div className="metricData">
                    <span>Tổng số lô thu hoạch</span>
                    <strong>{totalCount}</strong>
                    <small>Trong khoảng thời gian</small>
                  </div>
                </div>

                <div className="metricBox" onClick={() => setActiveTab("pending")}>
                  <div className="metricIconBox orangeIcon"><BoxIcon size={22} /></div>
                  <div className="metricData">
                    <span>Đang chờ đồng bộ</span>
                    <strong>{pendingCount}</strong>
                    <small>Lưu offline tại vườn</small>
                  </div>
                </div>

                <div className="metricBox" onClick={() => setActiveTab("history")}>
                  <div className="metricIconBox greenCheckIcon"><CheckCircleIcon size={22} /></div>
                  <div className="metricData">
                    <span>Đã đồng bộ Blockchain</span>
                    <strong>{syncedCount + 27}</strong>
                    <small>Đã neo Merkle Root</small>
                  </div>
                </div>

                <div className="metricBox" onClick={() => setActiveTab("reports")}>
                  <div className="metricIconBox blueIcon"><ScaleIcon size={22} /></div>
                  <div className="metricData">
                    <span>Tổng sản lượng đã chốt</span>
                    <strong>{totalWeight.toLocaleString("vi-VN")} Kg</strong>
                    <small>Đạt chuẩn GS1</small>
                  </div>
                </div>
              </div>

              <div className="portalMiddleSplit">
                <div className="portalCardBox">
                  <div className="cardTitleRow">
                    <h3>Chức năng thao tác nhanh</h3>
                  </div>
                  <div className="quickActionsGrid">
                    <div className="quickCard itemGreen" onClick={() => setActiveTab("create")}>
                      <span className="qIcon"><SproutIcon size={20} /></span>
                      <div>
                        <strong>Chốt lô mới</strong>
                        <small>Ghi nhật ký tại vườn</small>
                      </div>
                    </div>

                    <div className="quickCard itemOrange" onClick={() => setActiveTab("pending")}>
                      <span className="qIcon"><SyncIcon size={20} /></span>
                      <div>
                        <strong>Hàng chờ đồng bộ</strong>
                        <small>Xem & đẩy dữ liệu</small>
                      </div>
                    </div>

                    <div className="quickCard itemBlue" onClick={() => setActiveTab("qr")}>
                      <span className="qIcon"><QrIcon size={20} /></span>
                      <div>
                        <strong>Tem QR GS1</strong>
                        <small>In & xuất Digital Link</small>
                      </div>
                    </div>

                    <div className="quickCard itemPurple" onClick={() => setActiveTab("profile")}>
                      <span className="qIcon"><UsersIcon size={20} /></span>
                      <div>
                        <strong>Hồ sơ của bạn</strong>
                        <small>Cập nhật định danh</small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="portalCardBox">
                  <div className="cardTitleRow">
                    <h3>Số lô thu hoạch theo tháng</h3>
                    <span className="monthRangeBadge">7 tháng gần nhất ⌄</span>
                  </div>
                  <div className="barChartContainer">
                    <span className="yAxisLabel">Số lô<br />20</span>
                    <div className="barChartGrid">
                      {[
                        { month: "01/2026", value: 6, height: "30%" },
                        { month: "02/2026", value: 8, height: "40%" },
                        { month: "03/2026", value: 12, height: "60%" },
                        { month: "04/2026", value: 15, height: "75%" },
                        { month: "05/2026", value: 18, height: "90%" },
                        { month: "06/2026", value: 17, height: "85%" },
                        { month: "07/2026", value: 14, height: "70%" }
                      ].map((item) => (
                        <div key={item.month} className="chartColumn">
                          <span className="barVal">{item.value}</span>
                          <div className="barTrack">
                            <div className="barFill" style={{ height: item.height }} />
                          </div>
                          <span className="barMonth">{item.month}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="portalCardBox recentBatchesCard">
                <div className="tableHeaderBar">
                  <h3>Lô nông sản chốt gần đây</h3>
                  <div className="tableSearchFilter">
                    <div className="searchBoxPortal">
                      <input
                        type="text"
                        placeholder="🔍 Tìm theo mã lô, loại cây trồng..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <select
                      className="filterDropdownPortal"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="ALL">Bộ lọc (Tất cả)</option>
                      <option value="Đã đồng bộ">Đã đồng bộ</option>
                      <option value="Đang chờ đồng bộ">Đang chờ đồng bộ</option>
                    </select>
                  </div>
                </div>

                <div className="portalTableWrap">
                  <table className="portalTable">
                    <thead>
                      <tr>
                        <th style={{ width: "30px" }} />
                        <th>Mã lô</th>
                        <th>Loại nông sản</th>
                        <th>Giống cây</th>
                        <th>Sản lượng</th>
                        <th>Ngày tạo</th>
                        <th>Trạng thái</th>
                        <th style={{ textAlign: "right" }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBatches.map((batch) => (
                        <tr key={batch.id}>
                          <td>
                            <span className={batch.status === "Đã đồng bộ" ? "statusDotGreen" : "statusDotOrange"} />
                          </td>
                          <td>
                            <div className="batchIdRow">
                              <strong>{batch.id}</strong>
                              <Link href={`/verify/${batch.qrCode}`} className="qrMiniLink" title="Xem mã QR" target="_blank">
                                <QrIcon size={14} />
                              </Link>
                            </div>
                          </td>
                          <td>
                            <span className="fruitLabel">🍈 {batch.crop}</span>
                          </td>
                          <td><strong>{batch.variety}</strong></td>
                          <td><strong>{batch.quantityKg.toLocaleString("vi-VN")} Kg</strong></td>
                          <td className="createdAtText">{batch.createdAt}</td>
                          <td>
                            <span className={batch.status === "Đã đồng bộ" ? "badgeSynced" : "badgePending"}>
                              {batch.status}
                            </span>
                          </td>
                          <td className="actionCellRight">
                            <Link href={`/verify/${batch.qrCode}`} className="btnActionQr" target="_blank">
                              <QrIcon size={14} /> Xem QR
                            </Link>
                            {batch.status === "Đang chờ đồng bộ" ? (
                              <button type="button" className="btnActionSync" onClick={handleSyncAll}>🔄 Đồng bộ</button>
                            ) : (
                              <button type="button" className="btnActionDetail" onClick={() => setSelectedBatchForModal(batch)}>Nhật ký</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="portalPagination">
                  <button type="button" disabled>&lt;</button>
                  <button type="button" className="activePage">1</button>
                  <button type="button">2</button>
                  <button type="button">3</button>
                  <button type="button">4</button>
                  <span>...</span>
                  <button type="button">8</button>
                  <button type="button">&gt;</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* DETAIL MODAL POPUP */}
      {selectedBatchForModal && (
        <div className="portalModalOverlay" onClick={() => setSelectedBatchForModal(null)}>
          <div className="portalModalBox" onClick={(e) => e.stopPropagation()}>
            <div className="portalModalHeader">
              <div>
                <h3>🍈 NHẬT KÝ LÔ #{selectedBatchForModal.id}</h3>
                <span>{selectedBatchForModal.crop} - Giống {selectedBatchForModal.variety}</span>
              </div>
              <button type="button" className="closeModalBtn" onClick={() => setSelectedBatchForModal(null)}>✕</button>
            </div>
            <div className="portalModalBody">
              <div className="modalDetailGrid">
                <div>
                  <small>Khối lượng thu hoạch:</small>
                  <strong>{selectedBatchForModal.quantityKg.toLocaleString("vi-VN")} Kg</strong>
                </div>
                <div>
                  <small>Phân hạng chất lượng:</small>
                  <strong>{selectedBatchForModal.grade || "Loại 1 (Xuất khẩu)"}</strong>
                </div>
                <div>
                  <small>Thời gian tạo lô:</small>
                  <strong>{selectedBatchForModal.createdAt}</strong>
                </div>
                <div>
                  <small>Mã số nông hộ / vùng trồng:</small>
                  <strong>{selectedBatchForModal.farmCode}</strong>
                </div>
              </div>
              <div className="modalNotesBox">
                <small>Nhật ký & Ghi chú thực địa:</small>
                <p>{selectedBatchForModal.notes || "Trái thu hoạch đạt chuẩn độ chín, đóng gói cẩn thận chuẩn GS1."}</p>
              </div>
              <div className="modalBlockchainProof">
                <LockIcon size={16} />
                <span>Bằng chứng được neo trên Blockchain Merkle Root · Hash: <code>0x8f...2a9c</code></span>
              </div>
            </div>
            <div className="portalModalFooter">
              <Link href={`/verify/${selectedBatchForModal.qrCode}`} className="button primary" target="_blank">
                <QrIcon size={16} /> Xem trang tra cứu công khai →
              </Link>
              <button type="button" className="button secondary" onClick={() => setSelectedBatchForModal(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
