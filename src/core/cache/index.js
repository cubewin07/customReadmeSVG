/**
 * In-memory cache implementation
 */
export class MemoryCache {
  constructor(defaultTtlMs = 3600000) {
    this.defaultTtlMs = defaultTtlMs;
    this.store = new Map();
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    const expiresAt = ttlMs ? Date.now() + ttlMs : null;
    this.store.set(key, { value, expiresAt });
  }

  has(key) {
    return this.get(key) !== null;
  }

  clear() {
    this.store.clear();
  }
}

/**
 * LocalStorage cache implementation (for browser environment)
 */
export class LocalStorageCache {
  constructor(defaultTtlMs = 3600000) {
    this.defaultTtlMs = defaultTtlMs;
  }

  get(key) {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const { value, expiresAt } = JSON.parse(raw);
      if (expiresAt && Date.now() > expiresAt) {
        localStorage.removeItem(key);
        return null;
      }
      return value;
    } catch {
      return null;
    }
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    if (typeof localStorage === 'undefined') return;
    try {
      const expiresAt = ttlMs ? Date.now() + ttlMs : null;
      localStorage.setItem(key, JSON.stringify({ value, expiresAt }));
    } catch {
      // Ignore storage errors / quota exceptions
    }
  }

  has(key) {
    return this.get(key) !== null;
  }

  clear() {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  }
}

/**
 * Factory function to create a cache instance
 * @param {object} options
 * @param {'memory'|'localStorage'} [options.kind='memory']
 * @param {number} [options.ttlMs=3600000]
 */
export function createCache({ kind = 'memory', ttlMs = 3600000 } = {}) {
  if (kind === 'localStorage' && typeof localStorage !== 'undefined') {
    return new LocalStorageCache(ttlMs);
  }
  return new MemoryCache(ttlMs);
}
