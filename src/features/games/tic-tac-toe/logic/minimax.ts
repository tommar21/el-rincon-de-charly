import type { BoardState, CellValue } from '../types';
import type { AIDifficulty } from '../../common/types/game.types';
import { checkWinner, checkDraw, getAvailableMoves, makeMove } from './gameLogic';

// MinimaxResult type for future use
// interface MinimaxResult {
//   score: number;
//   move: number;
// }

/**
 * Minimax algorithm with alpha-beta pruning
 * Returns the best score for the current player
 */
function minimax(
  board: BoardState,
  depth: number,
  isMaximizing: boolean,
  aiSymbol: CellValue,
  alpha: number,
  beta: number
): number {
  const humanSymbol = aiSymbol === 'X' ? 'O' : 'X';
  const winner = checkWinner(board);

  // Terminal states
  if (winner?.winner === aiSymbol) {
    return 10 - depth; // AI wins (prefer faster wins)
  }
  if (winner?.winner === humanSymbol) {
    return depth - 10; // Human wins (prefer slower losses)
  }
  if (checkDraw(board)) {
    return 0; // Draw
  }

  const availableMoves = getAvailableMoves(board);

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const move of availableMoves) {
      const newBoard = makeMove(board, move, aiSymbol);
      const score = minimax(newBoard, depth + 1, false, aiSymbol, alpha, beta);
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break; // Alpha-beta pruning
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const move of availableMoves) {
      const newBoard = makeMove(board, move, humanSymbol);
      const score = minimax(newBoard, depth + 1, true, aiSymbol, alpha, beta);
      minScore = Math.min(minScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break; // Alpha-beta pruning
    }
    return minScore;
  }
}

/**
 * Gets the best move for the AI using minimax
 */
function getBestMove(board: BoardState, aiSymbol: CellValue): number {
  const availableMoves = getAvailableMoves(board);
  let bestMove = availableMoves[0];
  let bestScore = -Infinity;

  for (const move of availableMoves) {
    const newBoard = makeMove(board, move, aiSymbol);
    const score = minimax(newBoard, 0, false, aiSymbol, -Infinity, Infinity);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

/**
 * Gets a random available move
 */
function getRandomMove(board: BoardState): number {
  const availableMoves = getAvailableMoves(board);
  return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

/**
 * Gets a move with limited depth (for medium difficulty)
 */
function getLimitedDepthMove(board: BoardState, aiSymbol: CellValue, maxDepth: number): number {
  const availableMoves = getAvailableMoves(board);
  let bestMove = availableMoves[0];
  let bestScore = -Infinity;

  for (const move of availableMoves) {
    const newBoard = makeMove(board, move, aiSymbol);
    const score = minimaxLimited(newBoard, 0, false, aiSymbol, -Infinity, Infinity, maxDepth);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function minimaxLimited(
  board: BoardState,
  depth: number,
  isMaximizing: boolean,
  aiSymbol: CellValue,
  alpha: number,
  beta: number,
  maxDepth: number
): number {
  const humanSymbol = aiSymbol === 'X' ? 'O' : 'X';
  const winner = checkWinner(board);

  if (winner?.winner === aiSymbol) return 10 - depth;
  if (winner?.winner === humanSymbol) return depth - 10;
  if (checkDraw(board)) return 0;
  if (depth >= maxDepth) return 0; // Stop at max depth

  const availableMoves = getAvailableMoves(board);

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const move of availableMoves) {
      const newBoard = makeMove(board, move, aiSymbol);
      const score = minimaxLimited(newBoard, depth + 1, false, aiSymbol, alpha, beta, maxDepth);
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const move of availableMoves) {
      const newBoard = makeMove(board, move, humanSymbol);
      const score = minimaxLimited(newBoard, depth + 1, true, aiSymbol, alpha, beta, maxDepth);
      minScore = Math.min(minScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minScore;
  }
}

/**
 * Gets an AI move based on difficulty level
 *
 * - Easy: 30% best move, 70% random
 * - Medium: 70% best move, 30% random
 * - Hard: Limited depth minimax (depth 3)
 * - Impossible: Full minimax (unbeatable)
 */
export function getAIMove(
  board: BoardState,
  aiSymbol: CellValue,
  difficulty: AIDifficulty
): number {
  const availableMoves = getAvailableMoves(board);

  if (availableMoves.length === 0) {
    throw new Error('No available moves');
  }

  if (availableMoves.length === 9) {
    // First move: prefer center or corners for variety
    const preferredMoves = [4, 0, 2, 6, 8];
    return preferredMoves[Math.floor(Math.random() * preferredMoves.length)];
  }

  switch (difficulty) {
    case 'easy': {
      // 30% best move, 70% random
      return Math.random() < 0.3 ? getBestMove(board, aiSymbol) : getRandomMove(board);
    }

    case 'medium': {
      // 70% best move, 30% random
      return Math.random() < 0.7 ? getBestMove(board, aiSymbol) : getRandomMove(board);
    }

    case 'hard': {
      // Limited depth minimax (depth 3)
      return getLimitedDepthMove(board, aiSymbol, 3);
    }

    case 'impossible':
    default: {
      // Full minimax - unbeatable
      return getBestMove(board, aiSymbol);
    }
  }
}

export { getBestMove, getRandomMove };
