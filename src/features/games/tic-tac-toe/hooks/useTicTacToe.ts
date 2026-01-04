import { useState, useCallback, useEffect, useRef } from 'react';
import type { BoardState, CellValue, WinResult } from '../types';
import type { GameMode, AIDifficulty, Player } from '../../common/types/game.types';
import {
  createInitialBoard,
  makeMove,
  checkWinner,
  checkDraw,
  isValidMove,
  getNextSymbol,
} from '../logic/gameLogic';
import { getAIMove } from '../logic/minimax';

export interface UseTicTacToeOptions {
  mode: GameMode;
  playerSymbol?: 'X' | 'O';
  aiDifficulty?: AIDifficulty;
  onGameEnd?: (winner: Player | null, isDraw: boolean) => void;
}

export interface UseTicTacToeReturn {
  board: BoardState;
  currentSymbol: 'X' | 'O';
  winner: WinResult | null;
  isDraw: boolean;
  isGameOver: boolean;
  isAIThinking: boolean;
  makePlayerMove: (cellIndex: number) => void;
  resetGame: () => void;
  gameHistory: BoardState[];
}

export function useTicTacToe({
  mode,
  playerSymbol = 'X',
  aiDifficulty = 'medium',
  onGameEnd,
}: UseTicTacToeOptions): UseTicTacToeReturn {
  const [board, setBoard] = useState<BoardState>(createInitialBoard);
  const [currentSymbol, setCurrentSymbol] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<WinResult | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [gameHistory, setGameHistory] = useState<BoardState[]>([]);

  // Ref to track if AI move is being processed (fixes StrictMode double-execution)
  const aiMoveInProgressRef = useRef(false);

  const isGameOver = winner !== null || isDraw;
  const aiSymbol = playerSymbol === 'X' ? 'O' : 'X';
  const isAITurn = mode === 'ai' && currentSymbol === aiSymbol && !isGameOver;

  // Reset game
  const resetGame = useCallback(() => {
    setBoard(createInitialBoard());
    setCurrentSymbol('X');
    setWinner(null);
    setIsDraw(false);
    setIsAIThinking(false);
    setGameHistory([]);
    aiMoveInProgressRef.current = false;
  }, []);

  // Make a move (for both player and AI)
  const executeMove = useCallback(
    (cellIndex: number, symbol: CellValue) => {
      if (!isValidMove(board, cellIndex) || isGameOver) {
        return false;
      }

      const newBoard = makeMove(board, cellIndex, symbol);
      setBoard(newBoard);
      setGameHistory((prev) => [...prev, newBoard]);

      // Check for winner
      const winResult = checkWinner(newBoard);
      if (winResult) {
        setWinner(winResult);
        if (onGameEnd) {
          const winnerPlayer: Player = {
            id: winResult.winner,
            name: winResult.winner === playerSymbol ? 'You' : 'AI',
            isAI: winResult.winner !== playerSymbol,
          };
          onGameEnd(winnerPlayer, false);
        }
        return true;
      }

      // Check for draw
      if (checkDraw(newBoard)) {
        setIsDraw(true);
        if (onGameEnd) {
          onGameEnd(null, true);
        }
        return true;
      }

      // Switch turn
      setCurrentSymbol(getNextSymbol(symbol as 'X' | 'O'));
      return true;
    },
    [board, isGameOver, onGameEnd, playerSymbol]
  );

  // Player makes a move
  const makePlayerMove = useCallback(
    (cellIndex: number) => {
      if (isAIThinking || isAITurn) {
        return; // Don't allow moves during AI's turn
      }

      if (mode === 'ai' && currentSymbol !== playerSymbol) {
        return; // Not player's turn in AI mode
      }

      executeMove(cellIndex, currentSymbol);
    },
    [isAIThinking, isAITurn, mode, currentSymbol, playerSymbol, executeMove]
  );

  // AI makes a move
  useEffect(() => {
    // Use ref to prevent double-execution in StrictMode
    if (!isAITurn || aiMoveInProgressRef.current) {
      return;
    }

    aiMoveInProgressRef.current = true;
    setIsAIThinking(true);

    // Add a small delay to make AI feel more natural
    const delay = aiDifficulty === 'easy' ? 300 : aiDifficulty === 'medium' ? 500 : 700;

    const timeoutId = setTimeout(() => {
      const aiMove = getAIMove(board, aiSymbol, aiDifficulty);
      executeMove(aiMove, aiSymbol);
      setIsAIThinking(false);
      aiMoveInProgressRef.current = false;
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      // Don't reset the ref here - it will be reset when the AI actually moves
    };
  }, [isAITurn, board, aiSymbol, aiDifficulty, executeMove]);

  return {
    board,
    currentSymbol,
    winner,
    isDraw,
    isGameOver,
    isAIThinking,
    makePlayerMove,
    resetGame,
    gameHistory,
  };
}

export default useTicTacToe;
