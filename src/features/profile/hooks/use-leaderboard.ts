'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getClient } from '@/lib/supabase/client';
import type { LeaderboardEntry } from '../types';

interface UseLeaderboardOptions {
  limit?: number;
  gameType?: string;
}

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_CACHE_ENTRIES = 20; // Maximum number of cache entries

interface CacheEntry {
  data: LeaderboardEntry[];
  timestamp: number;
}

// In-memory cache (shared across hook instances)
const leaderboardCache = new Map<string, CacheEntry>();

function getCacheKey(gameType: string, limit: number): string {
  return `${gameType}:${limit}`;
}

// Clean up stale entries to prevent memory leak
function cleanupStaleEntries(): void {
  const now = Date.now();
  for (const [key, entry] of leaderboardCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      leaderboardCache.delete(key);
    }
  }
}

// Enforce max cache size (LRU-style: remove oldest entries)
function enforceMaxCacheSize(): void {
  if (leaderboardCache.size <= MAX_CACHE_ENTRIES) return;

  // Convert to array and sort by timestamp (oldest first)
  const entries = Array.from(leaderboardCache.entries())
    .sort((a, b) => a[1].timestamp - b[1].timestamp);

  // Remove oldest entries until we're under the limit
  const entriesToRemove = entries.slice(0, leaderboardCache.size - MAX_CACHE_ENTRIES);
  for (const [key] of entriesToRemove) {
    leaderboardCache.delete(key);
  }
}

function getFromCache(key: string): LeaderboardEntry[] | null {
  const entry = leaderboardCache.get(key);
  if (!entry) return null;

  const isStale = Date.now() - entry.timestamp > CACHE_TTL;
  if (isStale) {
    leaderboardCache.delete(key);
    return null;
  }

  return entry.data;
}

function setCache(key: string, data: LeaderboardEntry[]): void {
  // Clean up stale entries before adding new ones
  cleanupStaleEntries();

  leaderboardCache.set(key, {
    data,
    timestamp: Date.now(),
  });

  // Enforce max cache size
  enforceMaxCacheSize();
}

export function useLeaderboard({ limit = 10, gameType = 'tic-tac-toe' }: UseLeaderboardOptions = {}) {
  const cacheKey = getCacheKey(gameType, limit);
  const cachedData = getFromCache(cacheKey);

  const [entries, setEntries] = useState<LeaderboardEntry[]>(cachedData || []);
  const [isLoading, setIsLoading] = useState(!cachedData);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store AbortController ref for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchLeaderboard = useCallback(async (forceRefresh = false) => {
    const supabase = getClient();
    const currentCacheKey = getCacheKey(gameType, limit);

    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = getFromCache(currentCacheKey);
      if (cached) {
        setEntries(cached);
        setIsLoading(false);
        // Start background revalidation
        setIsRevalidating(true);
      }
    }

    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!getFromCache(currentCacheKey) || forceRefresh) {
      setIsLoading(true);
    }
    setError(null);

    // Create new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Add timeout to prevent hanging
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // First check if game_stats table exists by trying a simple query
      const { error: tableCheckError } = await supabase
        .from('game_stats')
        .select('user_id')
        .limit(1)
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      // If table doesn't exist or there's a permissions issue, show empty state
      if (tableCheckError) {
        setEntries([]);
        setIsLoading(false);
        setIsRevalidating(false);
        return;
      }

      // Fetch leaderboard data using left join to include users without profiles
      const { data, error: fetchError } = await supabase
        .from('game_stats')
        .select(`
          user_id,
          games_played,
          games_won,
          profiles (
            id,
            username,
            avatar_url
          )
        `)
        .eq('game_type', gameType)
        .order('games_won', { ascending: false })
        .limit(limit);

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        const leaderboard: LeaderboardEntry[] = data.map((item: Record<string, unknown>, index: number) => {
          // Handle case where profile might be null (left join)
          const profiles = item.profiles as { id: string; username: string | null; avatar_url: string | null } | null;
          return {
            id: profiles?.id || (item.user_id as string),
            username: profiles?.username || 'Jugador',
            avatarUrl: profiles?.avatar_url || undefined,
            gamesWon: (item.games_won as number) || 0,
            gamesPlayed: (item.games_played as number) || 0,
            winRate: (item.games_played as number) > 0
              ? Math.round(((item.games_won as number) / (item.games_played as number)) * 100)
              : 0,
            rank: index + 1,
          };
        });

        // Update cache
        setCache(currentCacheKey, leaderboard);
        setEntries(leaderboard);
      }
    } catch (err: unknown) {
      // Handle abort/timeout
      if (err instanceof Error && err.name === 'AbortError') {
        // Keep existing data on abort if we have cache
        const cached = getFromCache(currentCacheKey);
        if (!cached) {
          setEntries([]);
        }
      } else {
        console.error('Error fetching leaderboard:', err);
        setError('Error al cargar el ranking');
        // Keep existing cache data on error
        const cached = getFromCache(currentCacheKey);
        if (!cached) {
          setEntries([]);
        }
      }
    } finally {
      setIsLoading(false);
      setIsRevalidating(false);
    }
  }, [limit, gameType]);

  // Force refresh function (bypasses cache)
  const refetch = useCallback(() => {
    return fetchLeaderboard(true);
  }, [fetchLeaderboard]);

  useEffect(() => {
    fetchLeaderboard();

    // Cleanup: abort any pending request when unmounting
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [fetchLeaderboard]);

  return {
    entries,
    isLoading,
    isRevalidating,
    error,
    refetch,
  };
}

// Clear all leaderboard cache (useful after game completion)
export function clearLeaderboardCache(): void {
  leaderboardCache.clear();
}

export default useLeaderboard;
