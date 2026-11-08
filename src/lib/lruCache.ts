/** Small LRU cache with per-entry expiry. */
export class LruCache<V> {
  private entries = new Map<string, { value: V; expires: number }>()

  constructor(
    private readonly maxEntries = 100,
    private readonly ttlMs = 10 * 60 * 1000,
  ) {}

  get(key: string): V | undefined {
    const entry = this.entries.get(key)
    if (!entry) return undefined
    if (entry.expires < Date.now()) {
      this.entries.delete(key)
      return undefined
    }
    // Re-insert to mark as most recently used
    this.entries.delete(key)
    this.entries.set(key, entry)
    return entry.value
  }

  set(key: string, value: V) {
    this.entries.delete(key)
    this.entries.set(key, { value, expires: Date.now() + this.ttlMs })
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value
      if (oldest === undefined) break
      this.entries.delete(oldest)
    }
  }

  clear() {
    this.entries.clear()
  }
}
