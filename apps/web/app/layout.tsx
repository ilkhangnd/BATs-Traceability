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
  title: "BATS Traceability",
  description: "Nền tảng truy xuất nguồn gốc nông sản, quản lý vùng trồng, lô hàng và QR xác thực."
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
              <strong>BATS</strong> <span className="brandSub">Blockchain Agriculture Traceability System</span>
            </span>
          </Link>
          <nav>
            <Link href="/benefits">Giải pháp</Link>
            <Link href="/architecture">Cách hoạt động</Link>
            <Link href="/zalo-mini-app">Đối tượng sử dụng</Link>
            <Link href="/verify/8930000000019/SR-20260704-000001/0001">Tra cứu nguồn gốc</Link>
            <Link href="/about">Tài liệu</Link>
            <Link href="/portal">Cổng Nông hộ</Link>
            <Link className="navPrimary solid" href="/login">Đăng nhập</Link>
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
              Quản lý vùng trồng, lô hàng và hồ sơ QR truy xuất nguồn gốc cho chuỗi nông sản Việt Nam.
            </p>
          </div>
          <div className="footerLinks">
            <Link href="/about">Giới thiệu</Link>
            <Link href="/benefits">Lợi ích</Link>
            <Link href="/zalo-mini-app">Zalo Mini App</Link>
            <Link href="/admin">Quản trị</Link>
            <Link href="/dashboard/batches">Lô hàng</Link>
            <Link href="/dashboard/plots">Vùng trồng</Link>
            <Link href="/architecture">Kiến trúc</Link>
            <Link href="/verify/8930000000019/SR-20260704-000001/0001">QR mẫu</Link>
          </div>
          <span className="footerMeta">BATS Traceability · 2026</span>
        </footer>
      </body>
    </html>
  );
}
