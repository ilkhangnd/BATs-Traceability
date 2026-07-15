import Link from "next/link";

const steps = [
  "Mở Zalo Mini App BATS",
  "Chọn vùng trồng và nhập sản lượng",
  "Lấy GPS, chụp ảnh bằng chứng",
  "Gửi ngay hoặc lưu hàng chờ khi mất mạng"
];

export default function ZaloMiniAppPage() {
  return (
    <main className="infoPage">
      <section className="infoHero miniAppHero">
        <div className="eyebrow">Zalo Mini App</div>
        <h1>Sổ tay nông hộ nằm ngay trong Zalo.</h1>
        <p>
          Mini App giúp nông dân ghi nhận lô thu hoạch bằng điện thoại quen thuộc, không cần ví crypto,
          không cần cài thêm ứng dụng phức tạp.
        </p>
        <div className="heroActions">
          <Link className="button primary" href="/admin">Admin theo dõi dữ liệu</Link>
          <Link className="button secondary" href="/dashboard/batches">Xem lô đã ghi nhận</Link>
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
        <h2>Khi có mạng, dữ liệu được đồng bộ về BATS Admin.</h2>
        <p>Admin có thể xem lô mới, rủi ro, QR truy xuất và trạng thái blockchain ở một nơi.</p>
      </section>
    </main>
  );
}
