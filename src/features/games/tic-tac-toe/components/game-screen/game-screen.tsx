'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ArrowLeft, Zap } from 'lucide-react';
import { Board } from '../board';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import type { BoardState, WinResult, CellValue } from '../../types';
import type { GameMode } from '../../../registry/types';

interface GameScreenProps {
  board: BoardState;
  currentSymbol: CellValue;
  winner: WinResult | null;
  isGameOver: boolean;
  isAIThinking: boolean;
  mode: GameMode;
  playerSymbol: 'X' | 'O';
  onCellClick: (index: number) => void;
  onRestart: () => void;
  onBackToMenu: () => void;
}

export function GameScreen({
  board,
  currentSymbol,
  winner,
  isGameOver,
  isAIThinking,
  mode,
  playerSymbol,
  onCellClick,
  onRestart,
  onBackToMenu,
}: GameScreenProps) {
  return (
    <div className="game-container flex flex-col items-center justify-center p-4 sm:p-6 landscape:p-2 landscape:gap-2">
      {/* Header */}
      <motion.div
        className="mb-4 sm:mb-8 landscape:mb-2 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl sm:text-4xl landscape:text-xl font-heading font-bold text-(--color-text) mb-2 sm:mb-4 landscape:mb-1">
          Tic Tac Toe
        </h1>

        {/* Game status */}
        <AnimatePresence mode="wait">
          {isGameOver ? (
            <motion.div
              key="gameover"
              initial={{ opacity: 0, scale: 0.5, y: -10 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                transition: {
                  type: 'spring',
                  stiffness: 300,
                  damping: 15,
                  mass: 1
                }
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-xl sm:text-3xl landscape:text-lg font-bold"
            >
              {winner ? (
                <motion.span
                  className={cn(
                    'inline-block',
                    winner.winner === 'X'
                      ? 'text-(--color-primary)'
                      : 'text-(--color-secondary)'
                  )}
                  style={{
                    textShadow: winner.winner === 'X'
                      ? '0 0 20px rgba(var(--color-primary-rgb), 0.5)'
                      : '0 0 20px rgba(var(--color-secondary-rgb), 0.5)'
                  }}
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  {mode === 'ai'
                    ? winner.winner === playerSymbol
                      ? '🎉 Ganaste!'
                      : 'La IA ganó'
                    : `${winner.winner} gana!`}
                </motion.span>
              ) : (
                <motion.span
                  className="text-(--color-accent)"
                  animate={{
                    scale: [1, 1.03, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  ¡Empate!
                </motion.span>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="turn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 text-base sm:text-lg landscape:text-sm"
            >
              {isAIThinking ? (
                <>
                  <Zap className="animate-pulse text-(--color-accent)" size={20} />
                  <span className="text-(--color-text-muted)">IA pensando...</span>
                </>
              ) : (
                <>
                  <span className="text-(--color-text-muted)">Turno de</span>
                  <motion.span
                    key={currentSymbol}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={cn(
                      'font-bold text-2xl',
                      currentSymbol === 'X' ? 'text-(--color-primary)' : 'text-(--color-secondary)'
                    )}
                  >
                    {currentSymbol}
                  </motion.span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Board */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Board
          board={board}
          onCellClick={onCellClick}
          disabled={isGameOver || isAIThinking}
          winningLine={winner?.line}
        />
      </motion.div>

      {/* Controls */}
      <motion.div
        className="mt-4 sm:mt-8 landscape:mt-2 flex gap-2 sm:gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          onClick={onRestart}
          variant="outline"
          className="gap-2"
        >
          <RotateCcw size={18} />
          Reiniciar
        </Button>
        <Button
          onClick={onBackToMenu}
          variant="ghost"
          className="gap-2"
        >
          <ArrowLeft size={18} />
          Menú
        </Button>
      </motion.div>
    </div>
  );
}

export default GameScreen;
