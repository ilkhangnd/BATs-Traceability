"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircleIcon, FilterIcon, MapPinIcon, ScaleIcon, UsersIcon } from "../components/Icons";

type Role = "FARMER" | "COLLECTOR" | "COOPERATIVE" | "ADMIN";
type Profile = { name: string; role: Role; actorId?: string; accessToken?: string };
type Lot = { id: string; crop: string; variety: string; quantityKg: number; status: string; riskBand: string; createdAt: string; plantingAreaCode?: string; province?: string; district?: string; identity: { gtin: string; lot: string; serial: string } };
type ConnectRequest = { id: string; batchId: string; requesterName: string; requesterOrganization?: string; quantityKg: number; proposedPickupDate?: string; note?: string; status: "pending" | "accepted" | "declined"; createdAt: string };
const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const cropLabel: Record<string, string> = { durian: "Sầu riêng", mango: "Xoài", coffee: "Cà phê", dragon_fruit: "Thanh long", pomelo: "Bưởi", longan: "Nhãn", avocado: "Bơ", mangosteen: "Măng cụt" };
const requestLabel = { pending: "Chờ phản hồi", accepted: "Đã chấp nhận", declined: "Không tiếp nhận" };

export default function ConnectPage() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [requests, setRequests] = useState<ConnectRequest[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [query, setQuery] = useState("");
  const [crop, setCrop] = useState("");
  const [selected, setSelected] = useState<Lot | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const authHeaders = useMemo(() => {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (profile?.accessToken) headers.authorization = `Bearer ${profile.accessToken}`;
    return headers;
  }, [profile?.accessToken]);
  const canRequest = profile?.role === "COLLECTOR" || profile?.role === "COOPERATIVE";
  const canRespond = profile?.role === "FARMER" || profile?.role === "COOPERATIVE";

  const loadLots = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (crop) params.set("crop", crop);
      const response = await fetch(`${api}/marketplace/lots?${params.toString()}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message ?? "Không thể tải danh sách lô.");
      setLots(data.items ?? []);
      setError("");
    } catch (loadError) { setError((loadError as Error).message); }
    finally { setLoading(false); }
  }, [crop, query]);

  const loadRequests = useCallback(async (current: Profile | null) => {
    if (!current?.accessToken) return;
    const response = await fetch(`${api}/marketplace/requests`, { headers: { authorization: `Bearer ${current.accessToken}` } });
    const data = await response.json().catch(() => ({}));
    if (response.ok) setRequests(data.items ?? []);
  }, []);

  useEffect(() => {
    try { const saved = localStorage.getItem("bats_current_user"); if (saved) { const current = JSON.parse(saved) as Profile; setProfile(current); void loadRequests(current); } } catch { localStorage.removeItem("bats_current_user"); }
  }, [loadRequests]);
  useEffect(() => { const timer = window.setTimeout(() => void loadLots(), 180); return () => window.clearTimeout(timer); }, [loadLots]);

  async function sendRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !profile?.accessToken) { setError("Hãy đăng nhập bằng tài khoản có quyền gửi yêu cầu kết nối."); return; }
    const form = new FormData(event.currentTarget);
    const response = await fetch(`${api}/marketplace/requests`, { method: "POST", headers: authHeaders, body: JSON.stringify({ batchId: selected.id, quantityKg: Number(form.get("quantityKg")), proposedPickupDate: form.get("pickupDate") || undefined, note: form.get("note") || undefined }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError(data.message ?? "Không thể gửi yêu cầu."); return; }
    setSelected(null); setNotice("Đã gửi yêu cầu. Chủ lô hoặc Hợp tác xã sẽ phản hồi trên Cổng kết nối."); setError(""); await loadRequests(profile);
  }

  async function respond(id: string, status: "accepted" | "declined") {
    if (!profile?.accessToken) return;
    const response = await fetch(`${api}/marketplace/requests/${id}`, { method: "PATCH", headers: authHeaders, body: JSON.stringify({ status }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError(data.message ?? "Không thể cập nhật yêu cầu."); return; }
    setNotice(status === "accepted" ? "Đã chấp nhận yêu cầu. Hai bên có thể tiếp tục xác nhận ngoài hệ thống." : "Đã từ chối yêu cầu."); await loadRequests(profile);
  }

  return <main className="shell connectShell">
    <section className="connectHero"><div><p className="eyebrow">KẾT NỐI CUNG – CẦU</p><h1>Tìm lô đã đồng bộ để bắt đầu trao đổi.</h1><p>Thu hoạch và bàn giao được ghi nhận trên Zalo Mini App. Website chỉ hiển thị lô đã đồng bộ để tra cứu, gửi yêu cầu và theo dõi phản hồi.</p></div><div className="connectHeroFacts"><span><CheckCircleIcon size={18} /> Xem truy xuất trước</span><span><UsersIcon size={18} /> Gửi yêu cầu theo tài khoản</span></div></section>
    <aside className="connectSyncNotice"><ScaleIcon size={19} /><p><strong>Trạng thái hiển thị giống luồng Mini App.</strong> “Đã thu hoạch” là sự kiện từ Nông hộ; “Đã thu gom” xuất hiện sau khi Thương lái ghi Bàn giao. Website không tạo hoặc sửa các sự kiện này.</p></aside>

    <section className="connectToolbar" aria-label="Lọc lô hàng"><label><span>Tìm theo mã lô, vùng hoặc nông sản</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ví dụ: sầu riêng, Đắk Lắk, SR-…" /></label><label><span>Loại nông sản</span><select value={crop} onChange={(event) => setCrop(event.target.value)}><option value="">Tất cả nông sản</option>{Object.entries(cropLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="button secondary" type="button" onClick={() => void loadLots()}><FilterIcon size={16} /> Lọc danh sách</button></section>
    {notice && <div className="notice connectNotice">{notice}</div>}{error && <div className="notice connectError">{error}</div>}

    <section className="connectContent"><div><div className="connectSectionHeading"><div><p className="eyebrow">LÔ CÓ THỂ KẾT NỐI</p><h2>{loading ? "Đang tải lô hàng…" : `${lots.length} lô đang hiển thị`}</h2></div><small>Không công bố tọa độ GPS và bằng chứng nhạy cảm.</small></div><div className="connectLotGrid">{lots.map((lot) => <article className="connectLotCard" key={lot.id}><div className="connectLotTop"><span>{cropLabel[lot.crop] ?? lot.crop}</span><small>{lot.status === "harvested" ? "Mới thu hoạch" : lot.status === "collected" ? "Đã thu gom" : "Đã đóng gói"}</small></div><h3>{lot.variety}</h3><p><MapPinIcon size={15} /> {lot.province ?? "Chưa công bố"}{lot.district ? ` · ${lot.district}` : ""}</p><dl><div><dt>Khối lượng lô</dt><dd>{lot.quantityKg.toLocaleString("vi-VN")} kg</dd></div><div><dt>Mã vùng</dt><dd>{lot.plantingAreaCode ?? "Đang cập nhật"}</dd></div></dl><div className="connectLotActions"><Link href={`/verify/${lot.identity.gtin}/${lot.identity.lot}/${lot.identity.serial}`}>Xem truy xuất</Link>{canRequest ? <button type="button" onClick={() => setSelected(lot)}>Gửi yêu cầu</button> : <Link className="connectRequestLink" href="/login">Đăng nhập để liên hệ</Link>}</div></article>)}{!loading && lots.length === 0 && <div className="connectEmpty"><strong>Chưa có lô phù hợp.</strong><p>Thử thay đổi bộ lọc hoặc quay lại sau khi có sự kiện thu hoạch được đồng bộ.</p></div>}</div></div>
      <aside className="connectRequests"><div><p className="eyebrow">PHẢN HỒI CỦA BẠN</p><h2>{profile ? "Yêu cầu kết nối" : "Đăng nhập để tương tác"}</h2></div>{!profile ? <><p>Đăng nhập để gửi yêu cầu hoặc theo dõi các phản hồi liên quan đến lô hàng của bạn.</p><Link className="button primary" href="/login">Đăng nhập</Link></> : <>{requests.length === 0 ? <p>Chưa có yêu cầu nào. Bạn có thể gửi yêu cầu từ danh sách lô hàng.</p> : <div className="connectRequestList">{requests.map((request) => <article key={request.id}><span className={`connectRequestStatus ${request.status}`}>{requestLabel[request.status]}</span><strong>{request.batchId}</strong><small>{request.requesterName} · {request.quantityKg.toLocaleString("vi-VN")} kg</small>{request.note && <p>{request.note}</p>}{canRespond && request.status === "pending" && <div><button type="button" onClick={() => void respond(request.id, "accepted")}>Chấp nhận</button><button type="button" onClick={() => void respond(request.id, "declined")}>Từ chối</button></div>}</article>)}</div>}</>}</aside></section>
    {selected && <div className="connectModal" role="dialog" aria-modal="true" aria-labelledby="connect-request-title"><form onSubmit={sendRequest}><button className="connectModalClose" type="button" onClick={() => setSelected(null)} aria-label="Đóng biểu mẫu">×</button><p className="eyebrow">GỬI YÊU CẦU KẾT NỐI</p><h2 id="connect-request-title">{selected.id}</h2><p>Đề nghị cho lô {cropLabel[selected.crop] ?? selected.crop} {selected.variety}. Thông tin này là cơ sở để hai bên liên hệ, không phải xác nhận giao dịch.</p><label>Khối lượng mong muốn (kg)<input name="quantityKg" type="number" min="1" max={selected.quantityKg} defaultValue={selected.quantityKg} required /></label><label>Ngày dự kiến nhận hàng<input name="pickupDate" type="date" /></label><label>Nội dung gửi chủ lô<textarea name="note" rows={3} placeholder="Ví dụ: cần nhận trong tuần này, đề nghị trao đổi thêm về đóng gói." /></label><button className="button primary" type="submit">Gửi yêu cầu</button></form></div>}
  </main>;
}
