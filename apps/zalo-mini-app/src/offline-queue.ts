import { HarvestHistoryBatch, markHarvestHistoryStatus, readHarvestHistory } from "./harvest-history.js";
import { fetchWithTimeout } from "./config.js";

export interface QueuedHarvest {
  id: string;
  endpoint: "/batches/harvest" | "/batches/transfer";
  payload: Record<string, unknown>;
  evidenceFiles?: string[];
  createdAt: string;
  attempts: number;
  lastError?: string;
  actorTokenSnapshot?: string;
  localHistoryId?: string;
}

const DATABASE = "bats-offline";
const STORE = "harvest-events";
const FALLBACK_STORAGE_KEY = "bats_fallback_harvest_queue";
const QUEUE_UPDATED_EVENT = "bats-queue-updated";
let memoryQueue: QueuedHarvest[] = [];

function createClientId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 10)}`;
}

function notifyQueueUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(QUEUE_UPDATED_EVENT));
}

function mergeQueueItems(items: QueuedHarvest[]) {
  const byKey = new Map<string, QueuedHarvest>();
  for (const item of items) {
    byKey.set(item.localHistoryId ?? item.id, item);
  }
  return [...byKey.values()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function readFallbackQueue(): QueuedHarvest[] {
  if (typeof window === "undefined") return memoryQueue;
  try {
    const raw = window.localStorage.getItem(FALLBACK_STORAGE_KEY);
    if (!raw) return memoryQueue;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return memoryQueue;
    memoryQueue = parsed;
    return memoryQueue;
  } catch {
    return memoryQueue;
  }
}

function writeFallbackQueue(items: QueuedHarvest[]) {
  memoryQueue = mergeQueueItems(items).slice(0, 100);
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(memoryQueue));
    }
  } catch {
    // Keep the in-memory queue for the active Zalo WebView session.
  } finally {
    notifyQueueUpdated();
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readIndexedDbQueue(): Promise<QueuedHarvest[]> {
  try {
    const database = await openDatabase();
    if (!database.objectStoreNames.contains(STORE)) {
      database.close();
      return [];
    }
    const items = await new Promise<QueuedHarvest[]>((resolve, reject) => {
      const request = database.transaction(STORE).objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return items;
  } catch {
    return [];
  }
}

async function writeIndexedDbQueueItem(item: QueuedHarvest): Promise<boolean> {
  try {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(STORE, "readwrite").objectStore(STORE).put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    database.close();
    notifyQueueUpdated();
    return true;
  } catch {
    return false;
  }
}

async function deleteIndexedDbQueueItem(id: string): Promise<void> {
  try {
    const database = await openDatabase();
    if (database.objectStoreNames.contains(STORE)) {
      await new Promise<void>((resolve, reject) => {
        const request = database.transaction(STORE, "readwrite").objectStore(STORE).delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
    database.close();
  } catch {
    // IndexedDB can be unavailable in Zalo WebView; fallback storage is still cleaned.
  }
}

async function persistQueueItem(item: QueuedHarvest) {
  const wroteIndexedDb = await writeIndexedDbQueueItem(item);
  if (!wroteIndexedDb) {
    const fallback = readFallbackQueue().filter((queued) => (queued.localHistoryId ?? queued.id) !== (item.localHistoryId ?? item.id));
    writeFallbackQueue([item, ...fallback]);
  }
}

function deleteFallbackQueueItem(item: QueuedHarvest) {
  const itemKey = item.localHistoryId ?? item.id;
  writeFallbackQueue(readFallbackQueue().filter((queued) => (queued.localHistoryId ?? queued.id) !== itemKey));
}

export async function readQueuedHarvests(): Promise<QueuedHarvest[]> {
  const indexedDbItems = await readIndexedDbQueue();
  const fallbackItems = readFallbackQueue();
  return mergeQueueItems([...indexedDbItems, ...fallbackItems]);
}

export function filterQueuedHarvestsByActor(items: QueuedHarvest[], actorId?: string): QueuedHarvest[] {
  if (!actorId) return [];
  return items.filter((item) => {
    const payloadActorId = item.payload.actorId;
    return typeof payloadActorId === "string" && payloadActorId === actorId;
  });
}

export async function enqueueHarvest(
  payload: Record<string, unknown>,
  evidenceFiles: string[] = [],
  actorTokenSnapshot?: string,
  localHistoryId?: string,
  endpoint: QueuedHarvest["endpoint"] = "/batches/harvest"
): Promise<QueuedHarvest> {
  const item: QueuedHarvest = {
    id: createClientId(),
    endpoint,
    payload,
    evidenceFiles,
    createdAt: new Date().toISOString(),
    attempts: 0,
    actorTokenSnapshot,
    localHistoryId
  };
  await persistQueueItem(item);
  return item;
}

function buildRecoveredPayload(batch: HarvestHistoryBatch) {
  return {
    id: batch.id,
    batchId: batch.id,
    farmPlotId: batch.plotId,
    actorId: batch.actorId,
    cropType: batch.cropType,
    variety: batch.cropType,
    quantityKg: batch.quantityKg,
    eventTime: batch.createdAt,
    location: { latitude: 12.6789, longitude: 108.1234 },
    evidenceHashes: ["sha256:recovered-local-history"],
    device: {
      deviceId: `ZMP-${batch.actorId}`,
      integrity: "trusted" as const,
      capturedAt: batch.createdAt,
      appVersion: "v2.44.3"
    }
  };
}

function normalizeBatchId(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    const parts = url.pathname.split("/").filter(Boolean);
    const verifyIndex = parts.findIndex((part) => part === "verify");
    if (verifyIndex >= 0 && parts[verifyIndex + 2]) return decodeURIComponent(parts[verifyIndex + 2]!);
    const lotIndex = parts.findIndex((part) => part === "10");
    if (lotIndex >= 0 && parts[lotIndex + 1]) return decodeURIComponent(parts[lotIndex + 1]!);
  } catch {
    // Plain lot IDs are expected for manual entry.
  }
  return raw;
}

function buildQueuedRequest(item: QueuedHarvest, apiBaseUrl: string) {
  if (item.endpoint === "/batches/transfer") {
    const batchId = normalizeBatchId(item.payload.batchId ?? item.payload.sourceBatchId ?? item.payload.lot);
    return {
      url: `${apiBaseUrl}/batches/${encodeURIComponent(batchId)}/transfer`,
      body: {
        status: "collected",
        eventTime: String(item.payload.eventTime ?? new Date().toISOString()),
        actualWeightKg: Number(item.payload.quantityKg ?? item.payload.actualWeightKg ?? 0)
      }
    };
  }

  return {
    url: `${apiBaseUrl}${item.endpoint}`,
    body: item.payload
  };
}

async function readResponseMessage(response: Response) {
  try {
    const data = await response.json();
    const message = data?.message ?? data?.error ?? data?.issues?.[0]?.message;
    if (Array.isArray(message)) return message.join("; ");
    if (typeof message === "string") return message;
    return JSON.stringify(data).slice(0, 180);
  } catch {
    try {
      return (await response.text()).slice(0, 180);
    } catch {
      return `HTTP ${response.status}`;
    }
  }
}

export async function ensureQueueForPendingHistory(actorId?: string, actorTokenSnapshot?: string): Promise<number> {
  const queuedItems = await readQueuedHarvests();
  const queuedHistoryIds = new Set(queuedItems.map((item) => item.localHistoryId).filter(Boolean));
  const missingPendingBatches = readHarvestHistory(actorId).filter((batch) => batch.status === "PENDING_SYNC" && !queuedHistoryIds.has(batch.id));
  for (const batch of missingPendingBatches) {
    await enqueueHarvest(buildRecoveredPayload(batch), [], actorTokenSnapshot, batch.id);
  }
  return missingPendingBatches.length;
}

export async function syncHarvestQueue(apiBaseUrl: string, actorId?: string, currentActorToken?: string): Promise<number> {
  const allItems = await readQueuedHarvests();
  const items = actorId ? filterQueuedHarvestsByActor(allItems, actorId) : allItems;
  let synced = 0;
  for (const item of items) {
    try {
      let evidenceHashes: string[] = Array.isArray(item.payload.evidenceHashes)
        ? (item.payload.evidenceHashes as string[])
        : [];
      if (item.evidenceFiles && item.evidenceFiles.length > 0) {
        const uploadedHashes: string[] = [];
        for (const fileRef of item.evidenceFiles) {
          if (fileRef.startsWith("sha256:")) {
            uploadedHashes.push(fileRef);
            continue;
          }
          try {
            const blobRes = await fetch(fileRef);
            const blob = await blobRes.blob();
            const formData = new FormData();
            formData.append("file", blob, "offline-evidence.jpg");
            const authToken = currentActorToken ?? item.actorTokenSnapshot;
            const uploadRes = await fetchWithTimeout(`${apiBaseUrl}/evidence/upload`, {
              method: "POST",
              headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
              body: formData
            });
            if (uploadRes.ok) {
              const uploadData = (await uploadRes.json()) as { hash?: string; sha256?: string };
              if (uploadData.hash || uploadData.sha256) {
                uploadedHashes.push(`sha256:${uploadData.hash ?? uploadData.sha256}`);
              } else {
                uploadedHashes.push(fileRef);
              }
            } else {
              uploadedHashes.push(fileRef);
            }
          } catch {
            uploadedHashes.push(fileRef);
          }
        }
        if (uploadedHashes.length > 0) {
          evidenceHashes = uploadedHashes;
          item.payload.evidenceHashes = evidenceHashes;
        }
      }

      const headers: Record<string, string> = {
        "content-type": "application/json",
        "x-idempotency-key": item.id
      };
      const authToken = currentActorToken ?? item.actorTokenSnapshot;
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }
      const request = buildQueuedRequest(item, apiBaseUrl);
      const response = await fetchWithTimeout(request.url, {
        method: "POST",
        headers,
        body: JSON.stringify(request.body)
      });
      if (!response.ok) {
        item.attempts = (item.attempts ?? 0) + 1;
        item.lastError = await readResponseMessage(response);
        await persistQueueItem(item);
        continue;
      }
      await deleteIndexedDbQueueItem(item.id);
      deleteFallbackQueueItem(item);
      markHarvestHistoryStatus(item.localHistoryId, "COLLECTED");
      synced += 1;
    } catch {
      item.attempts = (item.attempts ?? 0) + 1;
      item.lastError = "Không kết nối được máy chủ hoặc yêu cầu bị quá thời gian.";
      await persistQueueItem(item);
    }
  }
  notifyQueueUpdated();
  return synced;
}

export function startOnlineSync(apiBaseUrl: string): () => void {
  const handler = () => void syncHarvestQueue(apiBaseUrl);
  window.addEventListener("online", handler);
  return () => window.removeEventListener("online", handler);
}

export async function clearQueuedHarvests(): Promise<void> {
  memoryQueue = [];
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(FALLBACK_STORAGE_KEY);
    }
  } catch {
    // Ignore storage failures; the in-memory queue is already cleared.
  }

  try {
    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase(DATABASE);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    });
  } catch {
    // IndexedDB can be unavailable in Zalo WebView.
  } finally {
    notifyQueueUpdated();
  }
}

export function subscribeQueueChanges(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(QUEUE_UPDATED_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(QUEUE_UPDATED_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}
