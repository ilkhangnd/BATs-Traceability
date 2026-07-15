"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import GoogleMap, { type MapPoint } from "../components/GoogleMap";
import { SyncIcon, PlotIcon, UsersIcon, LockIcon, AuditIcon, RefreshIcon, CheckCircleIcon, AlertIcon } from "../components/Icons";

type Role = "ADMIN" | "COOPERATIVE" | "FARMER" | "COLLECTOR" | "PACKING" | "EXPORTER";
type Actor = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  zaloUserId?: string;
  role: Role;
  organization?: string;
  status: "active" | "inactive";
};
type Plot = {
  id: string;
  farmerId: string;
  farmerName: string;
  plantingAreaCode: string;
  variety: string;
  areaHa: number;
  province: string;
  district: string;
  commune: string;
  polygon: MapPoint[];
  status: "active" | "inactive";
};
type AuditLog = {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
};
type Anchor = {
  date: string;
  merkleRoot: string;
  txHash?: string;
  blockNumber?: string;
  status: "pending" | "confirmed" | "failed";
};
type Batch = {
  id: string;
  variety: string;
  quantityKg: number;
  status: string;
  riskScore: number;
  riskBand: "green" | "yellow" | "red";
  createdAt: string;
  identity: { gtin: string; lot: string; serial: string };
};
type AdminTab = "overview" | "sync" | "plots" | "actors" | "anchors" | "audit";

const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const emptyActor = { name: "", role: "FARMER" as Role, phone: "", organization: "", zaloUserId: "" };
const emptyPlot = {
  farmerId: "FARMER-0001",
  farmerName: "",
  plantingAreaCode: "",
  variety: "Ri6",
  areaHa: 0,
  province: "Đắk Lắk",
  district: "Krông Pắc",
  commune: "Ea Yông",
  polygon: [] as MapPoint[]
};

function getRoleLabel(role: string): string {
  switch (role) {
    case "ADMIN": return "Quản trị viên";
    case "COOPERATIVE": return "Hợp tác xã";
    case "FARMER": return "Nông dân";
    case "COLLECTOR": return "Thương lái / Thu gom";
    case "PACKING": return "Xưởng đóng gói";
    case "EXPORTER": return "Xuất khẩu";
    default: return role;
  }
}

function getPlotStatusLabel(status: string): string {
  return status === "active" ? "Đang hoạt động" : "Đã ngừng";
}

function getAnchorStatusLabel(status: string): string {
  switch (status) {
    case "confirmed": return "Đã chốt Blockchain";
    case "pending": return "Đang neo sổ cái";
    case "failed": return "Lỗi xác thực";
    default: return status;
  }
}

function getBatchStatusLabel(status: string): string {
  switch (status?.toLowerCase()) {
    case "harvested": return "Đã thu hoạch (Mini App)";
    case "collected": return "Đã thu mua (Mini App)";
    case "packed": return "Đã đóng gói";
    case "shipped": return "Đã xuất kho";
    case "verified": return "Đã kiểm tra thực địa";
    default: return status || "Chờ xử lý";
  }
}

function getBatchRiskLabel(band: string): string {
  switch (band) {
    case "green": return "Khớp kiểm định Rule Engine";
    case "yellow": return "Cần tra soát GPS / Lô";
    case "red": return "Cảnh báo sai lệch dữ liệu";
    default: return "Đang kiểm định";
  }
}

function getMonthKey(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return `${String(parsed.getMonth() + 1).padStart(2, "0")}/${parsed.getFullYear()}`;
}

