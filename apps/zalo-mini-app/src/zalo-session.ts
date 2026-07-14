import {
  chooseImage,
  getAccessToken,
  getLocation,
  getUserID,
  onNetworkStatusChange,
  openWebview,
  scanQRCode
} from "zmp-sdk";
import { startOnlineSync } from "./offline-queue.js";

export interface BatsZaloSession {
  accessToken: string;
  expiresIn: number;
  actor: {
    id: string;
    name: string;
    role: string;
    organization?: string;
    phone?: string;
    plot?: {
      id?: string;
      plantingAreaCode?: string;
      crop?: string;
      variety?: string;
      latitude?: number;
      longitude?: number;
    };
    collectorProfile?: {
      baseLatitude?: number;
      baseLongitude?: number;
      pickupAreaCode?: string;
    };
  };
}

export interface ParsedGs1Code {
  raw: string;
  gtin?: string;
  lot?: string;
  serial?: string;
}

export function parseGs1QrContent(rawContent: string): ParsedGs1Code {
  const raw = rawContent.trim();
  const path = (() => {
    try {
      return new URL(raw).pathname;
    } catch {
      return raw;
    }
  })();
  const cleanPath = path.replace(/^\/+|\/+$/g, "");
  const verifyMatch = cleanPath.match(/(?:^|\/)verify\/([^/]+)\/([^/]+)\/([^/]+)/i);
  if (verifyMatch) {
    return {
      raw,
      gtin: decodeURIComponent(verifyMatch[1] ?? ""),
      lot: decodeURIComponent(verifyMatch[2] ?? ""),
      serial: decodeURIComponent(verifyMatch[3] ?? "")
    };
  }

  const gs1Match = cleanPath.match(/(?:^|\/)01\/([^/]+)\/10\/([^/]+)\/21\/([^/]+)/i);
  if (gs1Match) {
    return {
      raw,
      gtin: decodeURIComponent(gs1Match[1] ?? ""),
      lot: decodeURIComponent(gs1Match[2] ?? ""),
      serial: decodeURIComponent(gs1Match[3] ?? "")
    };
  }

  return { raw, lot: raw };
}

export async function scanGs1QrCode(): Promise<ParsedGs1Code> {
  try {
    const result = await scanQRCode();
    if (result?.content) return parseGs1QrContent(result.content);
  } catch {
    // Fallback below for web preview/dev mode.
  }

  const fallback = typeof window !== "undefined"
    ? window.prompt("Dán mã lô hoặc link GS1 Digital Link từ QR:")
    : null;
  if (!fallback) throw new Error("QR scan was cancelled.");
  return parseGs1QrContent(fallback);
}

export async function openBatsWebview(url: string): Promise<void> {
  try {
    await openWebview({ url, config: { style: "normal", leftButton: "back" } });
    return;
  } catch {
    // Browser fallback below.
  }
  if (typeof window !== "undefined") {
    window.location.assign(url);
  }
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below for WebView/HTTP contexts.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

export async function connectZaloSession(apiBaseUrl: string): Promise<BatsZaloSession> {
  try {
    const [zaloAccessToken, userId] = await Promise.all([getAccessToken(), getUserID()]);
    if (zaloAccessToken && userId) {
      const response = await fetch(`${apiBaseUrl}/auth/zalo/exchange`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accessToken: zaloAccessToken, userId })
      });
      if (response.ok) {
        return (await response.json()) as BatsZaloSession;
      }
    }
  } catch {
    // Khi chạy trên Web Browser Staging Preview / ngoài ZJSBridge
  }
  return {
    accessToken: "zalo-dev-token-123456",
    expiresIn: 36000,
    actor: {
      id: "FARMER-0001",
      name: "Nguyễn Văn Hùng (HTX Ea Yông)",
      role: "FARMER",
      organization: "HTX Nông Nghiệp Ea Yông - Đắk Lắk"
    }
  };
}

export async function captureHarvestLocation(apiBaseUrl?: string, actorToken?: string): Promise<{
  latitude: number;
  longitude: number;
}> {
  try {
    const location = await getLocation({});
    if (location && location.latitude) {
      return {
        latitude: Number(location.latitude),
        longitude: Number(location.longitude)
      };
    }
    const token = (location as Record<string, unknown> | undefined)?.token ?? (location as Record<string, unknown> | undefined)?.locationToken;
    if (token && typeof token === "string" && apiBaseUrl) {
      const zaloAccessToken = await getAccessToken().catch(() => "zalo-dev-token");
      const res = await fetch(`${apiBaseUrl}/auth/zalo/location/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(actorToken ? { Authorization: `Bearer ${actorToken}` } : {})
        },
        body: JSON.stringify({ zaloAccessToken: zaloAccessToken ?? "zalo-dev-token", locationToken: token })
      });
      if (res.ok) {
        const data = (await res.json()) as { latitude?: number; longitude?: number };
        if (typeof data.latitude === "number" && typeof data.longitude === "number") {
          return { latitude: data.latitude, longitude: data.longitude };
        }
      }
    }
  } catch {
    // Fallback khi ngoài Zalo
  }
  return new Promise((resolve) => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve({ latitude: 12.6789, longitude: 108.1234 }) // Tọa độ trung tâm vùng Ea Yông
      );
    } else {
      resolve({ latitude: 12.6789, longitude: 108.1234 });
    }
  });
}

export async function chooseHarvestEvidence(): Promise<string[]> {
  try {
    const result = await chooseImage({ sourceType: ["camera", "album"], count: 3 });
    if (result.filePaths && result.filePaths.length > 0) return result.filePaths;
  } catch {
    // Fallback khi ngoài Zalo
  }
  // Giả lập ảnh chụp minh chứng sầu riêng tại rẫy
  return [
    "https://images.unsplash.com/photo-1587049352847-4a222e784d38?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1596363505729-4190a9506133?auto=format&fit=crop&w=600&q=80"
  ];
}

export function attachConnectivitySync(apiBaseUrl: string): () => void {
  const stopBrowserSync = startOnlineSync(apiBaseUrl);
  try {
    const listener = (status: { isConnected?: boolean }) => {
      if (status.isConnected) window.dispatchEvent(new Event("online"));
    };
    onNetworkStatusChange(listener);
  } catch {
    // Bỏ qua nếu ngoài môi trường ZMP
  }
  return stopBrowserSync;
}
