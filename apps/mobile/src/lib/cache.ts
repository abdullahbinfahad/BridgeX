import AsyncStorage from "@react-native-async-storage/async-storage";
import { APP_CACHE_PREFIX } from "../config";

type Cached<T> = { savedAt: number; data: T };
export type OfflineAction =
  | { id: string; type: "draft"; payload: { key: string; value: unknown }; createdAt: number }
  | { id: string; type: "notification-read"; payload: { notificationId: string }; createdAt: number };

const key = (name: string) => `${APP_CACHE_PREFIX}:${name}`;

export async function cacheSet<T>(name: string, data: T) {
  await AsyncStorage.setItem(key(name), JSON.stringify({ savedAt: Date.now(), data } satisfies Cached<T>));
}

export async function cacheGet<T>(name: string, maxAgeMs = 1000 * 60 * 60 * 24 * 7): Promise<T | null> {
  try {
    const stored = await AsyncStorage.getItem(key(name));
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Cached<T>;
    return Date.now() - parsed.savedAt <= maxAgeMs ? parsed.data : null;
  } catch { return null; }
}

export async function cacheRemove(name: string) { await AsyncStorage.removeItem(key(name)); }

export async function getOfflineQueue(): Promise<OfflineAction[]> { return (await cacheGet<OfflineAction[]>("offline-actions", Number.MAX_SAFE_INTEGER)) ?? []; }

/** Only non-financial, reversible actions are allowed in the offline queue. */
export async function enqueueOfflineAction(action: OfflineAction) {
  const queue = await getOfflineQueue();
  await cacheSet("offline-actions", [...queue.filter(existing => existing.id !== action.id), action]);
}

export async function replaceOfflineQueue(queue: OfflineAction[]) { await cacheSet("offline-actions", queue); }
