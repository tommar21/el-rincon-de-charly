import { describe, it, expect } from 'vitest';
import {
  createInitialBoard,
  createInitialState,
  makeMove,
  isValidMove,
  checkWinner,
  checkDraw,
  getAvailableMoves,
  getNextSymbol,
  countMoves,
  isGameOver,
} from './gameLogic';
import type { BoardState } from '../types';

describe('gameLogic', () => {
  describe('createInitialBoard', () => {
    it('should create an empty 9-cell board', () => {
      const board = createInitialBoard();
      expect(board).toHaveLength(9);
      expect(board.every((cell) => cell === null)).toBe(true);
    });
  });

  describe('createInitialState', () => {
    it('should create initial state with empty board and X as first player', () => {
      const state = createInitialState();
      expect(state.board).toHaveLength(9);
      expect(state.currentSymbol).toBe('X');
    });
  });

  describe('makeMove', () => {
    it('should place a symbol on an empty cell', () => {
      const board = createInitialBoard();
      const newBoard = makeMove(board, 0, 'X');
      expect(newBoard[0]).toBe('X');
    });

    it('should not mutate the original board', () => {
      const board = createInitialBoard();
      const newBoard = makeMove(board, 0, 'X');
      expect(board[0]).toBeNull();
      expect(newBoard[0]).toBe('X');
    });

    it('should throw error when cell is already occupied', () => {
      const board: BoardState = ['X', null, null, null, null, null, null, null, null];
      expect(() => makeMove(board, 0, 'O')).toThrow('Cell 0 is already occupied');
    });

    it('should throw error for invalid cell index', () => {
      const board = createInitialBoard();
      // Note: Out of bounds indices throw errors (either "occupied" or "invalid")
      expect(() => makeMove(board, -1, 'X')).toThrow();
      expect(() => makeMove(board, 9, 'X')).toThrow();
      expect(() => makeMove(board, 100, 'X')).toThrow();
    });
  });

  describe('isValidMove', () => {
    it('should return true for empty cells', () => {
      const board = createInitialBoard();
      expect(isValidMove(board, 0)).toBe(true);
      expect(isValidMove(board, 4)).toBe(true);
      expect(isValidMove(board, 8)).toBe(true);
    });

    it('should return false for occupied cells', () => {
      const board: BoardState = ['X', null, null, null, 'O', null, null, null, null];
      expect(isValidMove(board, 0)).toBe(false);
      expect(isValidMove(board, 4)).toBe(false);
    });

    it('should return false for out of bounds indices', () => {
      const board = createInitialBoard();
      expect(isValidMove(board, -1)).toBe(false);
      expect(isValidMove(board, 9)).toBe(false);
    });
  });

  describe('checkWinner', () => {
    it('should detect horizontal wins', () => {
      // Top row
      const board1: BoardState = ['X', 'X', 'X', null, null, null, null, null, null];
      expect(checkWinner(board1)).toEqual({ winner: 'X', line: [0, 1, 2] });

      // Middle row
      const board2: BoardState = [null, null, null, 'O', 'O', 'O', null, null, null];
      expect(checkWinner(board2)).toEqual({ winner: 'O', line: [3, 4, 5] });

      // Bottom row
      const board3: BoardState = [null, null, null, null, null, null, 'X', 'X', 'X'];
      expect(checkWinner(board3)).toEqual({ winner: 'X', line: [6, 7, 8] });
    });

    it('should detect vertical wins', () => {
      // Left column
      const board1: BoardState = ['X', null, null, 'X', null, null, 'X', null, null];
      expect(checkWinner(board1)).toEqual({ winner: 'X', line: [0, 3, 6] });

      // Middle column
      const board2: BoardState = [null, 'O', null, null, 'O', null, null, 'O', null];
      expect(checkWinner(board2)).toEqual({ winner: 'O', line: [1, 4, 7] });

      // Right column
      const board3: BoardState = [null, null, 'X', null, null, 'X', null, null, 'X'];
      expect(checkWinner(board3)).toEqual({ winner: 'X', line: [2, 5, 8] });
    });

    it('should detect diagonal wins', () => {
      // Main diagonal
      const board1: BoardState = ['X', null, null, null, 'X', null, null, null, 'X'];
      expect(checkWinner(board1)).toEqual({ winner: 'X', line: [0, 4, 8] });

      // Anti diagonal
      const board2: BoardState = [null, null, 'O', null, 'O', null, 'O', null, null];
      expect(checkWinner(board2)).toEqual({ winner: 'O', line: [2, 4, 6] });
    });

    it('should return null when no winner', () => {
      const board1 = createInitialBoard();
      expect(checkWinner(board1)).toBeNull();

      const board2: BoardState = ['X', 'O', 'X', null, null, null, null, null, null];
      expect(checkWinner(board2)).toBeNull();
    });
  });

  describe('checkDraw', () => {
    it('should return true when board is full with no winner', () => {
      const board: BoardState = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
      expect(checkDraw(board)).toBe(true);
    });

    it('should return false when board is not full', () => {
      const board: BoardState = ['X', 'O', 'X', null, null, null, null, null, null];
      expect(checkDraw(board)).toBe(false);
    });

    it('should return false when there is a winner', () => {
      const board: BoardState = ['X', 'X', 'X', 'O', 'O', null, null, null, null];
      expect(checkDraw(board)).toBe(false);
    });
  });

  describe('getAvailableMoves', () => {
    it('should return all indices for empty board', () => {
      const board = createInitialBoard();
      expect(getAvailableMoves(board)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it('should return empty array for full board', () => {
      const board: BoardState = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
      expect(getAvailableMoves(board)).toEqual([]);
    });

    it('should return only empty cell indices', () => {
      const board: BoardState = ['X', null, 'O', null, 'X', null, null, null, 'O'];
      expect(getAvailableMoves(board)).toEqual([1, 3, 5, 6, 7]);
    });
  });

  describe('getNextSymbol', () => {
    it('should return O when current is X', () => {
      expect(getNextSymbol('X')).toBe('O');
    });

    it('should return X when current is O', () => {
      expect(getNextSymbol('O')).toBe('X');
    });
  });

  describe('countMoves', () => {
    it('should return 0 for empty board', () => {
      const board = createInitialBoard();
      expect(countMoves(board)).toBe(0);
    });

    it('should count occupied cells correctly', () => {
      const board: BoardState = ['X', null, 'O', null, 'X', null, null, null, null];
      expect(countMoves(board)).toBe(3);
    });

    it('should return 9 for full board', () => {
      const board: BoardState = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
      expect(countMoves(board)).toBe(9);
    });
  });

  describe('isGameOver', () => {
    it('should return false for empty board', () => {
      const board = createInitialBoard();
      expect(isGameOver(board)).toBe(false);
    });

    it('should return true when there is a winner', () => {
      const board: BoardState = ['X', 'X', 'X', null, null, null, null, null, null];
      expect(isGameOver(board)).toBe(true);
    });

    it('should return true when it is a draw', () => {
      const board: BoardState = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
      expect(isGameOver(board)).toBe(true);
    });

    it('should return false when game is still in progress', () => {
      const board: BoardState = ['X', 'O', null, null, 'X', null, null, null, null];
      expect(isGameOver(board)).toBe(false);
    });
  });
});
