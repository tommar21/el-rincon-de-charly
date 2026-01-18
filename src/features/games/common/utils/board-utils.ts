import type { BoardState } from '../../tic-tac-toe/types';

/**
 * Convert string array from DB to BoardState
 * DB stores: '' for empty, 'X' for X, 'O' for O
 * App uses: null for empty, 'X' for X, 'O' for O
 */
export function dbBoardToBoardState(dbBoard: string[]): BoardState {
  return dbBoard.map(cell => {
    if (cell === 'X') return 'X';
    if (cell === 'O') return 'O';
    return null;
  }) as BoardState;
}

/**
 * Convert BoardState to string array for DB
 * App uses: null for empty, 'X' for X, 'O' for O
 * DB stores: '' for empty, 'X' for X, 'O' for O
 */
export function boardStateToDbBoard(board: BoardState): string[] {
  return board.map(cell => cell || '');
}
