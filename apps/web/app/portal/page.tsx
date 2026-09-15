"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircleIcon, QrIcon, ScaleIcon, SproutIcon, SyncIcon, UsersIcon } from "../components/Icons";

type Role = "FARMER" | "COLLECTOR" | "COOPERATIVE" | "ADMIN";
type Profile = { name: string; actorId?: string; role?: Role };
type EventStatus = "harvested" | "collected" | "packed" | "shipped";
type TraceEvent = { eventTime: string; status: EventStatus };
type Batch = { id: string; variety: string; quantityKg: number; status: EventStatus; riskBand: "green" | "yellow" | "red"; createdAt: string; identity: { gtin: string; lot: string; serial: string }; events: TraceEvent[] };

const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const roleTitle: Record<Role, string> = { FARMER: "Dữ liệu đồng bộ của nông hộ", COLLECTOR: "Dữ liệu đồng bộ của điểm thu mua", COOPERATIVE: "Dữ liệu đồng bộ của Hợp tác xã", ADMIN: "Tổng quan dữ liệu BATS" };
const roleNote: Record<Role, string> = { FARMER: "Bạn ghi Thu hoạch trên Zalo Mini App. Website chỉ cập nhật khi sự kiện được đồng bộ thành công.", COLLECTOR: "Bạn ghi Bàn giao trên Zalo Mini App. Website hiển thị các lô đã có sự kiện của bạn.", COOPERATIVE: "Theo dõi dữ liệu đã đồng bộ để điều phối, tổ chức hồ sơ và phản hồi yêu cầu kết nối.", ADMIN: "Quản trị dữ liệu, vùng trồng và hàng chờ kiểm tra trong khu vực quản trị." };
const statusLabel: Record<EventStatus, string> = { harvested: "Đã thu hoạch", collected: "Đã thu gom", packed: "Đã đóng gói", shipped: "Đã xuất hàng" };

function lastSync(batch: Batch) {
  const last = batch.events?.at(-1)?.eventTime ?? batch.createdAt;
  return new Date(last).toLocaleString("vi-VN");
}

export default function PortalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [online, setOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const role = useMemo<Role>(() => {
    const candidate = (profile?.role ?? searchParams.get("role")?.toUpperCase()) as Role | undefined;
    return candidate && roleTitle[candidate] ? candidate : "FARMER";
  }, [profile?.role, searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    const actorFilter = profile?.actorId && (role === "FARMER" || role === "COLLECTOR") ? `&actorId=${encodeURIComponent(profile.actorId)}` : "";
    try {
      const response = await fetch(`${api}/batches?pageSize=50${actorFilter}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message ?? "Không thể tải dữ liệu đồng bộ.");
      setBatches(data.items ?? []); setOnline(true); setError("");
    } catch {
      setOnline(false); setError("Chưa kết nối được Backend BATS. Hãy khởi động backend hoặc kiểm tra lại đường truyền.");
    } finally { setLoading(false); }
  }, [profile?.actorId, role]);

  useEffect(() => { try { const saved = localStorage.getItem("bats_current_user"); if (saved) setProfile(JSON.parse(saved) as Profile); } catch { localStorage.removeItem("bats_current_user"); } }, []);
  useEffect(() => { void load(); }, [load]);

  const harvested = batches.filter((batch) => batch.status === "harvested").length;
  const collected = batches.filter((batch) => batch.status === "collected").length;
  const reviewed = batches.filter((batch) => batch.riskBand !== "green").length;
  const isAdmin = role === "ADMIN";

  return <main className="shell syncPortalShell">
    <header className="syncPortalHeader"><div><p className="eyebrow">ZALO MINI APP → BATS → WEBSITE</p><h1>{roleTitle[role]}</h1><p>{roleNote[role]}</p></div><div className="syncPortalActions"><span className={`portalSyncNetwork ${online ? "online" : "offline"}`} role="status"><span aria-hidden="true" /> {online ? "Đã kết nối BATS" : "Chưa kết nối"}</span><Link className="button primary" href={isAdmin ? "/admin" : "/connect"}><UsersIcon size={17} />{isAdmin ? "Mở quản trị" : "Mở Kết nối chuỗi"}</Link></div></header>
    {!profile && <aside className="syncPortalGuest"><div><strong>Đang xem dữ liệu mẫu theo vai trò.</strong><p>Đăng nhập để lọc lô hàng và yêu cầu kết nối theo tài khoản của bạn.</p></div><button className="button secondary" type="button" onClick={() => router.push("/login")}>Đăng nhập</button></aside>}
    {error && <div className="notice">{error}</div>}

    <section className="syncPortalFlow"><div><span><SproutIcon size={18} /> Zalo Mini App</span><p>Thu hoạch hoặc Bàn giao</p></div><span className="syncPortalArrow">→</span><div><span><SyncIcon size={18} /> Đồng bộ BATS</span><p>Kiểm tra và lưu sự kiện</p></div><span className="syncPortalArrow">→</span><div><span><QrIcon size={18} /> Website</span><p>Hiển thị, tra cứu, kết nối</p></div></section>

    <section className="summaryGrid syncPortalMetrics"><article className="metric"><span>Lô đã đồng bộ</span><strong>{batches.length}</strong><small>Trong phạm vi đang xem</small></article><article className="metric"><span>Đã thu hoạch</span><strong>{harvested}</strong><small>Chưa có sự kiện thu gom</small></article><article className="metric"><span>Đã thu gom</span><strong>{collected}</strong><small>Đã có Bàn giao trên Mini App</small></article><article className="metric"><span>Cần rà soát</span><strong>{reviewed}</strong><small>Dựa trên luật kiểm tra hiện hành</small></article></section>

    <section className="panel syncPortalTable"><div className="panelTitle"><div><p className="eyebrow">LỊCH SỬ ĐÃ ĐỒNG BỘ</p><h2>Lô hàng và trạng thái mới nhất</h2><p>Dữ liệu chỉ đọc trên website; hãy mở Zalo Mini App để ghi Thu hoạch hoặc Bàn giao.</p></div><button className="button secondary" type="button" onClick={() => void load()} disabled={loading}>{loading ? "Đang tải…" : "Làm mới"}</button></div><div className="tableWrap"><table><thead><tr><th>Mã lô</th><th>Khối lượng</th><th>Trạng thái đồng bộ</th><th>Đồng bộ gần nhất</th><th /></tr></thead><tbody>{batches.slice(0, 10).map((batch) => <tr key={batch.id}><td><strong>{batch.id}</strong><small>{batch.variety}</small></td><td>{Number(batch.quantityKg).toLocaleString("vi-VN")} kg</td><td><span className="status">{statusLabel[batch.status]}</span>{batch.riskBand !== "green" && <small className="syncPortalReview">Cần rà soát</small>}</td><td>{lastSync(batch)}</td><td><Link href={`/verify/${batch.identity.gtin}/${batch.identity.lot}/${batch.identity.serial}`}>Xem truy xuất →</Link></td></tr>)}{!loading && batches.length === 0 && <tr><td colSpan={5}>Chưa có sự kiện nào được đồng bộ trong phạm vi này.</td></tr>}</tbody></table></div></section>
    <aside className="syncPortalFootnote"><CheckCircleIcon size={18} /><p><strong>Nhất quán dữ liệu.</strong> Website không tự tạo sự kiện. Khi Mini App đang ở Hàng chờ vì mất mạng, sự kiện chưa xuất hiện ở đây cho đến khi người dùng bấm Đồng bộ và backend tiếp nhận thành công.</p></aside>
  </main>;
}
