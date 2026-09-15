import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import Link from "next/link";
import { AuthNavigation } from "./components/AuthNavigation";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-montserrat"
});

export const metadata: Metadata = {
  title: "BATS Traceability",
  description: "BATS-AgriGuard: truy xuất nông sản, kiểm tra tính nhất quán vùng trồng và neo bằng chứng phục vụ kiểm toán."
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
              <strong>BATS</strong> <span className="brandSub">Truy xuất nông sản</span>
            </span>
          </Link>
          <nav>
            <Link href="/verify/8930000000019/SR-20260704-000001/0001">Tra cứu QR / mã lô</Link>
            <Link href="/connect">Kết nối chuỗi</Link>
            <Link href="/portal">Dữ liệu đồng bộ</Link>
            <AuthNavigation />
          </nav>
        </header>
        {children}
        <footer className="siteFooter">
          <Link className="brand footerBrand" href="/">
            <img
              src="/bats-logo.png"
              alt="BATS Traceability"
              style={{ width: "42px", height: "42px", objectFit: "contain" }}
            />
            <span className="brandText">
              <strong>BATS</strong> <span className="brandSub">Truy xuất nông sản</span>
            </span>
          </Link>
          <div className="footerLinks">
            <Link href="/verify/8930000000019/SR-20260704-000001/0001">Tra cứu QR / mã lô</Link>
            <Link href="/connect">Kết nối chuỗi</Link>
            <Link href="/portal">Dữ liệu đồng bộ</Link>
            <AuthNavigation footer />
          </div>
        </footer>
      </body>
    </html>
  );
}
