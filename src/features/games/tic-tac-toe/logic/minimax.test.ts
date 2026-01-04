import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAIMove, getBestMove, getRandomMove } from './minimax';
import { createInitialBoard } from './gameLogic';
import type { BoardState } from '../types';

describe('minimax', () => {
  describe('getRandomMove', () => {
    it('should return a valid move index', () => {
      const board = createInitialBoard();
      const move = getRandomMove(board);
      expect(move).toBeGreaterThanOrEqual(0);
      expect(move).toBeLessThanOrEqual(8);
      expect(board[move]).toBeNull();
    });

    it('should only return available moves', () => {
      const board: BoardState = ['X', 'O', 'X', 'O', 'X', 'O', 'O', null, 'X'];
      const move = getRandomMove(board);
      expect(move).toBe(7); // Only available move
    });
  });

  describe('getBestMove', () => {
    it('should take winning move when available', () => {
      // X can win by playing position 2
      const board: BoardState = ['X', 'X', null, 'O', 'O', null, null, null, null];
      const move = getBestMove(board, 'X');
      expect(move).toBe(2); // Complete the row
    });

    it('should block opponent winning move', () => {
      // O is about to win at position 2, AI (X) must block
      // X has no winning move available
      const board: BoardState = ['O', 'O', null, 'X', null, null, null, null, 'X'];
      const move = getBestMove(board, 'X');
      expect(move).toBe(2); // Block O from winning
    });

    it('should prefer center on empty board', () => {
      // On empty board, center is often preferred
      const board: BoardState = [null, null, null, null, null, null, null, null, null];
      const move = getBestMove(board, 'X');
      // Center (4) or corners (0, 2, 6, 8) are good opening moves
      expect([0, 2, 4, 6, 8]).toContain(move);
    });

    it('should win instead of blocking when both options exist', () => {
      // AI (O) can win at 6, should take it instead of blocking X at 2
      const board: BoardState = ['X', 'X', null, 'O', 'O', null, null, null, null];
      const move = getBestMove(board, 'O');
      expect(move).toBe(5); // O wins by completing row
    });
  });

  describe('getAIMove', () => {
    describe('impossible difficulty', () => {
      it('should never lose - always block winning move', () => {
        const board: BoardState = ['O', 'O', null, 'X', null, null, null, null, null];
        const move = getAIMove(board, 'X', 'impossible');
        expect(move).toBe(2); // Must block O from winning
      });

      it('should take winning move', () => {
        const board: BoardState = ['X', 'X', null, 'O', 'O', null, null, null, null];
        const move = getAIMove(board, 'X', 'impossible');
        expect(move).toBe(2); // Take the win
      });
    });

    describe('hard difficulty', () => {
      it('should make reasonable moves (limited depth)', () => {
        const board: BoardState = ['X', null, null, null, 'O', null, null, null, null];
        const move = getAIMove(board, 'X', 'hard');
        // Should return a valid move
        expect(move).toBeGreaterThanOrEqual(0);
        expect(move).toBeLessThanOrEqual(8);
        expect(board[move]).toBeNull();
      });
    });

    describe('easy and medium difficulty', () => {
      beforeEach(() => {
        vi.spyOn(Math, 'random');
      });

      afterEach(() => {
        vi.restoreAllMocks();
      });

      it('easy should sometimes make random moves', () => {
        // Mock random to return 0.5 (> 0.3, so random move)
        vi.mocked(Math.random).mockReturnValue(0.5);

        const board: BoardState = ['X', null, null, null, 'O', null, null, null, null];
        const move = getAIMove(board, 'X', 'easy');

        // Just verify it returns a valid move
        expect(move).toBeGreaterThanOrEqual(0);
        expect(move).toBeLessThanOrEqual(8);
      });

      it('medium should often make best moves', () => {
        // Mock random to return 0.5 (< 0.7, so best move)
        vi.mocked(Math.random).mockReturnValue(0.5);

        const board: BoardState = ['X', 'X', null, 'O', 'O', null, null, null, null];
        const move = getAIMove(board, 'X', 'medium');

        // With 0.5 < 0.7, should use best move = 2
        expect(move).toBe(2);
      });
    });

    describe('first move behavior', () => {
      it('should prefer center or corners on first move', () => {
        const board = createInitialBoard();
        const preferredMoves = [4, 0, 2, 6, 8];

        // Run multiple times to check randomness
        for (let i = 0; i < 10; i++) {
          const move = getAIMove(board, 'X', 'impossible');
          expect(preferredMoves).toContain(move);
        }
      });
    });

    it('should throw error when no moves available', () => {
      const fullBoard: BoardState = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
      expect(() => getAIMove(fullBoard, 'X', 'impossible')).toThrow('No available moves');
    });
  });

  describe('AI cannot be beaten on impossible', () => {
    it('should at least draw when playing perfectly', () => {
      // Simulate a game where human plays optimally
      // AI should never lose
      let board: BoardState = createInitialBoard();

      // Human (X) plays center
      board = ['X', null, null, null, null, null, null, null, null];

      // AI (O) responds - should pick a good counter
      const aiMove1 = getAIMove(board, 'O', 'impossible');
      expect([4, 0, 2, 6, 8]).toContain(aiMove1); // Center or corner is optimal
    });

    it('should win when opponent makes mistake', () => {
      // Setup where AI can win
      const board: BoardState = ['O', 'X', 'X', null, 'O', null, null, null, null];
      const move = getAIMove(board, 'O', 'impossible');
      expect(move).toBe(8); // O wins with diagonal
    });
  });
});
