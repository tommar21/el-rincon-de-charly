/**
 * Generic in-memory cache with TTL and LRU eviction.
 * Use for client-side caching of API responses and computed data.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface CacheOptions {
  /** Time-to-live in milliseconds (default: 5 minutes) */
  ttl?: number;
  /** Maximum number of cache entries (default: 20) */
  maxSize?: number;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MAX_SIZE = 20;

/**
 * Creates a typed in-memory cache with TTL and LRU eviction.
 *
 * @example
 * ```ts
 * // Create a cache for leaderboard data
 * const leaderboardCache = createCache<LeaderboardEntry[]>({ ttl: 5 * 60 * 1000 });
 *
 * // Set data
 * leaderboardCache.set('tic-tac-toe:10', entries);
 *
 * // Get data (returns null if expired or not found)
 * const cached = leaderboardCache.get('tic-tac-toe:10');
 *
 * // Clear all entries
 * leaderboardCache.clear();
 * ```
 */
export function createCache<T>(options: CacheOptions = {}) {
  const { ttl = DEFAULT_TTL, maxSize = DEFAULT_MAX_SIZE } = options;
  const cache = new Map<string, CacheEntry<T>>();

  /**
   * Clean up stale entries to prevent memory leak
   */
  function cleanupStaleEntries(): void {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > ttl) {
        cache.delete(key);
      }
    }
  }

  /**
   * Enforce max cache size (LRU-style: remove oldest entries)
   */
  function enforceMaxSize(): void {
    if (cache.size <= maxSize) return;

    // Convert to array and sort by timestamp (oldest first)
    const entries = Array.from(cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Remove oldest entries until we're under the limit
    const entriesToRemove = entries.slice(0, cache.size - maxSize);
    for (const [key] of entriesToRemove) {
      cache.delete(key);
    }
  }

  return {
    /**
     * Get a value from the cache.
     * Returns null if not found or expired.
     */
    get(key: string): T | null {
      const entry = cache.get(key);
      if (!entry) return null;

      const isStale = Date.now() - entry.timestamp > ttl;
      if (isStale) {
        cache.delete(key);
        return null;
      }

      return entry.data;
    },

    /**
     * Set a value in the cache.
     * Automatically cleans up stale entries and enforces max size.
     */
    set(key: string, data: T): void {
      // Clean up stale entries before adding new ones
      cleanupStaleEntries();

      cache.set(key, {
        data,
        timestamp: Date.now(),
      });

      // Enforce max cache size
      enforceMaxSize();
    },

    /**
     * Check if a key exists and is not expired
     */
    has(key: string): boolean {
      return this.get(key) !== null;
    },

    /**
     * Delete a specific key from the cache
     */
    delete(key: string): boolean {
      return cache.delete(key);
    },

    /**
     * Clear all entries from the cache
     */
    clear(): void {
      cache.clear();
    },

    /**
     * Get the current size of the cache
     */
    get size(): number {
      return cache.size;
    },

    /**
     * Get all keys in the cache (including potentially stale ones)
     */
    keys(): string[] {
      return Array.from(cache.keys());
    },
  };
}

/**
 * Helper to generate composite cache keys
 *
 * @example
 * ```ts
 * const key = cacheKey('leaderboard', gameType, limit);
 * // Returns: "leaderboard:tic-tac-toe:10"
 * ```
 */
export function cacheKey(...parts: (string | number)[]): string {
  return parts.join(':');
}
