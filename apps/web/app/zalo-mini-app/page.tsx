import Link from "next/link";

const steps = [
  "Mở Zalo Mini App BATS",
  "Chọn vùng trồng đã được phê duyệt và nhập sản lượng",
  "Lấy GPS, chụp ảnh bằng chứng hoặc phiếu cân",
  "Gửi ngay hoặc lưu hàng chờ trên thiết bị khi mất mạng"
];

export default function ZaloMiniAppPage() {
  return (
    <main className="infoPage">
      <section className="infoHero miniAppHero">
        <div className="eyebrow">Zalo Mini App</div>
        <h1>Sổ tay nông hộ nằm ngay trong Zalo.</h1>
        <p>
          Mini App hỗ trợ nông dân ghi nhận thu hoạch và thương lái ghi nhận bàn giao bằng điện thoại quen thuộc.
          Website chỉ hiển thị sự kiện sau khi dữ liệu được đồng bộ và kiểm tra theo các luật áp dụng.
        </p>
        <div className="heroActions">
          <Link className="button primary" href="/portal">Theo dõi dữ liệu đã đồng bộ</Link>
          <Link className="button secondary" href="/admin">Quản trị vùng trồng</Link>
        </div>
      </section>

      <section className="miniAppSteps">
        {steps.map((step, index) => (
          <article key={step}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h2>{step}</h2>
          </article>
        ))}
      </section>

      <section className="infoCta">
        <h2>Khi có mạng, dữ liệu được đồng bộ về BATS-AgriGuard.</h2>
        <p>Website hiển thị lịch sử lô, trạng thái thu hoạch/bàn giao, bằng chứng đã gửi và hồ sơ QR. Hàng chờ offline vẫn nằm trên thiết bị Zalo cho đến khi gửi thành công.</p>
      </section>
    </main>
  );
}