async function request(path: string, options: RequestInit = {}) {
  let response: Response;
  try {
    response = await fetch(`${api}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "content-type": "application/json",
        ...(options.headers as Record<string, string> | undefined)
      }
    });
  } catch {
    throw new Error(
      `Không kết nối được backend tại ${api}. Hãy chạy "pnpm dev" ở thư mục gốc BATs.`
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message ?? "Yêu cầu không thành công.");
  return data;
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [adminName, setAdminName] = useState("");
  const [tab, setTab] = useState<AdminTab>("overview");
  const [actors, setActors] = useState<Actor[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [anchorDate, setAnchorDate] = useState(new Date().toISOString().slice(0, 10));
  const [actorForm, setActorForm] = useState(emptyActor);
  const [plotForm, setPlotForm] = useState(emptyPlot);
  const [editingActor, setEditingActor] = useState<string | null>(null);
  const [editingPlot, setEditingPlot] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadAdmin() {
    const [actorData, plotData, logData, anchorData, batchData] = await Promise.all([
      request("/admin/actors?pageSize=100"),
      request("/admin/plots?pageSize=100"),
      request("/admin/audit-logs?pageSize=100"),
      request("/admin/anchors"),
      request("/batches?pageSize=100")
    ]);
    setActors(actorData.items || []);
    setPlots(plotData.items || []);
    setLogs(logData.items || []);
    setAnchors(anchorData || []);
    setBatches(batchData.items || []);
  }

  useEffect(() => {
    void request("/auth/me")
      .then((data) => {
        setAuthenticated(true);
        setAdminName(data.actor.name);
        return loadAdmin();
      })
      .catch(() => setAuthenticated(false));
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const data = await request("/auth/admin/login", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") })
      });
      setAuthenticated(true);
      setAdminName(data.actor.name);
      setError("");
      await loadAdmin();
    } catch (loginError) {
      setError((loginError as Error).message);
    }
  }

  async function saveActor(event: FormEvent) {
    event.preventDefault();
    try {
      await request(editingActor ? `/admin/actors/${editingActor}` : "/admin/actors", {
        method: editingActor ? "PATCH" : "POST",
        body: JSON.stringify(actorForm)
      });
      setActorForm(emptyActor);
      setEditingActor(null);
      await loadAdmin();
    } catch (saveError) {
      setError((saveError as Error).message);
    }
  }

  async function savePlot(event: FormEvent) {
    event.preventDefault();
    try {
      await request(editingPlot ? `/admin/plots/${editingPlot}` : "/admin/plots", {
        method: editingPlot ? "PATCH" : "POST",
        body: JSON.stringify(plotForm)
      });
      setPlotForm(emptyPlot);
      setEditingPlot(null);
      await loadAdmin();
    } catch (saveError) {
      setError((saveError as Error).message);
    }
  }

  async function softDelete(kind: "actors" | "plots", id: string) {
    if (!window.confirm("Bạn muốn chuyển mục này sang trạng thái ngừng hoạt động?")) return;
    try {
      await request(`/admin/${kind}/${id}`, { method: "DELETE" });
      await loadAdmin();
    } catch (deleteError) {
      setError((deleteError as Error).message);
    }
  }

  async function anchorDailyRoot() {
    try {
      await request(`/admin/anchors/${anchorDate}`, { method: "POST" });
      setError("");
      await loadAdmin();
    } catch (anchorError) {
      setError((anchorError as Error).message);
    }
  }

  const activePlots = plots.filter((plot) => plot.status === "active").length;
  const pendingBatches = batches.filter((batch) => batch.riskBand !== "green" || batch.status?.toLowerCase() === "harvested").length;
  const syncedBatches = Math.max(0, batches.length - pendingBatches);
  const totalQuantityKg = batches.reduce((sum, batch) => sum + (Number(batch.quantityKg) || 0), 0);
  const recentBatches = [...batches]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);
  const monthlyHarvest = Object.entries(
    batches.reduce<Record<string, number>>((acc, batch) => {
      const key = getMonthKey(batch.createdAt);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {})
  ).slice(-7);
  const maxMonthlyHarvest = Math.max(1, ...monthlyHarvest.map(([, count]) => count));

  if (authenticated === null) {
    return <main className="adminLogin"><div className="loadingMark">Đang kiểm tra phiên đăng nhập…</div></main>;
  }

  if (!authenticated) {
    return (
      <main className="adminLogin">
        <form className="loginCard" onSubmit={login}>
          <img src="/bats-logo.png" alt="BATS Logo" style={{ width: "64px", height: "64px", objectFit: "contain", margin: "0 auto 4px" }} />
          <div className="eyebrow">BATS Admin</div>
          <h1>Đăng nhập</h1>
          <p>Quản lý vùng trồng, lô hàng và người dùng.</p>
          <label>Email<input name="email" type="email" placeholder="admin@bats.vn" required /></label>
          <label>Mật khẩu<input name="password" type="password" required /></label>
          {error && <div className="formError">{error}</div>}
          <button className="button primary" type="submit">Đăng nhập</button>
        </form>
      </main>
    );
  }

  return (
    <main className="adminShell">
      <aside className="adminSidebar">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img src="/bats-logo.png" alt="BATS Logo" style={{ width: "38px", height: "38px", objectFit: "contain", background: "white", padding: "4px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }} />
          <strong>BATS Admin</strong>
        </div>
        <nav className="adminNav">
          <button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}><CheckCircleIcon size={18} /> Tổng quan</button>
          <button className={tab === "sync" ? "active" : ""} onClick={() => setTab("sync")}><SyncIcon size={18} /> Đồng bộ</button>
          <button className={tab === "plots" ? "active" : ""} onClick={() => setTab("plots")}><PlotIcon size={18} /> Vùng trồng</button>
          <button className={tab === "actors" ? "active" : ""} onClick={() => setTab("actors")}><UsersIcon size={18} /> Người dùng</button>
          <button className={tab === "anchors" ? "active" : ""} onClick={() => setTab("anchors")}><LockIcon size={18} /> Blockchain</button>
          <button className={tab === "audit" ? "active" : ""} onClick={() => setTab("audit")}><AuditIcon size={18} /> Nhật ký</button>
        </nav>
        <small>Đăng nhập: {adminName}</small>
      </aside>

      <section className="adminContent">
        <div className="adminHeading">
          <div>
            <div className="eyebrow">Quản trị</div>
            <h1>{tab === "overview" ? "Tổng quan" : tab === "sync" ? "Đồng bộ" : tab === "plots" ? "Vùng trồng" : tab === "actors" ? "Người dùng" : tab === "anchors" ? "Blockchain" : "Nhật ký"}</h1>
          </div>
          <span>{tab === "overview" ? `${batches.length} lô · ${activePlots} vùng` : tab === "sync" ? `${batches.length} lô` : `${activePlots} vùng`}</span>
        </div>
        {error && <div className="formError">{error}<button onClick={() => setError("")}>×</button></div>}

        {tab === "overview" && (
          <div className="overviewDashboard">
            <section className="overviewWelcome">
              <div>
                <div className="eyebrow">Sổ tay nông hộ BATS</div>
                <h2>Xin chào, {adminName || "Admin"} 👋</h2>
                <p>Theo dõi nhanh dữ liệu từ Mini App, vùng trồng, lô hàng và trạng thái xác thực.</p>
              </div>
              <button className="button secondary" onClick={() => void loadAdmin()}>
                <RefreshIcon size={15} /> Làm mới
              </button>
            </section>

            <div className="overviewMetrics">
              <article>
                <span className="metricIcon green"><PlotIcon size={22} /></span>
                <div><small>Tổng số lô</small><strong>{batches.length}</strong></div>
              </article>
              <article>
                <span className="metricIcon amber"><AlertIcon size={22} /></span>
                <div><small>Chờ kiểm tra</small><strong>{pendingBatches}</strong></div>
              </article>
              <article>
                <span className="metricIcon green"><CheckCircleIcon size={22} /></span>
                <div><small>Đã ổn định</small><strong>{syncedBatches}</strong></div>
              </article>
              <article>
                <span className="metricIcon blue"><SyncIcon size={22} /></span>
                <div><small>Sản lượng</small><strong>{totalQuantityKg.toLocaleString("vi-VN")} kg</strong></div>
              </article>
            </div>

            <div className="overviewGrid">
              <section className="overviewCard">
                <div className="overviewCardHead">
                  <h3>Chức năng nhanh</h3>
                  <span>Thao tác thường dùng</span>
                </div>
                <div className="quickActionGrid">
                  <button onClick={() => setTab("plots")}><PlotIcon size={20} /><span>Thêm vùng trồng</span><small>GPS & polygon</small></button>
                  <button onClick={() => setTab("sync")}><SyncIcon size={20} /><span>Đồng bộ lô</span><small>Từ Zalo Mini App</small></button>
                  <button onClick={() => setTab("actors")}><UsersIcon size={20} /><span>Người dùng</span><small>Quyền & Zalo ID</small></button>
                  <button onClick={() => setTab("anchors")}><LockIcon size={20} /><span>Blockchain</span><small>Chốt Merkle Root</small></button>
                </div>
              </section>

              <section className="overviewCard">
                <div className="overviewCardHead">
                  <h3>Số lô theo tháng</h3>
                  <span>{monthlyHarvest.length || 0} tháng gần nhất</span>
                </div>
                <div className="miniBarChart">
                  {(monthlyHarvest.length ? monthlyHarvest : [["N/A", 0] as [string, number]]).map(([month, count]) => {
                    const value = Number(count) || 0;
                    return (
                      <div key={month} className="barItem">
                        <span style={{ height: `${Math.max(8, (value / maxMonthlyHarvest) * 120)}px` }} />
                        <small>{month}</small>
                        <b>{value}</b>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <section className="overviewCard recentTableCard">
              <div className="overviewCardHead">
                <h3>Lô gần đây</h3>
                <button className="button secondary" onClick={() => setTab("sync")}>Xem tất cả</button>
              </div>
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr><th>Mã lô</th><th>Giống</th><th>Sản lượng</th><th>Ngày tạo</th><th>Trạng thái</th><th></th></tr>
                  </thead>
                  <tbody>
                    {recentBatches.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: 34 }}>Chưa có lô gần đây.</td></tr>
                    ) : recentBatches.map((batch) => (
                      <tr key={batch.id}>
                        <td><strong>{batch.id}</strong><small>{batch.identity?.lot}</small></td>
                        <td>{batch.variety}</td>
                        <td><strong>{batch.quantityKg?.toLocaleString("vi-VN")} kg</strong></td>
                        <td>{new Date(batch.createdAt).toLocaleDateString("vi-VN")}</td>
                        <td><span className={`syncBadge ${batch.riskBand === "green" ? "synced" : "pending"}`}>{getBatchRiskLabel(batch.riskBand)}</span></td>
                        <td>
                          {batch.identity && (
                            <Link href={`/verify/${batch.identity.gtin}/${batch.identity.lot}/${batch.identity.serial}`}>
                              QR →
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {tab === "sync" && (
          <div>
            <div className="syncGrid">
              <div className="syncMetricCard">
                <span>Lô từ Mini App</span>
                <strong>{batches.length}</strong>
              </div>
              <div className="syncMetricCard">
                <span>Cần kiểm tra</span>
                <strong>{batches.filter((b) => b.riskBand !== "green" || b.status?.toLowerCase() === "harvested").length}</strong>
              </div>
              <div className="syncMetricCard">
                <span>Đồng bộ</span>
                <strong>Online</strong>
              </div>
            </div>

            <div className="syncTableWrap">
              <div className="syncHeader">
                <h2>Dữ liệu thực địa</h2>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button className="button secondary" onClick={() => void loadAdmin()} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", fontSize: "12px" }}>
                    <RefreshIcon size={14} /> Làm mới
                  </button>
                </div>
              </div>
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Mã lô</th>
                      <th>Giống</th>
                      <th>Nguồn</th>
                      <th>Trạng thái</th>
                      <th>Rủi ro</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
                          Chưa có lô hàng.
                        </td>
                      </tr>
                    ) : (
                      batches.map((batch) => (
                        <tr key={batch.id}>
                          <td>
                            <strong>{batch.id}</strong>
                            <small>{batch.identity?.gtin} · {batch.identity?.lot}</small>
                          </td>
                          <td>
                            <strong>{batch.variety}</strong>
                            <small>{batch.quantityKg?.toLocaleString("vi-VN")} kg</small>
                          </td>
                          <td>
                            <span>Zalo Mini App</span>
                            <small>{new Date(batch.createdAt).toLocaleString("vi-VN")}</small>
                          </td>
                          <td>
                            <span className="status">{getBatchStatusLabel(batch.status)}</span>
                          </td>
                          <td>
                            <span className={`syncBadge ${batch.riskBand === "green" ? "synced" : "pending"}`}>
                              {batch.riskBand === "green" ? "✅" : "⚠️"} {getBatchRiskLabel(batch.riskBand)}
                            </span>
                          </td>
                          <td style={{ display: "flex", gap: "8px", justifyContent: "center", padding: "18px 14px" }}>
                            {batch.identity && (
                              <Link
                                href={`/verify/${batch.identity.gtin}/${batch.identity.lot}/${batch.identity.serial}`}
                                className="button secondary"
                                style={{ padding: "6px 12px", fontSize: "11px", fontWeight: 700 }}
                              >
                                Tra cứu
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "plots" && (
          <div className="adminWorkspace">
            <form className="adminForm" onSubmit={savePlot}>
              <div className="formTitle"><h2>{editingPlot ? "Sửa vùng trồng" : "Thêm vùng trồng"}</h2><span>{plotForm.polygon.length} điểm GPS</span></div>
              <div className="formGrid">
                <label>Mã vùng<input value={plotForm.plantingAreaCode} onChange={(e) => setPlotForm({...plotForm, plantingAreaCode:e.target.value})} required /></label>
                <label>Chủ hộ<input value={plotForm.farmerName} onChange={(e) => setPlotForm({...plotForm, farmerName:e.target.value})} required /></label>
                <label>Giống<input value={plotForm.variety} onChange={(e) => setPlotForm({...plotForm, variety:e.target.value})} required /></label>
                <label>Diện tích (ha)<input type="number" step="0.001" value={plotForm.areaHa} onChange={(e) => setPlotForm({...plotForm, areaHa:Number(e.target.value)})} required /></label>
                <label>Tỉnh<input value={plotForm.province} onChange={(e) => setPlotForm({...plotForm, province:e.target.value})} /></label>
                <label>Huyện<input value={plotForm.district} onChange={(e) => setPlotForm({...plotForm, district:e.target.value})} /></label>
                <label>Xã<input value={plotForm.commune} onChange={(e) => setPlotForm({...plotForm, commune:e.target.value})} /></label>
              </div>
              <GoogleMap
                key={editingPlot ?? "new"}
                editable
                value={plotForm.polygon}
                onChange={(polygon) => setPlotForm((current) => ({...current, polygon}))}
                onAreaChange={(areaHa) => areaHa > 0 && setPlotForm((current) => ({...current, areaHa}))}
              />
              <div className="formActions">
                <button className="button primary" type="submit">{editingPlot ? "Lưu thay đổi" : "Tạo vùng trồng"}</button>
                {editingPlot && <button className="button secondary" type="button" onClick={() => {setEditingPlot(null);setPlotForm(emptyPlot);}}>Hủy</button>}
              </div>
            </form>
            <div className="adminList">
              {plots.map((plot) => (
                <article key={plot.id} className={plot.status === "inactive" ? "inactive" : ""}>
                  <div><span className="status">{getPlotStatusLabel(plot.status)}</span><h3>{plot.plantingAreaCode}</h3><p>{plot.farmerName} · {plot.areaHa} ha · {plot.variety}</p></div>
                  <div className="rowActions">
                    <button onClick={() => {setEditingPlot(plot.id);setPlotForm({...plot});}}>Sửa</button>
                    {plot.status === "active" && <button className="delete" onClick={() => void softDelete("plots",plot.id)}>Ngừng</button>}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {tab === "actors" && (
          <div className="adminWorkspace actorWorkspace">
            <form className="adminForm" onSubmit={saveActor}>
              <div className="formTitle"><h2>{editingActor ? "Sửa người dùng" : "Thêm người dùng"}</h2></div>
              <div className="formGrid one">
                <label>Họ tên<input value={actorForm.name} onChange={(e) => setActorForm({...actorForm,name:e.target.value})} required /></label>
                <label>Vai trò<select value={actorForm.role} onChange={(e) => setActorForm({...actorForm,role:e.target.value as Role})}>
                  <option value="FARMER">Nông dân</option>
                  <option value="COLLECTOR">Thương lái / Thu gom</option>
                  <option value="COOPERATIVE">Hợp tác xã</option>
                  <option value="PACKING">Xưởng đóng gói</option>
                  <option value="EXPORTER">Xuất khẩu</option>
                  <option value="ADMIN">Quản trị viên (Admin)</option>
                </select></label>
                <label>Số điện thoại<input value={actorForm.phone} onChange={(e) => setActorForm({...actorForm,phone:e.target.value})} /></label>
                <label>Tổ chức<input value={actorForm.organization} onChange={(e) => setActorForm({...actorForm,organization:e.target.value})} /></label>
                <label>Zalo User ID<input value={actorForm.zaloUserId} onChange={(e) => setActorForm({...actorForm,zaloUserId:e.target.value})} /></label>
              </div>
              <div className="formActions"><button className="button primary" type="submit">Lưu người dùng</button></div>
            </form>
            <div className="adminList">
              {actors.map((actor) => (
                <article key={actor.id} className={actor.status === "inactive" ? "inactive" : ""}>
                  <div><span className={`roleTag ${actor.role.toLowerCase()}`}>{getRoleLabel(actor.role)}</span><h3>{actor.name}</h3><p>{actor.organization || "Chưa có tổ chức"} · {actor.zaloUserId ? "Đã liên kết Zalo" : "Chưa nối Zalo"}</p></div>
                  <div className="rowActions">
                    <button onClick={() => {setEditingActor(actor.id);setActorForm({name:actor.name,role:actor.role,phone:actor.phone??"",organization:actor.organization??"",zaloUserId:actor.zaloUserId??""});}}>Sửa</button>
                    {actor.role !== "ADMIN" && actor.status === "active" && <button className="delete" onClick={() => void softDelete("actors",actor.id)}>Khóa</button>}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {tab === "audit" && (
          <div className="auditTable">
            {logs.length === 0 ? <p>Chưa có thao tác quản trị.</p> : logs.map((log) => (
              <article key={log.id}><span>{log.action}</span><strong>{log.targetType} · {log.targetId}</strong><small>{log.actorId} · {new Date(log.createdAt).toLocaleString("vi-VN")}</small></article>
            ))}
          </div>
        )}

        {tab === "anchors" && (
          <div className="adminWorkspace actorWorkspace">
            <section className="adminForm">
              <div className="formTitle"><h2>Chốt mã bảo mật (Merkle Root) theo ngày</h2></div>
              <div className="formGrid one">
                <label>Ngày nghiệp vụ<input type="date" value={anchorDate} onChange={(event) => setAnchorDate(event.target.value)} /></label>
              </div>
              <div className="formActions"><button className="button primary" type="button" onClick={() => void anchorDailyRoot()}>Chốt khóa Blockchain</button></div>
            </section>
            <div className="adminList">
              {anchors.length === 0 ? <p>Chưa có ngày nào được neo.</p> : anchors.map((anchor) => (
                <article key={anchor.date}>
                  <div>
                    <span className="status">{getAnchorStatusLabel(anchor.status)}</span>
                    <h3>{anchor.date}</h3>
                    <p>Khối Block {anchor.blockNumber ?? "—"} · {anchor.txHash ? `Giao dịch: ${anchor.txHash.slice(0, 18)}…` : "Chưa có mã giao dịch"}</p>
                    <code>{anchor.merkleRoot.slice(0, 24)}…</code>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
