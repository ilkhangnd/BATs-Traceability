import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-montserrat"
});

export const metadata: Metadata = {
  title: "BATS - Nền tảng Truy xuất Nông sản & Trái cây Việt Nam",
  description: "Hệ thống Truy xuất nguồn gốc Nông sản & Trái cây chuẩn quốc tế GS1 EPCIS với bằng chứng blockchain bất biến."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={montserrat.variable}>
      <body className={montserrat.className}>
        <header className="topbar">
          <Link className="brand" href="/">
            <img
              src="/bats-logo.png"
              alt="BATS Traceability"
              style={{ width: "42px", height: "42px", objectFit: "contain" }}
            />
            <span className="brandText">
              <strong>BATS</strong> <span className="brandSub">Traceability</span>
            </span>
          </Link>
          <nav>
            <Link href="/architecture">Kiến trúc</Link>
            <Link href="/admin">Quản trị</Link>
            <Link href="/dashboard/batches">Lô hàng</Link>
            <Link href="/dashboard/plots">Vùng trồng</Link>
            <Link className="navPrimary" href="/verify/8930000000019/SR-20260704-000001/0001">
              Tra cứu QR mẫu
            </Link>
          </nav>
        </header>
        {children}
        <footer className="siteFooter">
          <div>
            <Link className="brand footerBrand" href="/">
              <img
                src="/bats-logo.png"
                alt="BATS Traceability"
                style={{ width: "38px", height: "38px", objectFit: "contain" }}
              />
              <span className="brandText">
                <strong>BATS</strong> <span className="brandSub">Traceability</span>
              </span>
            </Link>
            <p>
              Truy xuất nguồn gốc nông sản & trái cây (Sầu riêng, Xoài Cát, Cà phê, Thanh long, Bưởi...) chuẩn quốc tế GS1, có kiểm chứng thực địa và neo bằng chứng blockchain bất biến.
            </p>
          </div>
          <div className="footerLinks">
            <Link href="/architecture">Kiến trúc hệ thống</Link>
            <Link href="/dashboard/batches">Bảng điều hành chuỗi</Link>
            <Link href="/verify/8930000000019/SR-20260704-000001/0001">Lô mẫu Sầu Riêng</Link>
            <Link href="/verify/8930000000026/XC-20260705-000002/0001">Lô mẫu Xoài Cát</Link>
          </div>
          <span className="footerMeta">MVP Nông sản & Trái cây Việt Nam · Đắk Lắk & ĐBSCL · 2026</span>
        </footer>
      </body>
    </html>
  );
}
