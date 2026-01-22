'use client';

import { motion } from 'framer-motion';
import type { BoardState } from '../../types';
import { Cell } from '../cell';
import { cn } from '@/lib/utils/cn';

interface BoardProps {
  board: BoardState;
  onCellClick: (index: number) => void;
  disabled?: boolean;
  winningLine?: number[] | null;
  className?: string;
}

export function Board({
  board,
  onCellClick,
  disabled = false,
  winningLine = null,
  className = '',
}: BoardProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const cellVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <motion.div
      data-testid="board"
      className={cn(
        'relative grid grid-cols-3 gap-2 sm:gap-3 p-3 sm:p-4',
        'bg-(--color-surface)/50 rounded-xl',
        'backdrop-blur-sm',
        'w-[min(90vw,340px)] sm:w-[360px]',
        className
      )}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {board.map((cell, index) => (
        <motion.div key={`cell-${index}`} variants={cellVariants}>
          <Cell
            value={cell}
            index={index}
            onClick={onCellClick}
            disabled={disabled}
            isWinningCell={winningLine?.includes(index) ?? false}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

export default Board;
