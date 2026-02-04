'use client';

import { useState, useCallback } from 'react';
import { Coins, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { formatBalance } from '@/features/wallet/store/wallet-store';
import { MIN_BALL_COUNT, MAX_BALL_COUNT, type BallCount } from '../../hooks/use-plinko-game';
import type { RowCount, BallSpeed } from '../../types';
import { SPEED_CONFIG } from '../../engine/physics-config';

const SPEED_OPTIONS: BallSpeed[] = ['slow', 'normal', 'fast'];

type TabType = 'bet' | 'config';

interface BetControlsProps {
  betAmount: number;
  ballCount: BallCount;
  balance: number;
  rows: RowCount;
  speed: BallSpeed;
  isDropping: boolean;
  isAuthenticated: boolean;
  onBetChange: (amount: number) => void;
  onBallCountChange: (count: BallCount) => void;
  onRowsChange: (rows: RowCount) => void;
  onSpeedChange: (speed: BallSpeed) => void;
  onDrop: () => void;
}

export function BetControls({
  betAmount,
  ballCount,
  balance,
  rows,
  speed,
  isDropping,
  isAuthenticated,
  onBetChange,
  onBallCountChange,
  onRowsChange,
  onSpeedChange,
  onDrop,
}: BetControlsProps) {
  const [inputValue, setInputValue] = useState(betAmount.toString());
  const [activeTab, setActiveTab] = useState<TabType>('bet');

  const totalBet = betAmount * ballCount;
  const maxBet = Math.floor(balance / ballCount);
  const isDisabled = isDropping || !isAuthenticated;

  // Bet amount handlers
  const handleBetInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0 && numValue * ballCount <= balance) {
      onBetChange(numValue);
    }
  }, [balance, ballCount, onBetChange]);

  const handleHalf = useCallback(() => {
    const newAmount = Math.max(1, Math.floor(betAmount / 2));
    onBetChange(newAmount);
    setInputValue(newAmount.toString());
  }, [betAmount, onBetChange]);

  const handleDouble = useCallback(() => {
    const newAmount = Math.min(maxBet, betAmount * 2);
    if (newAmount * ballCount <= balance) {
      onBetChange(newAmount);
      setInputValue(newAmount.toString());
    }
  }, [betAmount, maxBet, ballCount, balance, onBetChange]);

  const handleMax = useCallback(() => {
    if (maxBet > 0) {
      onBetChange(maxBet);
      setInputValue(maxBet.toString());
    }
  }, [maxBet, onBetChange]);

  // Ball count handlers
  const handleDecreaseBalls = useCallback(() => {
    if (ballCount > MIN_BALL_COUNT) {
      onBallCountChange(ballCount - 1);
    }
  }, [ballCount, onBallCountChange]);

  const handleIncreaseBalls = useCallback(() => {
    if (ballCount < MAX_BALL_COUNT && betAmount * (ballCount + 1) <= balance) {
      onBallCountChange(ballCount + 1);
    }
  }, [ballCount, betAmount, balance, onBallCountChange]);

  // Rows handler
  const handleRowsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) as RowCount;
    onRowsChange(value);
  }, [onRowsChange]);

  // Speed handler
  const handleSpeedChange = useCallback((speedOption: BallSpeed) => {
    onSpeedChange(speedOption);
  }, [onSpeedChange]);

  const canDrop = isAuthenticated && totalBet > 0 && totalBet <= balance && !isDropping;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Tab headers */}
      <div className="flex gap-1 p-1 bg-(--color-background) rounded-lg">
        <button
          type="button"
          className={cn(
            'flex-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-md text-xs sm:text-sm font-semibold transition-colors',
            activeTab === 'bet'
              ? 'bg-(--color-surface-elevated) text-(--color-text)'
              : 'text-(--color-text-muted) hover:text-(--color-text)'
          )}
          onClick={() => setActiveTab('bet')}
        >
          Apuesta
        </button>
        <button
          type="button"
          className={cn(
            'flex-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-md text-xs sm:text-sm font-semibold transition-colors',
            activeTab === 'config'
              ? 'bg-(--color-surface-elevated) text-(--color-text)'
              : 'text-(--color-text-muted) hover:text-(--color-text)'
          )}
          onClick={() => setActiveTab('config')}
        >
          Config
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'bet' ? (
        <div className="space-y-3 sm:space-y-4">
          {/* Apuesta por bola */}
          <div>
            <label className="block text-[10px] sm:text-xs font-semibold text-(--color-text-muted) mb-1.5 sm:mb-2 uppercase tracking-wider">
              Monto por bola
            </label>

            {/* Input with ½x and 2x buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleHalf}
                disabled={isDisabled}
                variant="ghost"
                size="xs"
                scale="none"
                className="rounded-lg"
                aria-label="Reducir apuesta a la mitad"
              >
                ½
              </Button>

              <div className="relative flex-1">
                <Coins size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-muted)" />
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max={maxBet}
                  value={inputValue}
                  onChange={handleBetInputChange}
                  disabled={isDisabled}
                  aria-label="Monto de apuesta por bola"
                  className={cn(
                    'w-full pl-10 pr-4 py-2 rounded-lg text-sm font-bold text-center',
                    'bg-(--color-background) border-2 border-(--color-border)',
                    'focus-visible:outline-none focus-visible:border-(--color-primary) focus-visible:ring-2 focus-visible:ring-(--color-primary)/30',
                    'placeholder:text-(--color-text-muted)',
                    '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                    isDisabled && 'opacity-50 cursor-not-allowed'
                  )}
                />
              </div>

              <Button
                onClick={handleDouble}
                disabled={isDisabled || betAmount * 2 * ballCount > balance}
                variant="ghost"
                size="xs"
                scale="none"
                className="rounded-lg"
                aria-label="Duplicar apuesta"
              >
                2×
              </Button>
            </div>

            {/* MAX button */}
            <div className="mt-2">
              <Button
                onClick={handleMax}
                disabled={isDisabled || maxBet <= 0}
                variant="ghost"
                size="xs"
                scale="none"
                className="w-full h-8 rounded-md text-xs font-semibold bg-(--color-warning)/20 text-(--color-warning) hover:bg-(--color-warning)/30"
                aria-label="Apostar el máximo posible"
              >
                MAX
              </Button>
            </div>
          </div>

          {/* Bolas - Compact inline */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
              Bolas
            </label>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleDecreaseBalls}
                disabled={isDisabled || ballCount <= MIN_BALL_COUNT}
                variant="ghost"
                size="xs"
                scale="none"
                className="w-8 h-8 rounded-full p-0"
                aria-label="Reducir cantidad de bolas"
              >
                <Minus size={16} />
              </Button>

              <span className="text-xl font-bold text-(--color-text) min-w-[2ch] text-center" aria-live="polite">
                {ballCount}
              </span>

              <Button
                onClick={handleIncreaseBalls}
                disabled={isDisabled || ballCount >= MAX_BALL_COUNT || betAmount * (ballCount + 1) > balance}
                variant="ghost"
                size="xs"
                scale="none"
                className="w-8 h-8 rounded-full p-0"
                aria-label="Aumentar cantidad de bolas"
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>

          {/* Total info */}
          <div className="flex items-center justify-between py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg bg-(--color-background)/50 border border-(--color-border)">
            <div>
              <p className="text-[9px] sm:text-[10px] text-(--color-text-muted) uppercase tracking-wide">Total</p>
              <p className="text-sm sm:text-base font-bold text-(--color-warning)">{formatBalance(totalBet)}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] sm:text-[10px] text-(--color-text-muted) uppercase tracking-wide">Balance</p>
              <p className="text-sm sm:text-base font-bold text-(--color-primary)">{formatBalance(balance)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {/* Filas - Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="rows-slider" className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                Filas
              </label>
              <span className="text-sm font-bold text-(--color-primary)" aria-live="polite">{rows}</span>
            </div>

            <div className="relative">
              <input
                id="rows-slider"
                type="range"
                min={8}
                max={16}
                value={rows}
                onChange={handleRowsChange}
                disabled={isDropping}
                aria-label={`Número de filas: ${rows}`}
                aria-valuemin={8}
                aria-valuemax={16}
                aria-valuenow={rows}
                className={cn(
                  'w-full h-2 rounded-full appearance-none cursor-pointer',
                  'bg-(--color-background)',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)/30',
                  '[&::-webkit-slider-thumb]:appearance-none',
                  '[&::-webkit-slider-thumb]:w-5',
                  '[&::-webkit-slider-thumb]:h-5',
                  '[&::-webkit-slider-thumb]:rounded-full',
                  '[&::-webkit-slider-thumb]:bg-(--color-primary)',
                  '[&::-webkit-slider-thumb]:cursor-pointer',
                  '[&::-webkit-slider-thumb]:transition-transform',
                  '[&::-webkit-slider-thumb]:hover:scale-110',
                  '[&::-webkit-slider-thumb]:shadow-lg',
                  '[&::-moz-range-thumb]:w-5',
                  '[&::-moz-range-thumb]:h-5',
                  '[&::-moz-range-thumb]:rounded-full',
                  '[&::-moz-range-thumb]:bg-(--color-primary)',
                  '[&::-moz-range-thumb]:border-0',
                  '[&::-moz-range-thumb]:cursor-pointer',
                  isDropping && 'opacity-50 cursor-not-allowed'
                )}
              />
              {/* Scale markers */}
              <div className="flex justify-between mt-1 px-1" aria-hidden="true">
                <span className="text-[10px] text-(--color-text-subtle)">8</span>
                <span className="text-[10px] text-(--color-text-subtle)">12</span>
                <span className="text-[10px] text-(--color-text-subtle)">16</span>
              </div>
            </div>
          </div>

          {/* Velocidad */}
          <div>
            <label className="block text-xs font-semibold text-(--color-text-muted) mb-2 uppercase tracking-wider">
              Velocidad
            </label>

            <div className="flex items-center gap-1.5">
              {SPEED_OPTIONS.map((speedOption) => {
                const isSelected = speed === speedOption;
                return (
                  <Button
                    key={speedOption}
                    onClick={() => handleSpeedChange(speedOption)}
                    disabled={isDropping}
                    variant={isSelected ? 'primary' : 'ghost'}
                    size="xs"
                    scale="none"
                    className="flex-1 h-9 px-2 rounded-md text-xs"
                    aria-label={`Velocidad ${SPEED_CONFIG[speedOption].label}`}
                    aria-pressed={isSelected}
                  >
                    {SPEED_CONFIG[speedOption].label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Info text */}
          <p className="text-[11px] text-(--color-text-subtle) text-center">
            Más filas = más multiplicadores posibles
          </p>
        </div>
      )}

      {/* Error messages - always visible */}
      {totalBet > balance && isAuthenticated && (
        <p className="text-xs text-(--color-error) text-center py-1" role="alert">
          Balance insuficiente
        </p>
      )}

      {!isAuthenticated && (
        <p className="text-xs text-(--color-warning) text-center py-1" role="status">
          Inicia sesión para apostar
        </p>
      )}

      {/* Drop button - always visible */}
      <Button
        onClick={onDrop}
        disabled={!canDrop}
        variant="primary"
        size="lg"
        className="w-full text-sm sm:text-base font-bold h-10 sm:h-12"
      >
        {isDropping ? (
          <span className="flex items-center gap-2">
            <span className="animate-bounce">●</span>
            Cayendo...
          </span>
        ) : (
          <span>
            SOLTAR {ballCount > 1 && `×${ballCount}`}
          </span>
        )}
      </Button>
    </div>
  );
}
