'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getClient } from '@/lib/supabase/client';
import { createCache, cacheKey } from '@/lib/utils/cache';
import type { LeaderboardEntry } from '../types';
import { leaderboardLogger } from '@/lib/utils/logger';

// Type for the raw leaderboard row from Supabase
interface LeaderboardRow {
  user_id: string;
  games_won: number | null;
  games_played: number | null;
  profiles: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

// Validate and transform a single leaderboard row
function validateAndTransformRow(item: unknown, index: number): LeaderboardEntry | null {
  if (!item || typeof item !== 'object') {
    leaderboardLogger.warn(`Invalid leaderboard row at index ${index}:`, item);
    return null;
  }

  const row = item as Record<string, unknown>;

  // Validate required fields
  if (typeof row.user_id !== 'string') {
    leaderboardLogger.warn(`Missing user_id in leaderboard row ${index}`);
    return null;
  }

  // Handle profile data (can be null from left join)
  const profiles = row.profiles as LeaderboardRow['profiles'];
  const gamesWon = typeof row.games_won === 'number' ? row.games_won : 0;
  const gamesPlayed = typeof row.games_played === 'number' ? row.games_played : 0;

  return {
    id: profiles?.id || row.user_id,
    username: profiles?.username || 'Jugador',
    avatarUrl: profiles?.avatar_url || undefined,
    gamesWon,
    gamesPlayed,
    winRate: gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0,
    rank: index + 1,
  };
}

interface UseLeaderboardOptions {
  limit?: number;
  gameType?: string;
}

// Shared cache instance for leaderboard data
const leaderboardCache = createCache<LeaderboardEntry[]>({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 20,
});

export function useLeaderboard({ limit = 10, gameType = 'tic-tac-toe' }: UseLeaderboardOptions = {}) {
  const key = cacheKey('leaderboard', gameType, limit);
  const cachedData = leaderboardCache.get(key);

  const [entries, setEntries] = useState<LeaderboardEntry[]>(cachedData || []);
  const [isLoading, setIsLoading] = useState(!cachedData);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store AbortController ref for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchLeaderboard = useCallback(async (forceRefresh = false) => {
    const supabase = getClient();
    const currentKey = cacheKey('leaderboard', gameType, limit);

    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = leaderboardCache.get(currentKey);
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

    if (!leaderboardCache.has(currentKey) || forceRefresh) {
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
        // Validate and transform each row, filtering out invalid entries
        const leaderboard = data
          .map((item, index) => validateAndTransformRow(item, index))
          .filter((entry): entry is LeaderboardEntry => entry !== null);

        // Update cache
        leaderboardCache.set(currentKey, leaderboard);
        setEntries(leaderboard);
      }
    } catch (err: unknown) {
      // Handle abort/timeout
      if (err instanceof Error && err.name === 'AbortError') {
        // Keep existing data on abort if we have cache
        if (!leaderboardCache.has(currentKey)) {
          setEntries([]);
        }
      } else {
        leaderboardLogger.error('Error fetching leaderboard:', err);
        setError('Error al cargar el ranking');
        // Keep existing cache data on error
        if (!leaderboardCache.has(currentKey)) {
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
