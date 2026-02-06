'use client';

import { forwardRef, memo } from 'react';
import { cn } from '@/lib/utils/cn';
import type { RowCount } from '../../types';
import {
  MULTIPLIERS,
  MULTIPLIER_TEXT_COLORS,
  MULTIPLIER_BG_COLORS,
  MULTIPLIER_TEXT_HEX,
} from '../../engine';

interface PlinkoCanvasProps {
  rows: RowCount;
  highlightedSlot?: number | null;
  className?: string;
}

/**
 * Canvas component for rendering the Plinko board
 * The actual physics rendering is done by the engine, this component
 * just provides the canvas element and renders the multiplier display
 */
export const PlinkoCanvas = forwardRef<HTMLCanvasElement, PlinkoCanvasProps>(
  function PlinkoCanvas({ rows, highlightedSlot, className }, ref) {
    return (
      <div className={cn('relative w-full h-full min-h-[200px] sm:min-h-[280px]', className)}>
        {/* Physics canvas */}
        <canvas
          ref={ref}
          className="absolute inset-0 w-full h-full"
          style={{ touchAction: 'none' }}
        />

        {/* Multiplier display overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none">
          <MultiplierRow rows={rows} highlightedSlot={highlightedSlot} />
        </div>
      </div>
    );
  }
);

interface MultiplierRowProps {
  rows: RowCount;
  highlightedSlot?: number | null;
}

const MultiplierRow = memo(function MultiplierRow({ rows, highlightedSlot }: MultiplierRowProps) {
  const multipliers = MULTIPLIERS[rows];
  const colors = MULTIPLIER_TEXT_COLORS[rows];

  return (
    <div className="flex gap-px sm:gap-0.5 p-0.5 sm:p-1 max-w-full overflow-x-auto">
      {multipliers.map((mult, index) => {
        const colorKey = colors[index];
        const bgColor = MULTIPLIER_BG_COLORS[colorKey];
        const textColor = MULTIPLIER_TEXT_HEX[colorKey];
        const isHighlighted = highlightedSlot === index;

        return (
          <div
            key={index}
            className={cn(
              'flex flex-col items-center justify-end rounded transition-all duration-300',
              'px-0.5 py-0.5 sm:px-1.5 sm:py-1',
              'min-w-[18px] sm:min-w-[28px]',
              'shrink-0',
              isHighlighted && 'scale-105 sm:scale-110 ring-1 sm:ring-2 ring-white shadow-lg'
            )}
            style={{
              backgroundColor: bgColor,
            }}
          >
            {/* Hole indicator - hidden on mobile */}
            <div
              className="hidden sm:block w-2 h-2 rounded-full mb-0.5"
              style={{ backgroundColor: '#191823' }}
            />
            {/* Multiplier value */}
            <span
              className={cn(
                'text-[9px] sm:text-[11px] font-bold transition-all leading-none',
                isHighlighted && 'animate-pulse'
              )}
              style={{ color: textColor }}
            >
              {mult}
            </span>
          </div>
        );
      })}
    </div>
  );
});
