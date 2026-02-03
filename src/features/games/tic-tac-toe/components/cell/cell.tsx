'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CellValue } from '../../types';
import { cn } from '@/lib/utils/cn';
import { XMark } from './x-mark';
import { OMark } from './o-mark';

interface CellProps {
  value: CellValue;
  index: number;
  onClick: (index: number) => void;
  disabled?: boolean;
  isWinningCell?: boolean;
}

// Variants for winning cell animation
const winningCellVariants = {
  idle: { scale: 1 },
  winning: {
    scale: [1, 1.08, 1],
    transition: {
      duration: 0.6,
      repeat: 2,
      ease: [0.4, 0, 0.2, 1] as const
    }
  }
};

export const Cell = memo(function Cell({
  value,
  index,
  onClick,
  disabled = false,
  isWinningCell = false,
}: CellProps) {
  const handleClick = () => {
    if (!disabled && value === null) {
      onClick(index);
    }
  };

  const isClickable = !disabled && value === null;

  return (
    <motion.button
      data-testid="cell"
      className={cn(
        'relative flex items-center justify-center',
        'aspect-square w-full',
        'bg-(--color-surface) rounded-xl',
        'transition-all duration-300',
        'focus:outline-none focus:ring-2 focus:ring-(--color-primary)',
        'min-h-[70px] sm:min-h-[100px] landscape:min-h-0',
        isClickable && [
          'cursor-pointer',
          'hover:bg-(--color-surface-hover)',
          'hover:shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.15)]'
        ],
        disabled && 'cursor-not-allowed opacity-70',
        isWinningCell && [
          'ring-2 ring-(--color-accent)',
          'bg-(--color-accent)/10',
          'shadow-[0_0_25px_rgba(var(--color-primary-rgb),0.3)]'
        ]
      )}
      onClick={handleClick}
      disabled={disabled || value !== null}
      variants={winningCellVariants}
      initial="idle"
      animate={isWinningCell ? 'winning' : 'idle'}
      whileHover={isClickable ? { scale: 1.05 } : undefined}
      whileTap={isClickable ? { scale: 0.95 } : undefined}
      aria-label={
        value ? `Cell ${index + 1}: ${value}` : `Cell ${index + 1}: empty`
      }
    >
      <AnimatePresence mode="wait">
        {value === 'X' && (
          <motion.div
            key={`cell-${index}-x`}
            className="w-[60%] h-[60%]"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <XMark className="w-full h-full" />
          </motion.div>
        )}
        {value === 'O' && (
          <motion.div
            key={`cell-${index}-o`}
            className="w-[60%] h-[60%]"
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <OMark className="w-full h-full" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
});

export default Cell;
