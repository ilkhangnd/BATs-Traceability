"use client";

import { FormEvent, useEffect, useState } from "react";
import GoogleMap, { type MapPoint } from "../components/GoogleMap";

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
  const [tab, setTab] = useState<"plots" | "actors" | "anchors" | "audit">("plots");
  const [actors, setActors] = useState<Actor[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [anchorDate, setAnchorDate] = useState(new Date().toISOString().slice(0, 10));
  const [actorForm, setActorForm] = useState(emptyActor);
  const [plotForm, setPlotForm] = useState(emptyPlot);
  const [editingActor, setEditingActor] = useState<string | null>(null);
  const [editingPlot, setEditingPlot] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadAdmin() {
    const [actorData, plotData, logData, anchorData] = await Promise.all([
      request("/admin/actors?pageSize=100"),
      request("/admin/plots?pageSize=100"),
      request("/admin/audit-logs?pageSize=100"),
      request("/admin/anchors")
    ]);
    setActors(actorData.items);
    setPlots(plotData.items);
    setLogs(logData.items);
    setAnchors(anchorData);
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

  if (authenticated === null) {
    return <main className="adminLogin"><div className="loadingMark">Đang kiểm tra phiên đăng nhập…</div></main>;
  }

  if (!authenticated) {
    return (
      <main className="adminLogin">
        <form className="loginCard" onSubmit={login}>
          <span className="adminSeal">B</span>
          <div className="eyebrow">BATS CONTROL CENTER</div>
          <h1>Đăng nhập quản trị</h1>
          <p>Phiên đăng nhập được lưu bằng cookie HttpOnly và được kiểm tra tại backend.</p>
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
        <div><span className="adminSeal small">B</span><strong>Quản Trị BATS</strong></div>
        <nav className="adminNav">
          <button className={tab === "plots" ? "active" : ""} onClick={() => setTab("plots")}>Vùng trồng</button>
          <button className={tab === "actors" ? "active" : ""} onClick={() => setTab("actors")}>Người dùng & quyền</button>
          <button className={tab === "anchors" ? "active" : ""} onClick={() => setTab("anchors")}>Chốt Khóa Blockchain</button>
          <button className={tab === "audit" ? "active" : ""} onClick={() => setTab("audit")}>Lịch sử Kiểm toán</button>
        </nav>
        <small>Đăng nhập: {adminName}</small>
      </aside>

      <section className="adminContent">
        <div className="adminHeading">
          <div><div className="eyebrow">KHÔNG GIAN QUẢN TRỊ BATS</div><h1>{tab === "plots" ? "Vùng trồng" : tab === "actors" ? "Người dùng & quyền" : tab === "anchors" ? "Chốt Khóa Blockchain" : "Lịch sử Kiểm toán"}</h1></div>
          <span>{plots.filter((plot) => plot.status === "active").length} vùng hoạt động</span>
        </div>
        {error && <div className="formError">{error}<button onClick={() => setError("")}>×</button></div>}

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
