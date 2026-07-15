import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="infoPage">
      <section className="infoHero">
        <div className="eyebrow">Giới thiệu</div>
        <h1>BATS giúp chuỗi nông sản dễ tin hơn.</h1>
        <p>
          BATS Traceability là hệ thống quản lý vùng trồng, lô thu hoạch và hồ sơ QR truy xuất nguồn gốc
          cho nông hộ, hợp tác xã, đơn vị thu mua và người tiêu dùng.
        </p>
        <div className="heroActions">
          <Link className="button primary" href="/admin">Mở quản trị</Link>
          <Link className="button secondary" href="/benefits">Xem lợi ích</Link>
        </div>
      </section>

      <section className="infoGrid">
        <article>
          <span>01</span>
          <h2>Dễ ghi nhận</h2>
          <p>Nông hộ tạo lô, chụp ảnh và lấy GPS bằng Zalo Mini App, kể cả khi mạng yếu.</p>
        </article>
        <article>
          <span>02</span>
          <h2>Dễ quản lý</h2>
          <p>HTX theo dõi vùng trồng, lô hàng, người dùng, trạng thái đồng bộ và nhật ký thao tác.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Dễ kiểm chứng</h2>
          <p>Người mua quét QR để xem hành trình lô hàng, điểm rủi ro và bằng chứng xác thực.</p>
        </article>
      </section>
    </main>
  );
}
