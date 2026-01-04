import type { BoardState, CellValue, TicTacToeState, WinResult } from '../types';
import { WINNING_COMBINATIONS } from '../types';

/**
 * Creates an empty game board
 */
export function createInitialBoard(): BoardState {
  return Array(9).fill(null);
}

/**
 * Creates the initial game state
 */
export function createInitialState(): TicTacToeState {
  return {
    board: createInitialBoard(),
    currentSymbol: 'X',
  };
}

/**
 * Makes a move on the board
 * Returns a new board state (immutable)
 */
export function makeMove(
  board: BoardState,
  cellIndex: number,
  symbol: CellValue
): BoardState {
  if (board[cellIndex] !== null) {
    throw new Error(`Cell ${cellIndex} is already occupied`);
  }
  if (cellIndex < 0 || cellIndex > 8) {
    throw new Error(`Invalid cell index: ${cellIndex}`);
  }

  const newBoard = [...board];
  newBoard[cellIndex] = symbol;
  return newBoard;
}

/**
 * Checks if a move is valid
 */
export function isValidMove(board: BoardState, cellIndex: number): boolean {
  return cellIndex >= 0 && cellIndex <= 8 && board[cellIndex] === null;
}

/**
 * Checks for a winner
 * Returns WinResult if there's a winner, null otherwise
 */
export function checkWinner(board: BoardState): WinResult | null {
  for (const line of WINNING_COMBINATIONS) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return {
        winner: board[a] as 'X' | 'O',
        line: [...line],
      };
    }
  }
  return null;
}

/**
 * Checks if the game is a draw
 * A draw occurs when all cells are filled and there's no winner
 */
export function checkDraw(board: BoardState): boolean {
  return board.every((cell) => cell !== null) && checkWinner(board) === null;
}

/**
 * Gets all available (empty) cell indices
 */
export function getAvailableMoves(board: BoardState): number[] {
  return board
    .map((cell, index) => (cell === null ? index : -1))
    .filter((index) => index !== -1);
}

/**
 * Switches to the next player's symbol
 */
export function getNextSymbol(current: 'X' | 'O'): 'X' | 'O' {
  return current === 'X' ? 'O' : 'X';
}

/**
 * Counts the number of moves made
 */
export function countMoves(board: BoardState): number {
  return board.filter((cell) => cell !== null).length;
}

/**
 * Checks if the game is over (win or draw)
 */
export function isGameOver(board: BoardState): boolean {
  return checkWinner(board) !== null || checkDraw(board);
}
