import "server-only";

type Entry = { expiresAt: number; value: Promise<unknown> };

const entries = new Map<string, Entry>();

/**
 * Keeps a slow result for a short time. This only saves time: on a platform
 * where the process stops between requests, the app loads the value again.
 */
export function memo<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const entry = entries.get(key);
  if (entry && entry.expiresAt > Date.now()) return entry.value as Promise<T>;
  const value = load();
  entries.set(key, { expiresAt: Date.now() + ttlMs, value });
  // A failure must not stay in the cache.
  value.catch(() => entries.delete(key));
  return value;
}

export function forget(key: string): void {
  entries.delete(key);
}
