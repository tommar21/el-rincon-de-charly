import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../../services/supabase/client';
import type { LeaderboardEntry } from '../components/Leaderboard';

interface UseLeaderboardOptions {
  limit?: number;
  gameType?: string;
}

export function useLeaderboard({ limit = 10, gameType = 'tic-tac-toe' }: UseLeaderboardOptions = {}) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch leaderboard data from Supabase
      // This assumes a 'game_stats' table with aggregated stats per user
      const { data, error: fetchError } = await supabase
        .from('game_stats')
        .select(`
          user_id,
          games_played,
          games_won,
          profiles!inner (
            id,
            username,
            avatar_url
          )
        `)
        .eq('game_type', gameType)
        .order('games_won', { ascending: false })
        .limit(limit);

      if (fetchError) {
        // If the table doesn't exist yet, just show empty state
        if (fetchError.code === '42P01') {
          setEntries([]);
          setIsLoading(false);
          return;
        }
        throw fetchError;
      }

      if (data) {
        const leaderboard: LeaderboardEntry[] = data.map((item: any, index: number) => ({
          id: item.profiles.id,
          username: item.profiles.username || 'Anonymous',
          avatarUrl: item.profiles.avatar_url,
          gamesWon: item.games_won || 0,
          gamesPlayed: item.games_played || 0,
          winRate: item.games_played > 0
            ? Math.round((item.games_won / item.games_played) * 100)
            : 0,
          rank: index + 1,
        }));

        setEntries(leaderboard);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Error al cargar el leaderboard');
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit, gameType]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    entries,
    isLoading,
    error,
    isConfigured: isSupabaseConfigured(),
    refetch: fetchLeaderboard,
  };
}

export default useLeaderboard;
