import { describe, it, expect, beforeEach } from 'vitest';
import { useStatsStore, getWinRate, formatPlayTime } from './statsStore';
import type { Stats } from './statsStore';

describe('statsStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useStatsStore.setState({
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        gamesDraw: 0,
        winStreak: 0,
        bestWinStreak: 0,
        totalPlayTime: 0,
        byOpponent: {},
      },
      recentGames: [],
      userId: null,
      isSyncing: false,
    });
  });

  describe('recordGame', () => {
    it('should record a win correctly', () => {
      const { recordGame } = useStatsStore.getState();

      recordGame({
        gameType: 'tic-tac-toe',
        opponentType: 'ai_easy',
        result: 'win',
        playerSymbol: 'X',
        moves: 5,
        durationSeconds: 30,
      });

      const { stats, recentGames } = useStatsStore.getState();

      expect(stats.gamesPlayed).toBe(1);
      expect(stats.gamesWon).toBe(1);
      expect(stats.gamesLost).toBe(0);
      expect(stats.gamesDraw).toBe(0);
      expect(stats.winStreak).toBe(1);
      expect(stats.bestWinStreak).toBe(1);
      expect(stats.totalPlayTime).toBe(30);
      expect(stats.byOpponent.ai_easy.played).toBe(1);
      expect(stats.byOpponent.ai_easy.won).toBe(1);
      expect(recentGames).toHaveLength(1);
      expect(recentGames[0].result).toBe('win');
    });

    it('should record a loss correctly', () => {
      const { recordGame } = useStatsStore.getState();

      recordGame({
        gameType: 'tic-tac-toe',
        opponentType: 'ai_hard',
        result: 'loss',
        playerSymbol: 'O',
        moves: 6,
        durationSeconds: 45,
      });

      const { stats } = useStatsStore.getState();

      expect(stats.gamesPlayed).toBe(1);
      expect(stats.gamesWon).toBe(0);
      expect(stats.gamesLost).toBe(1);
      expect(stats.winStreak).toBe(0);
      expect(stats.byOpponent.ai_hard.lost).toBe(1);
    });

    it('should record a draw correctly', () => {
      const { recordGame } = useStatsStore.getState();

      recordGame({
        gameType: 'tic-tac-toe',
        opponentType: 'human',
        result: 'draw',
        playerSymbol: 'X',
        moves: 9,
        durationSeconds: 60,
      });

      const { stats } = useStatsStore.getState();

      expect(stats.gamesPlayed).toBe(1);
      expect(stats.gamesDraw).toBe(1);
      expect(stats.byOpponent.human.draw).toBe(1);
    });

    it('should track win streak correctly', () => {
      const { recordGame } = useStatsStore.getState();

      // Win 3 in a row
      for (let i = 0; i < 3; i++) {
        recordGame({
          gameType: 'tic-tac-toe',
          opponentType: 'ai_easy',
          result: 'win',
          playerSymbol: 'X',
          moves: 5,
          durationSeconds: 30,
        });
      }

      let { stats } = useStatsStore.getState();
      expect(stats.winStreak).toBe(3);
      expect(stats.bestWinStreak).toBe(3);

      // Lose one
      recordGame({
        gameType: 'tic-tac-toe',
        opponentType: 'ai_easy',
        result: 'loss',
        playerSymbol: 'X',
        moves: 5,
        durationSeconds: 30,
      });

      stats = useStatsStore.getState().stats;
      expect(stats.winStreak).toBe(0);
      expect(stats.bestWinStreak).toBe(3); // Best should remain

      // Win 2 more
      for (let i = 0; i < 2; i++) {
        recordGame({
          gameType: 'tic-tac-toe',
          opponentType: 'ai_easy',
          result: 'win',
          playerSymbol: 'X',
          moves: 5,
          durationSeconds: 30,
        });
      }

      stats = useStatsStore.getState().stats;
      expect(stats.winStreak).toBe(2);
      expect(stats.bestWinStreak).toBe(3); // Still 3
    });

    it('should not reset win streak on draw', () => {
      const { recordGame } = useStatsStore.getState();

      // Win 2
      recordGame({
        gameType: 'tic-tac-toe',
        opponentType: 'ai_easy',
        result: 'win',
        playerSymbol: 'X',
        moves: 5,
        durationSeconds: 30,
      });
      recordGame({
        gameType: 'tic-tac-toe',
        opponentType: 'ai_easy',
        result: 'win',
        playerSymbol: 'X',
        moves: 5,
        durationSeconds: 30,
      });

      // Draw
      recordGame({
        gameType: 'tic-tac-toe',
        opponentType: 'ai_easy',
        result: 'draw',
        playerSymbol: 'X',
        moves: 9,
        durationSeconds: 60,
      });

      const { stats } = useStatsStore.getState();
      expect(stats.winStreak).toBe(2); // Should remain 2
    });

    it('should keep only last 50 games', () => {
      const { recordGame } = useStatsStore.getState();

      // Record 55 games
      for (let i = 0; i < 55; i++) {
        recordGame({
          gameType: 'tic-tac-toe',
          opponentType: 'ai_easy',
          result: 'win',
          playerSymbol: 'X',
          moves: 5,
          durationSeconds: 30,
        });
      }

      const { recentGames } = useStatsStore.getState();
      expect(recentGames).toHaveLength(50);
    });

    it('should track stats by opponent type', () => {
      const { recordGame } = useStatsStore.getState();

      recordGame({
        gameType: 'tic-tac-toe',
        opponentType: 'ai_easy',
        result: 'win',
        playerSymbol: 'X',
        moves: 5,
        durationSeconds: 30,
      });

      recordGame({
        gameType: 'tic-tac-toe',
        opponentType: 'ai_impossible',
        result: 'loss',
        playerSymbol: 'X',
        moves: 5,
        durationSeconds: 30,
      });

      recordGame({
        gameType: 'tic-tac-toe',
        opponentType: 'online',
        result: 'win',
        playerSymbol: 'X',
        moves: 5,
        durationSeconds: 30,
      });

      const { stats } = useStatsStore.getState();

      expect(stats.byOpponent.ai_easy.won).toBe(1);
      expect(stats.byOpponent.ai_impossible.lost).toBe(1);
      expect(stats.byOpponent.online.won).toBe(1);
    });
  });

  describe('resetStats', () => {
    it('should reset all stats to initial values', () => {
      const { recordGame, resetStats } = useStatsStore.getState();

      // Record some games
      recordGame({
        gameType: 'tic-tac-toe',
        opponentType: 'ai_easy',
        result: 'win',
        playerSymbol: 'X',
        moves: 5,
        durationSeconds: 30,
      });

      resetStats();

      const { stats, recentGames } = useStatsStore.getState();

      expect(stats.gamesPlayed).toBe(0);
      expect(stats.gamesWon).toBe(0);
      expect(stats.winStreak).toBe(0);
      expect(stats.bestWinStreak).toBe(0);
      expect(stats.totalPlayTime).toBe(0);
      expect(Object.keys(stats.byOpponent)).toHaveLength(0);
      expect(recentGames).toHaveLength(0);
    });
  });
});

