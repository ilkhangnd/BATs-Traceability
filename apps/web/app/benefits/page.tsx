import Link from "next/link";

const benefits = [
  ["Nông hộ", "Ghi nhận thu hoạch nhanh hơn, giảm ghi chép giấy và không cần hiểu blockchain."],
  ["Hợp tác xã", "Quản lý vùng trồng, sản lượng, người dùng và dữ liệu từ Zalo Mini App tập trung."],
  ["Đơn vị thu mua", "Đối chiếu lô, nguồn gốc và bằng chứng trước khi đóng gói hoặc xuất hàng."],
  ["Người tiêu dùng", "Quét QR để xem thông tin nguồn gốc rõ ràng, dễ đọc và đáng tin hơn."]
];

export default function BenefitsPage() {
  return (
    <main className="infoPage">
      <section className="infoHero">
        <div className="eyebrow">Lợi ích</div>
        <h1>Một luồng dữ liệu, nhiều bên cùng hưởng lợi.</h1>
        <p>
          BATS không chỉ là một dashboard. Hệ thống giúp giảm sai sót nhập liệu, tăng minh bạch và
          tạo nền dữ liệu phục vụ truy xuất, kiểm định và nghiên cứu.
        </p>
      </section>

      <section className="benefitList">
        {benefits.map(([title, text]) => (
          <article key={title}>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="infoCta">
        <h2>Muốn xem cách hệ thống vận hành?</h2>
        <Link className="button primary" href="/architecture">Xem kiến trúc</Link>
      </section>
    </main>
  );
}
