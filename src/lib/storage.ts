const PREFIX = 'keyrush:'

function detectStorage(): boolean {
  try {
    const probe = `${PREFIX}__probe__`
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

export const storageAvailable = typeof window !== 'undefined' && detectStorage()

function storageKey(key: string): string {
  return PREFIX + key
}

/** Reads and parses a JSON value. Returns the fallback when missing or corrupted. */
export function readJSON<T>(key: string, fallback: T): T {
  if (!storageAvailable) return fallback
  try {
    const raw = window.localStorage.getItem(storageKey(key))
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/** Serialises a value to LocalStorage. Returns false when the write failed (quota, private mode). */
export function writeJSON(key: string, value: unknown): boolean {
  if (!storageAvailable) return false
  try {
    window.localStorage.setItem(storageKey(key), JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeKey(key: string): void {
  if (!storageAvailable) return
  try {
    window.localStorage.removeItem(storageKey(key))
  } catch {
    /* ignore */
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