describe('helper functions', () => {
  describe('getWinRate', () => {
    it('should return 0 for no games played', () => {
      const stats: Stats = {
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        gamesDraw: 0,
        winStreak: 0,
        bestWinStreak: 0,
        totalPlayTime: 0,
        byOpponent: {},
      };
      expect(getWinRate(stats)).toBe(0);
    });

    it('should calculate win rate correctly', () => {
      const stats: Stats = {
        gamesPlayed: 10,
        gamesWon: 7,
        gamesLost: 2,
        gamesDraw: 1,
        winStreak: 0,
        bestWinStreak: 0,
        totalPlayTime: 0,
        byOpponent: {},
      };
      expect(getWinRate(stats)).toBe(70);
    });

    it('should round win rate', () => {
      const stats: Stats = {
        gamesPlayed: 3,
        gamesWon: 1,
        gamesLost: 2,
        gamesDraw: 0,
        winStreak: 0,
        bestWinStreak: 0,
        totalPlayTime: 0,
        byOpponent: {},
      };
      expect(getWinRate(stats)).toBe(33); // 33.33... rounded
    });
  });

  describe('formatPlayTime', () => {
    it('should format seconds', () => {
      expect(formatPlayTime(45)).toBe('45s');
    });

    it('should format minutes', () => {
      expect(formatPlayTime(120)).toBe('2m');
      expect(formatPlayTime(90)).toBe('1m');
    });

    it('should format hours and minutes', () => {
      expect(formatPlayTime(3600)).toBe('1h 0m');
      expect(formatPlayTime(3660)).toBe('1h 1m');
      expect(formatPlayTime(7320)).toBe('2h 2m');
    });
  });
});
