// JSON helpers for browser localStorage and sessionStorage access.

/** Checks whether a Web Storage object can be written and cleaned up. */
function isWebStorageAvailable(storage: Storage | undefined): storage is Storage {
  if (!storage) {
    return false;
  }

  try {
    const testKey = `link-deck.storage-test.${crypto.randomUUID()}`;

    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);

    return true;
  } catch {
    return false;
  }
}

/** Checks whether localStorage is available in the current browser context. */
export function isLocalStorageAvailable(): boolean {
  return typeof window !== "undefined" && isWebStorageAvailable(window.localStorage);
}

/** Reads and parses a JSON value from localStorage. */
export function getLocalStorage<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(key);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  } catch {
    return null;
  }
}

/** Serializes a value to JSON and writes it to localStorage. */
export function setLocalStorage(key: string, value: unknown): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Callers treat localStorage as a best-effort cache.
  }
}

/** Removes one value from localStorage. */
export function removeLocalStorage(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Removing best-effort cache data should not interrupt app flows.
  }
}

/** Reads and parses a JSON value from sessionStorage. */
export function getSessionStorage<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.sessionStorage.getItem(key);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  } catch {
    return null;
  }
}

/** Serializes a value to JSON and writes it to sessionStorage. */
export function setSessionStorage(key: string, value: unknown): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Callers treat sessionStorage as best-effort browser state.
  }
}

/** Removes one value from sessionStorage. */
export function removeSessionStorage(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Removing best-effort browser state should not interrupt app flows.
  }
}
