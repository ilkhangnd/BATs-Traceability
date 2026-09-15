"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

type StoredProfile = { role?: "FARMER" | "COLLECTOR" | "COOPERATIVE" | "ADMIN" };

function readProfile(): StoredProfile | null {
  try {
    const value = localStorage.getItem("bats_current_user");
    return value ? JSON.parse(value) as StoredProfile : null;
  } catch {
    return null;
  }
}

export function AuthNavigation({ footer = false }: { footer?: boolean }) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<StoredProfile | null>(null);

  useEffect(() => {
    const sync = () => setProfile(readProfile());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("bats-auth-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("bats-auth-change", sync);
    };
  }, [pathname]);

  const isAdmin = profile?.role === "ADMIN";
  const href = isAdmin ? "/admin" : profile ? "/portal" : "/login";
  const label = isAdmin ? "Quản trị hệ thống" : profile ? "Quản lý tài khoản" : "Đăng nhập";
  const className = footer ? "footerLogin" : "navPrimary solid";

  return <Link className={className} href={href}>{label}</Link>;
}
