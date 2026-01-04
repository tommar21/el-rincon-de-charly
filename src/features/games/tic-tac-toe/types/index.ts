export type CellValue = 'X' | 'O' | null;

export type BoardState = CellValue[];

export interface TicTacToeState {
  board: BoardState;
  currentSymbol: 'X' | 'O';
}

export interface TicTacToeMove {
  cellIndex: number;
}

export interface WinResult {
  winner: 'X' | 'O';
  line: number[];
}

// Winning combinations for tic-tac-toe
export const WINNING_COMBINATIONS: readonly number[][] = [
  [0, 1, 2], // Top row
  [3, 4, 5], // Middle row
  [6, 7, 8], // Bottom row
  [0, 3, 6], // Left column
  [1, 4, 7], // Middle column
  [2, 5, 8], // Right column
  [0, 4, 8], // Diagonal top-left to bottom-right
  [2, 4, 6], // Diagonal top-right to bottom-left
] as const;
