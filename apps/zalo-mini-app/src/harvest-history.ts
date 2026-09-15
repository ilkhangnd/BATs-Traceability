export interface HarvestHistoryBatch {
  id: string;
  cropType: string;
  quantityKg: number;
  status: "HARVESTED" | "COLLECTED" | "ANCHORED" | "PENDING_SYNC" | "FAILED_VALIDATION";
  createdAt: string;
  actorId: string;
  plotId: string;
  validationMessage?: string;
}

const STORAGE_KEY = "bats_harvest_history";
const HISTORY_UPDATED_EVENT = "bats-history-updated";
let memoryHistory: HarvestHistoryBatch[] = [];

function notifyHistoryUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(HISTORY_UPDATED_EVENT));
}

function readAllHistory(): HarvestHistoryBatch[] {
  if (typeof window === "undefined") return memoryHistory;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return memoryHistory;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return memoryHistory;
    memoryHistory = parsed;
    return memoryHistory;
  } catch {
    return memoryHistory;
  }
}

function writeAllHistory(items: HarvestHistoryBatch[]) {
  const nextItems = items.slice(0, 100);
  memoryHistory = nextItems;
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
    }
  } catch {
    // Some embedded webviews can reject localStorage writes; keep the in-memory copy for the active session.
  } finally {
    notifyHistoryUpdated();
  }
}

export function readHarvestHistory(actorId?: string): HarvestHistoryBatch[] {
  const items = readAllHistory();
  const filtered = actorId ? items.filter((item) => item.actorId === actorId) : items;
  return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function saveHarvestHistory(batch: HarvestHistoryBatch, replaceId?: string) {
  const items = readAllHistory();
  const withoutDuplicate = items.filter((item) => item.id !== batch.id && item.id !== replaceId);
  writeAllHistory([batch, ...withoutDuplicate].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
}

export function markHarvestHistoryStatus(
  id: string | undefined,
  status: HarvestHistoryBatch["status"],
  validationMessage?: string
) {
  if (!id) return;
  const items = readAllHistory();
  const nextItems = items.map((item) => (
    item.id === id
      ? { ...item, status, ...(validationMessage ? { validationMessage } : {}) }
      : item
  ));
  writeAllHistory(nextItems);
}

export function clearHarvestHistory() {
  memoryHistory = [];
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage failures; the in-memory copy is already cleared.
  } finally {
    notifyHistoryUpdated();
  }
}

export function subscribeHarvestHistory(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(HISTORY_UPDATED_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(HISTORY_UPDATED_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}
