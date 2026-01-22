'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getClient } from '@/lib/supabase/client';
import type { GameResult, Stats } from '../types';
import type { InsertTables } from '@/types/supabase.types';
import { validateGameStatsRow } from '@/lib/validators/database-rows';

// Properly typed insert for game_stats table
type GameStatsInsert = InsertTables<'game_stats'>;

// Sync configuration
const SYNC_INTERVAL = 30 * 1000; // 30 seconds
const MAX_RETRY_ATTEMPTS = 3;
const BASE_RETRY_DELAY = 1000; // 1 second

interface StatsState {
  stats: Stats;
  recentGames: GameResult[];
  userId: string | null;
  isSyncing: boolean;
  isResetting: boolean;
  hasPendingChanges: boolean;
  lastSyncTime: number | null;

  // Actions
  recordGame: (result: Omit<GameResult, 'id' | 'createdAt'>) => void;
  resetStats: () => Promise<boolean>;
  setUserId: (userId: string | null) => void;
  loadFromSupabase: (userId: string) => Promise<void>;
  syncToSupabase: () => Promise<void>;
  startPeriodicSync: () => () => void;
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

// Helper to delay for exponential backoff
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to sync stats to Supabase with retry
async function syncStatsToSupabase(
  userId: string,
  stats: Stats,
  retryCount = 0
): Promise<boolean> {
  const supabase = getClient();

  try {
    const upsertData: GameStatsInsert = {
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
    };

    // Type assertion needed due to Supabase SSR client type inference issue
    // Our GameStatsInsert type matches Database['public']['Tables']['game_stats']['Insert']
    const { error } = await (supabase
      .from('game_stats') as ReturnType<typeof supabase.from>)
      .upsert(upsertData, {
        onConflict: 'user_id,game_type',
      });

    if (error) {
      throw error;
    }
    return true;
  } catch (err) {
    console.error(`Error syncing stats (attempt ${retryCount + 1}):`, err);

    // Retry with exponential backoff
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      const backoffDelay = BASE_RETRY_DELAY * Math.pow(2, retryCount);
      await delay(backoffDelay);
      return syncStatsToSupabase(userId, stats, retryCount + 1);
    }

    return false;
  }
}

// Helper to load stats from Supabase
async function loadStatsFromSupabase(userId: string): Promise<Stats | null> {
  const supabase = getClient();

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
      try {
        const row = validateGameStatsRow(data, 'loadStatsFromSupabase');
        return {
          gamesPlayed: row.games_played,
          gamesWon: row.games_won,
          gamesLost: row.games_lost,
          gamesDraw: row.games_draw,
          winStreak: row.win_streak,
          bestWinStreak: row.best_win_streak,
          totalPlayTime: row.total_play_time,
          byOpponent: row.by_opponent,
        };
      } catch {
        console.error('Invalid game stats data received');
        return null;
      }
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
      isResetting: false,
      hasPendingChanges: false,
      lastSyncTime: null,

      setUserId: (userId) => {
        set({ userId });
        if (userId) {
          get().loadFromSupabase(userId);
        }
      },

      startPeriodicSync: () => {
        const intervalId = setInterval(() => {
          const { userId, hasPendingChanges, isSyncing } = get();
          if (userId && hasPendingChanges && !isSyncing) {
            get().syncToSupabase();
          }
        }, SYNC_INTERVAL);

        // Return cleanup function
        return () => clearInterval(intervalId);
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
        const { userId, stats, isSyncing } = get();
        if (!userId || isSyncing) return;

        set({ isSyncing: true });
        const success = await syncStatsToSupabase(userId, stats);

        set({
          isSyncing: false,
          hasPendingChanges: !success, // Keep pending if sync failed
          lastSyncTime: success ? Date.now() : get().lastSyncTime,
        });
      },

      recordGame: (gameResult) => {
        // Generate UUID - fallback for environments where crypto.randomUUID is not available
        const id = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const createdAt = new Date().toISOString();
        const fullResult: GameResult = { ...gameResult, id, createdAt };

        // Calculate new stats and capture them for sync
        let newStatsForSync: Stats | null = null;

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

          // Capture stats for sync (avoid race condition with get())
          newStatsForSync = newStats;

          return { stats: newStats, recentGames, hasPendingChanges: true };
        });

        // Sync to Supabase using captured stats (not get() which could have changed)
        const { userId } = get();
        if (userId && newStatsForSync) {
          syncStatsToSupabase(userId, newStatsForSync);
        }
      },

      resetStats: async () => {
        const { userId, isResetting } = get();

        // Prevent double reset
        if (isResetting) return false;

        set({ isResetting: true, stats: initialStats, recentGames: [], hasPendingChanges: false });

        // Also reset in Supabase
        if (userId) {
          try {
            const success = await syncStatsToSupabase(userId, initialStats);
            set({ isResetting: false });
            return success;
          } catch (err) {
            console.error('Error resetting stats in Supabase:', err);
            set({ isResetting: false });
            return false;
          }
        }

        set({ isResetting: false });
        return true;
      },
    }),
    {
      name: 'el-rincon-stats',
      partialize: (state) => ({
        stats: state.stats,
        recentGames: state.recentGames,
        hasPendingChanges: state.hasPendingChanges,
        lastSyncTime: state.lastSyncTime,
      }),
      // Handle localStorage errors (quota exceeded, private browsing, etc.)
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.warn('Error rehydrating stats from localStorage:', error);
            // State will use initialStats as fallback
          }
        };
      },
      // Gracefully handle storage errors (with SSR check)
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null;
          try {
            const value = localStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          } catch (error) {
            console.warn('Error reading from localStorage:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          if (typeof window === 'undefined') return;
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.warn('Error writing to localStorage:', error);
            // Silently fail - stats will still work in memory
          }
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return;
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.warn('Error removing from localStorage:', error);
          }
        },
      },
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
