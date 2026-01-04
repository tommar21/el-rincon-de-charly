import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../../../services/supabase/client';

export interface GameResult {
  id: string;
  gameType: string;
  opponentType: 'human' | 'ai_easy' | 'ai_medium' | 'ai_hard' | 'ai_impossible' | 'online';
  result: 'win' | 'loss' | 'draw';
  playerSymbol: 'X' | 'O';
  moves: number;
  durationSeconds: number;
  createdAt: string;
}

export interface Stats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDraw: number;
  winStreak: number;
  bestWinStreak: number;
  totalPlayTime: number; // seconds
  byOpponent: Record<string, {
    played: number;
    won: number;
    lost: number;
    draw: number;
  }>;
}

interface StatsState {
  stats: Stats;
  recentGames: GameResult[];
  userId: string | null;
  isSyncing: boolean;

  // Actions
  recordGame: (result: Omit<GameResult, 'id' | 'createdAt'>) => void;
  resetStats: () => void;
  setUserId: (userId: string | null) => void;
  loadFromSupabase: (userId: string) => Promise<void>;
  syncToSupabase: () => Promise<void>;
}

const initialStats: Stats = {
  gamesPlayed: 0,
  gamesWon: 0,
  gamesLost: 0,
  gamesDraw: 0,
  winStreak: 0,
  bestWinStreak: 0,
  totalPlayTime: 0,
  byOpponent: {},
};

// Helper to sync stats to Supabase
async function syncStatsToSupabase(userId: string, stats: Stats): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase
      .from('game_stats')
      .upsert({
        user_id: userId,
        game_type: 'tic-tac-toe',
        games_played: stats.gamesPlayed,
        games_won: stats.gamesWon,
        games_lost: stats.gamesLost,
        games_draw: stats.gamesDraw,
        win_streak: stats.winStreak,
        best_win_streak: stats.bestWinStreak,
        total_play_time: stats.totalPlayTime,
        by_opponent: stats.byOpponent,
        updated_at: new Date().toISOString(),
      } as never, {
        onConflict: 'user_id,game_type',
      });

    if (error) {
      console.error('Error syncing stats:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error syncing stats:', err);
    return false;
  }
}

// DB row type
interface GameStatsRow {
  id: string;
  user_id: string;
  game_type: string;
  games_played: number;
  games_won: number;
  games_lost: number;
  games_draw: number;
  win_streak: number;
  best_win_streak: number;
  total_play_time: number;
  by_opponent: Record<string, { played: number; won: number; lost: number; draw: number }>;
  updated_at: string;
}

// Helper to load stats from Supabase
async function loadStatsFromSupabase(userId: string): Promise<Stats | null> {
  if (!supabase || !isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('game_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('game_type', 'tic-tac-toe')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No stats found, return null (will use local stats)
        return null;
      }
      console.error('Error loading stats:', error);
      return null;
    }

    if (data) {
      const row = data as unknown as GameStatsRow;
      return {
        gamesPlayed: row.games_played || 0,
        gamesWon: row.games_won || 0,
        gamesLost: row.games_lost || 0,
        gamesDraw: row.games_draw || 0,
        winStreak: row.win_streak || 0,
        bestWinStreak: row.best_win_streak || 0,
        totalPlayTime: row.total_play_time || 0,
        byOpponent: row.by_opponent || {},
      };
    }
    return null;
  } catch (err) {
    console.error('Error loading stats:', err);
    return null;
  }
}

export const useStatsStore = create<StatsState>()(
  persist(
    (set, get) => ({
      stats: initialStats,
      recentGames: [],
      userId: null,
      isSyncing: false,

      setUserId: (userId) => {
        set({ userId });
        if (userId) {
          get().loadFromSupabase(userId);
        }
      },

      loadFromSupabase: async (userId) => {
        set({ isSyncing: true });
        const cloudStats = await loadStatsFromSupabase(userId);

        if (cloudStats) {
          const localStats = get().stats;
          // Merge: use cloud if it has more games, otherwise sync local to cloud
          if (cloudStats.gamesPlayed >= localStats.gamesPlayed) {
            set({ stats: cloudStats, isSyncing: false });
          } else {
            // Local has more games, sync to cloud
            await syncStatsToSupabase(userId, localStats);
            set({ isSyncing: false });
          }
        } else {
          // No cloud stats, sync local to cloud if we have any
          const localStats = get().stats;
          if (localStats.gamesPlayed > 0) {
            await syncStatsToSupabase(userId, localStats);
          }
          set({ isSyncing: false });
        }
      },

      syncToSupabase: async () => {
        const { userId, stats } = get();
        if (userId) {
          await syncStatsToSupabase(userId, stats);
        }
      },

      recordGame: (gameResult) => {
        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        const fullResult: GameResult = { ...gameResult, id, createdAt };

        set((state) => {
          const newStats = { ...state.stats };

          // Update general stats
          newStats.gamesPlayed += 1;
          newStats.totalPlayTime += gameResult.durationSeconds;

          if (gameResult.result === 'win') {
            newStats.gamesWon += 1;
            newStats.winStreak += 1;
            if (newStats.winStreak > newStats.bestWinStreak) {
              newStats.bestWinStreak = newStats.winStreak;
            }
          } else if (gameResult.result === 'loss') {
            newStats.gamesLost += 1;
            newStats.winStreak = 0;
          } else {
            newStats.gamesDraw += 1;
            // Draw doesn't reset win streak
          }

          // Update by opponent stats
          const opponent = gameResult.opponentType;
          if (!newStats.byOpponent[opponent]) {
            newStats.byOpponent[opponent] = { played: 0, won: 0, lost: 0, draw: 0 };
          }
          newStats.byOpponent[opponent].played += 1;
          if (gameResult.result === 'win') {
            newStats.byOpponent[opponent].won += 1;
          } else if (gameResult.result === 'loss') {
            newStats.byOpponent[opponent].lost += 1;
          } else {
            newStats.byOpponent[opponent].draw += 1;
          }

          // Keep only last 50 games
          const recentGames = [fullResult, ...state.recentGames].slice(0, 50);

          return { stats: newStats, recentGames };
        });

        // Sync to Supabase after recording
        const { userId, stats } = get();
        if (userId) {
          syncStatsToSupabase(userId, stats);
        }
      },

      resetStats: () => {
        const { userId } = get();
        set({ stats: initialStats, recentGames: [] });

        // Also reset in Supabase
        if (userId) {
          syncStatsToSupabase(userId, initialStats);
        }
      },
    }),
    {
      name: 'tic-tac-toe-stats',
      partialize: (state) => ({
        stats: state.stats,
        recentGames: state.recentGames
      }),
    }
  )
);

// Helper functions
export function getWinRate(stats: Stats): number {
  if (stats.gamesPlayed === 0) return 0;
  return Math.round((stats.gamesWon / stats.gamesPlayed) * 100);
}

export function formatPlayTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}
