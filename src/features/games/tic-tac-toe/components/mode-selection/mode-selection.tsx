'use client';

import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Users, Globe, ArrowLeft, Zap, Star, UserPlus, Lock, Coins, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { useWalletStore, formatBalance } from '@/features/wallet/store/wallet-store';
import type { AIDifficulty, GameMode } from '../../../registry/types';
import type { BetConfig } from '../../../common/hooks';

// Bet presets
const BET_PRESETS = [10, 25, 50, 100, 250, 500];

// Difficulty config data
const DIFFICULTIES: {
  value: AIDifficulty;
  label: string;
  stars: number;
}[] = [
  { value: 'easy', label: 'Fácil', stars: 1 },
  { value: 'medium', label: 'Medio', stars: 2 },
  { value: 'hard', label: 'Difícil', stars: 3 },
  { value: 'impossible', label: 'Imposible', stars: 4 },
];

// Star rating component
const StarRating = memo(function StarRating({ count, max = 4, size = 10 }: { count: number; max?: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={cn(
            'transition-colors',
            i < count ? 'fill-(--color-warning) text-(--color-warning)' : 'text-(--color-text-muted)/30'
          )}
        />
      ))}
    </div>
  );
});

// Mode card component for grid
interface ModeCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  disabled?: boolean;
  badge?: string;
}

const ModeCard = memo(function ModeCard({ icon, title, subtitle, onClick, variant = 'default', disabled, badge }: ModeCardProps) {
  const variantStyles = {
    default: 'border-(--color-border) hover:border-(--color-text-muted) hover:bg-(--color-surface-hover)',
    primary: 'border-(--color-primary)/50 bg-(--color-primary)/5 hover:bg-(--color-primary)/10 hover:border-(--color-primary)',
    success: 'border-(--color-success)/50 bg-(--color-success)/5 hover:bg-(--color-success)/10 hover:border-(--color-success)',
    warning: 'border-(--color-warning)/50 bg-(--color-warning)/5 hover:bg-(--color-warning)/10 hover:border-(--color-warning)',
  };

  const iconStyles = {
    default: 'text-(--color-text-muted) group-hover:text-(--color-text)',
    primary: 'text-(--color-primary)',
    success: 'text-(--color-success)',
    warning: 'text-(--color-warning)',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group relative flex flex-col items-center justify-center gap-2 p-4 sm:p-5',
        'rounded-xl border-2 transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) focus-visible:ring-offset-2',
        variantStyles[variant],
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {badge && (
        <span className="absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-(--color-warning) text-white">
          {badge}
        </span>
      )}
      <div className={cn('transition-colors', iconStyles[variant])}>
        {icon}
      </div>
      <div className="text-center">
        <p className="font-semibold text-sm text-(--color-text)">{title}</p>
        {subtitle && (
          <p className="text-xs text-(--color-text-muted) mt-0.5">{subtitle}</p>
        )}
      </div>
    </button>
  );
});

interface LocalGameConfig {
  mode: GameMode;
  playerSymbol: 'X' | 'O';
  aiDifficulty: AIDifficulty;
}

interface ModeSelectionProps {
  config: LocalGameConfig;
  showAIConfig: boolean;
  isAuthenticated: boolean;
  onBack?: () => void;
  onStartGame: (mode: GameMode) => void;
  onShowAIConfig: () => void;
  onHideAIConfig: () => void;
  onConfigChange: (updates: Partial<LocalGameConfig>) => void;
  onPlayOnline: (betConfig?: BetConfig) => void;
  onCreatePrivateRoom: (betConfig?: BetConfig) => void;
}

