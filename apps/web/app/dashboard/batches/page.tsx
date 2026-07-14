"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function getCropBadge(batch: Batch): { name: string; icon: string } {
  const id = batch.id || "";
  if (id.startsWith("SR-")) return { name: "Sầu riêng", icon: "🍈" };
  if (id.startsWith("XC-")) return { name: "Xoài Cát", icon: "🥭" };
  if (id.startsWith("CP-")) return { name: "Cà phê", icon: "☕" };
  if (id.startsWith("TL-")) return { name: "Thanh long", icon: "🐲" };
  if (id.startsWith("BD-")) return { name: "Bưởi Da Xanh", icon: "🍊" };
  if (id.startsWith("HY-")) return { name: "Nhãn Lồng", icon: "🍒" };
  if (id.startsWith("LD-")) return { name: "Bơ 034", icon: "🥑" };
  if (id.startsWith("MC-")) return { name: "Măng Cụt", icon: "🟣" };
  return { name: "Nông sản", icon: "🌿" };
}

function getStatusLabel(status: string): string {
  switch (status?.toLowerCase()) {
    case "harvested": return "Đã thu hoạch";
    case "collected": return "Đã thu mua";
    case "packed": return "Đã đóng gói";
    case "shipped": return "Đã xuất hàng";
    case "verified": return "Đã kiểm định";
    default: return status || "Đang xử lý";
  }
}

function getRiskBandLabel(band: string): string {
  switch (band) {
    case "green": return "Tin cậy cao";
    case "yellow": return "Cần kiểm tra";
    case "red": return "Rủi ro cao";
    default: return "Đang đánh giá";
  }
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function load(targetPage = page) {
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        pageSize: "25"
      });
      if (query.trim()) params.set("q", query.trim());
      if (status) params.set("status", status);
      const response = await fetch(`${api}/batches?${params}`);
      if (!response.ok) throw new Error("API chưa sẵn sàng");
      const result = await response.json();
      setBatches(result.items);
      setPage(result.page);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setError("");
    } catch {
      setError("Không kết nối được backend tại cổng 4000.");
    }
  }

  useEffect(() => {
    void load(1);
  }, [query, status]);

  return (
    <main className="shell">
      <div className="pageHeading">
        <div><div className="eyebrow">QUẢN LÝ LÔ HÀNG NÔNG SẢN · TRUY XUẤT NGUỒN GỐC</div><h1>Lô hàng Nông sản & Trái cây</h1></div>
        <button className="button primary" onClick={() => void load(page)}>🌿 Làm mới dữ liệu</button>
      </div>
      <div className="summaryGrid">
        <div className="metric"><span>Tổng số lô</span><strong>{total}</strong><small>Khớp bộ lọc</small></div>
        <div className="metric"><span>Cần xác minh</span><strong>{batches.filter((b) => b.riskBand !== "green").length}</strong><small>Điểm rủi ro &gt; 30</small></div>
        <div className="metric"><span>Khối lượng</span><strong>{batches.reduce((s, b) => s + b.quantityKg, 0).toLocaleString("vi-VN")} kg</strong><small>Đã ghi nhận</small></div>
      </div>
      {error && <div className="notice">{error} Hãy kiểm tra kết nối hệ thống.</div>}
      <section className="panel">
        <div className="panelTitle"><h2>Danh sách lô hàng</h2><span>Cập nhật tự động theo nhật ký thực tế</span></div>
        <div className="filterBar">
          <input
            aria-label="Tìm lô"
            placeholder="Tìm mã lô, GTIN hoặc giống…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            aria-label="Lọc trạng thái"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="harvested">Thu hoạch</option>
            <option value="collected">Thu gom</option>
            <option value="packed">Đóng gói</option>
            <option value="shipped">Xuất hàng</option>
          </select>
        </div>
        <div className="tableWrap">
          <table>
            <thead><tr><th>Mã lô / Sản phẩm</th><th>Giống / Loại</th><th>Khối lượng</th><th>Trạng thái</th><th>Rủi ro</th><th></th></tr></thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={batch.id}>
                  <td>
                    <strong>{batch.id}</strong>
                    <small>{getCropBadge(batch).icon} {getCropBadge(batch).name} · {new Date(batch.createdAt).toLocaleString("vi-VN")}</small>
                  </td>
                  <td>{batch.variety}</td>
                  <td>{batch.quantityKg.toLocaleString("vi-VN")} kg</td>
                  <td><span className="status">{getStatusLabel(batch.status)}</span></td>
                  <td><span className={`risk ${batch.riskBand}`}>{batch.riskScore} · {getRiskBandLabel(batch.riskBand)}</span></td>
                  <td><Link href={`/verify/${batch.identity.gtin}/${batch.identity.lot}/${batch.identity.serial}`}>Xem hồ sơ →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <button
            className="button secondary"
            disabled={page <= 1}
            onClick={() => void load(page - 1)}
          >
            Trang trước
          </button>
          <span>Trang {totalPages === 0 ? 0 : page}/{totalPages}</span>
          <button
            className="button secondary"
            disabled={page >= totalPages}
            onClick={() => void load(page + 1)}
          >
            Trang sau
          </button>
        </div>
      </section>
    </main>
  );
}
