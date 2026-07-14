const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);
const rawApiBaseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_PUBLIC_API_URL || "/api";

function normalizeApiBaseUrl(value: string) {
  const trimmed = value.replace(/\/$/, "");
  if (typeof window === "undefined") return trimmed;

  try {
    const apiUrl = new URL(trimmed, window.location.origin);
    const appIsLocal = LOCAL_HOSTS.has(window.location.hostname);
    const apiIsLocal = LOCAL_HOSTS.has(apiUrl.hostname);
    if (apiIsLocal && !appIsLocal) return "/api";
  } catch {
    // Relative URLs are fine for the Zalo Mini App runtime.
  }

  return trimmed;
}

export const API_BASE_URL = normalizeApiBaseUrl(rawApiBaseUrl);
export const REQUEST_TIMEOUT_MS = 4500;

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<Response> {
  if (typeof AbortController === "undefined") {
    return fetch(input, init);
  }

  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: init.signal ?? controller.signal });
  } finally {
    globalThis.clearTimeout(timer);
  }
}