export function ModeSelection({
  config,
  showAIConfig,
  isAuthenticated,
  onBack,
  onStartGame,
  onShowAIConfig,
  onHideAIConfig,
  onConfigChange,
  onPlayOnline,
  onCreatePrivateRoom,
}: ModeSelectionProps) {
  const { wallet } = useWalletStore();
  const balance = wallet?.balance ?? 0;

  // Bet toggle state
  const [wantsToBet, setWantsToBet] = useState(false);
  const [betAmount, setBetAmount] = useState(BET_PRESETS[0]);
  const [customBetInput, setCustomBetInput] = useState('');

  const handleToggleBet = useCallback(() => {
    setWantsToBet(prev => !prev);
  }, []);

  const handleBetAmountChange = useCallback((amount: number) => {
    setBetAmount(amount);
  }, []);

  const getBetConfig = useCallback((): BetConfig | undefined => {
    if (!wantsToBet) return undefined;
    return { wantsToBet: true, betAmount };
  }, [wantsToBet, betAmount]);

  const handlePlayOnline = useCallback(() => {
    onPlayOnline(getBetConfig());
  }, [onPlayOnline, getBetConfig]);

  const handleCreatePrivateRoom = useCallback(() => {
    onCreatePrivateRoom(getBetConfig());
  }, [onCreatePrivateRoom, getBetConfig]);
  return (
    <div className="game-container relative flex flex-col items-center justify-center p-4 sm:p-6 landscape:p-3">
      {/* Back button */}
      {onBack && (
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="absolute top-2 left-2 sm:top-4 sm:left-4 gap-2 z-10"
        >
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">Volver</span>
        </Button>
      )}

      {/* Header */}
      <motion.div
        className="text-center mb-6 sm:mb-8 landscape:mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="text-4xl sm:text-5xl landscape:text-3xl block mb-2">#️⃣</span>
        <h1 className="text-2xl sm:text-3xl landscape:text-xl font-heading font-bold text-(--color-text)">
          Tic Tac Toe
        </h1>
        <p className="text-sm text-(--color-text-muted) mt-1">Elige un modo de juego</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!showAIConfig ? (
          <motion.div
            key="mode-select"
            className="w-full max-w-sm landscape:max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.1 }}
          >
            {/* 2x2 Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <ModeCard
                icon={<Bot size={32} />}
                title="VS IA"
                subtitle="Un jugador"
                onClick={onShowAIConfig}
                variant="primary"
              />
              <ModeCard
                icon={<Users size={32} />}
                title="Local"
                subtitle="2 jugadores"
                onClick={() => onStartGame('local')}
              />
              <ModeCard
                icon={<Globe size={32} />}
                title="Online"
                subtitle={isAuthenticated ? (wantsToBet ? `Apuesta: ${formatBalance(betAmount)}` : "Buscar partida") : "Inicia sesión"}
                onClick={handlePlayOnline}
                variant={isAuthenticated ? (wantsToBet ? "warning" : "success") : "default"}
                disabled={!isAuthenticated}
              />
              <ModeCard
                icon={isAuthenticated ? <UserPlus size={32} /> : <Lock size={32} />}
                title="Privada"
                subtitle={isAuthenticated ? (wantsToBet ? `Apuesta: ${formatBalance(betAmount)}` : "Invitar amigo") : "Inicia sesión"}
                onClick={handleCreatePrivateRoom}
                variant={isAuthenticated ? (wantsToBet ? "warning" : "success") : "default"}
                disabled={!isAuthenticated}
              />
            </div>

            {/* Betting Toggle Section */}
            {isAuthenticated && (
              <div className="mt-5 sm:mt-6 space-y-3">
                {/* Toggle */}
                <button
                  onClick={handleToggleBet}
                  aria-label={wantsToBet ? 'Desactivar apuesta' : 'Activar apuesta'}
                  aria-pressed={wantsToBet}
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) focus-visible:ring-offset-2',
                    wantsToBet
                      ? 'border-(--color-warning) bg-(--color-warning)/10'
                      : 'border-(--color-border) bg-(--color-surface) hover:border-(--color-text-muted)'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Coins size={18} className={wantsToBet ? 'text-(--color-warning)' : 'text-(--color-text-muted)'} />
                    <span className={cn('text-sm font-medium', wantsToBet ? 'text-(--color-warning)' : 'text-(--color-text)')}>
                      Apostar monedas
                    </span>
                  </div>
                  {wantsToBet ? (
                    <ToggleRight size={28} className="text-(--color-warning)" />
                  ) : (
                    <ToggleLeft size={28} className="text-(--color-text-muted)" />
                  )}
                </button>

                {/* Amount Selector */}
                <AnimatePresence>
                  {wantsToBet && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 rounded-xl border border-(--color-warning)/30 bg-(--color-warning)/5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-(--color-text-muted)">Monto:</span>
                          <span className="text-xs text-(--color-text-muted)">
                            Balance: <span className="text-(--color-primary) font-medium">{formatBalance(balance)}</span>
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {BET_PRESETS.map((amount) => {
                            const canAfford = amount <= balance;
                            const isSelected = betAmount === amount && !customBetInput;
                            return (
                              <button
                                key={amount}
                                onClick={() => {
                                  if (canAfford) {
                                    handleBetAmountChange(amount);
                                    setCustomBetInput('');
                                  }
                                }}
                                disabled={!canAfford}
                                aria-label={`Apostar ${amount} créditos`}
                                aria-pressed={isSelected}
                                className={cn(
                                  'py-2 px-2 rounded-lg text-xs font-medium transition-all',
                                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-warning) focus-visible:ring-offset-2',
                                  isSelected
                                    ? 'bg-(--color-warning) text-white'
                                    : canAfford
                                      ? 'bg-(--color-surface) text-(--color-text) hover:bg-(--color-surface-hover)'
                                      : 'bg-(--color-background) text-(--color-text-subtle) opacity-50 cursor-not-allowed'
                                )}
                              >
                                {formatBalance(amount)}
                              </button>
                            );
                          })}
                        </div>
                        {/* Custom amount input */}
                        <div className="mt-2 flex gap-2">
                          <div className="relative flex-1">
                            <Coins size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-(--color-text-muted)" />
                            <input
                              type="number"
                              inputMode="numeric"
                              min="1"
                              max={balance}
                              value={customBetInput}
                              onChange={(e) => {
                                const value = e.target.value;
                                setCustomBetInput(value);
                                const numValue = parseInt(value, 10);
                                if (!isNaN(numValue) && numValue > 0 && numValue <= balance) {
                                  handleBetAmountChange(numValue);
                                }
                              }}
                              placeholder="Otro monto..."
                              aria-label="Monto de apuesta personalizado"
                              className={cn(
                                'w-full pl-8 pr-3 py-2 rounded-lg text-xs font-medium',
                                'bg-(--color-surface) border border-(--color-border)',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-warning) focus-visible:ring-offset-2',
                                'placeholder:text-(--color-text-muted)',
                                '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                                customBetInput && !BET_PRESETS.includes(betAmount)
                                  ? 'ring-2 ring-(--color-warning) border-transparent'
                                  : ''
                              )}
                            />
                          </div>
                        </div>
                        {customBetInput && parseInt(customBetInput, 10) > balance && (
                          <p className="text-[10px] text-(--color-error) mt-1">
                            Balance insuficiente
                          </p>
                        )}
                        <p className="text-[10px] text-(--color-text-muted) mt-2 text-center">
                          La apuesta final se negocia con tu oponente
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="ai-config"
            className="w-full max-w-sm landscape:max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.1 }}
          >
            {/* AI Config Panel */}
            <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-4 sm:p-5 space-y-4">
              {/* Difficulty */}
              <div>
                <p className="text-xs font-semibold text-(--color-text-muted) mb-2 uppercase tracking-wider">
                  Dificultad
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {DIFFICULTIES.map((diff) => (
                    <button
                      key={diff.value}
                      onClick={() => onConfigChange({ aiDifficulty: diff.value })}
                      className={cn(
                        'flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg',
                        'transition-all duration-150',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)',
                        config.aiDifficulty === diff.value
                          ? 'bg-(--color-primary) text-white shadow-md'
                          : 'bg-(--color-background) hover:bg-(--color-background-hover) text-(--color-text-muted) hover:text-(--color-text)'
                      )}
                    >
                      <span className="text-[11px] font-medium">{diff.label}</span>
                      <StarRating count={diff.stars} size={8} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Symbol */}
              <div>
                <p className="text-xs font-semibold text-(--color-text-muted) mb-2 uppercase tracking-wider">
                  Tu símbolo
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onConfigChange({ playerSymbol: 'X' })}
                    className={cn(
                      'flex items-center justify-center gap-3 py-3 rounded-lg',
                      'transition-all duration-150',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)',
                      config.playerSymbol === 'X'
                        ? 'bg-(--color-primary) text-white shadow-md'
                        : 'bg-(--color-background) hover:bg-(--color-background-hover) text-(--color-text-muted) hover:text-(--color-text)'
                    )}
                  >
                    <span className="text-2xl font-bold">✕</span>
                    <span className="text-xs font-medium">Empiezas</span>
                  </button>
                  <button
                    onClick={() => onConfigChange({ playerSymbol: 'O' })}
                    className={cn(
                      'flex items-center justify-center gap-3 py-3 rounded-lg',
                      'transition-all duration-150',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-secondary)',
                      config.playerSymbol === 'O'
                        ? 'bg-(--color-secondary) text-white shadow-md'
                        : 'bg-(--color-background) hover:bg-(--color-background-hover) text-(--color-text-muted) hover:text-(--color-text)'
                    )}
                  >
                    <span className="text-2xl font-bold">○</span>
                    <span className="text-xs font-medium">IA empieza</span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={onHideAIConfig}
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                >
                  <ArrowLeft size={16} />
                  Atrás
                </Button>
                <Button
                  onClick={() => onStartGame('ai')}
                  variant="primary"
                  className="flex-1 gap-2"
                >
                  <Zap size={18} />
                  Jugar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ModeSelection;
