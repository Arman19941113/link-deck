// JSON helpers for browser localStorage access.

/** Reads and parses a JSON value from localStorage. */
export function readLocalStorageJsonOrString<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const value = window.localStorage.getItem(key)

    if (!value) {
      return null
    }

    try {
      return JSON.parse(value) as T
    } catch {
      return value as T
    }
  } catch {
    return null
  }
}

/** Serializes a value to JSON and writes it to localStorage. */
export function writeLocalStorageJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Callers treat localStorage as a best-effort cache.
  }
}
