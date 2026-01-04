import { motion } from 'framer-motion';
import type { CellValue } from '../../types';
import { cn } from '../../../../../lib/utils';
import { XMark } from './XMark';
import { OMark } from './OMark';

interface CellProps {
  value: CellValue;
  index: number;
  onClick: (index: number) => void;
  disabled?: boolean;
  isWinningCell?: boolean;
}

export function Cell({
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

  return (
    <motion.button
      data-testid="cell"
      className={cn(
        'relative flex items-center justify-center',
        'aspect-square w-full',
        'bg-[var(--color-surface)] rounded-lg',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]',
        'min-h-[80px] sm:min-h-[100px]',
        !disabled && value === null && 'hover:bg-[var(--color-surface)]/80 cursor-pointer',
        disabled && 'cursor-not-allowed opacity-80',
        isWinningCell && 'ring-2 ring-[var(--color-accent)]'
      )}
      onClick={handleClick}
      disabled={disabled || value !== null}
      whileHover={!disabled && value === null ? { scale: 1.02 } : undefined}
      whileTap={!disabled && value === null ? { scale: 0.98 } : undefined}
      aria-label={
        value ? `Cell ${index + 1}: ${value}` : `Cell ${index + 1}: empty`
      }
    >
      {value === 'X' && (
        <motion.div
          className="w-[60%] h-[60%]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <XMark className="w-full h-full" />
        </motion.div>
      )}
      {value === 'O' && (
        <motion.div
          className="w-[60%] h-[60%]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <OMark className="w-full h-full" />
        </motion.div>
      )}

      {/* Winning cell glow effect */}
      {isWinningCell && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            background: `radial-gradient(circle, var(--color-accent) 0%, transparent 70%)`,
          }}
        />
      )}
    </motion.button>
  );
}

export default Cell;
