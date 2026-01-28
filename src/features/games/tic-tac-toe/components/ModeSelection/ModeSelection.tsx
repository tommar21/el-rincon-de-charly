'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Users, Globe, ArrowLeft, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import type { AIDifficulty } from '../../../common/types/game.types';
import type { GameMode } from '../../../registry/types';

// Difficulty config data - compact version without emojis
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

// Compact star rating
function StarRating({ count, max = 4, size = 12 }: { count: number; max?: number; size?: number }) {
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
}

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
  onPlayOnline: () => void;
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
}: ModeSelectionProps) {
  return (
    <div className="game-container relative flex flex-col items-center justify-center p-4 sm:p-6 landscape:p-2">
      {/* Back to Hub button - positioned relative to container, not viewport */}
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

      <motion.div
        className="text-center mb-6 sm:mb-10 landscape:mb-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="text-4xl sm:text-5xl landscape:text-3xl block mb-2 sm:mb-3 landscape:mb-1">#️⃣</span>
        <h1 className="text-2xl sm:text-4xl landscape:text-xl font-heading font-bold text-(--color-text)">
          Tic Tac Toe
        </h1>
      </motion.div>

      <AnimatePresence mode="wait">
        {!showAIConfig ? (
          <motion.div
            key="mode-select"
            className="flex flex-col gap-2 sm:gap-3 w-full max-w-xs landscape:max-w-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.2 }}
          >
            {/* Play vs AI */}
            <Button
              onClick={onShowAIConfig}
              variant="primary"
              size="lg"
              className="w-full gap-2.5 py-4 sm:py-5 landscape:py-3"
            >
              <Bot size={20} />
              Jugar vs IA
            </Button>

            {/* Play Local */}
            <Button
              onClick={() => onStartGame('local')}
              variant="secondary"
              size="lg"
              className="w-full gap-2.5 py-4 sm:py-5 landscape:py-3"
            >
              <Users size={20} />
              2 Jugadores
            </Button>

            {/* Play Online */}
            <Button
              onClick={onPlayOnline}
              variant={isAuthenticated ? 'success' : 'outline'}
              size="lg"
              className="w-full gap-2.5 py-4 sm:py-5 landscape:py-3"
            >
              <Globe size={20} />
              {isAuthenticated ? 'Jugar Online' : 'Online (Inicia sesión)'}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="ai-config"
            className="flex flex-col gap-3 sm:gap-4 landscape:gap-2 w-full max-w-xs landscape:max-w-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.2 }}
          >
            {/* AI Difficulty selector - Compact horizontal pills */}
            <div>
              <p className="text-xs font-medium text-(--color-text-muted) mb-2 text-center uppercase tracking-wide">
                Dificultad
              </p>
              <div className="flex gap-1.5 p-1 bg-(--color-surface) rounded-lg border border-(--color-border)">
                {DIFFICULTIES.map((diff) => (
                  <button
                    key={diff.value}
                    onClick={() => onConfigChange({ aiDifficulty: diff.value })}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-md',
                      'transition-all duration-150',
                      config.aiDifficulty === diff.value
                        ? 'bg-(--color-primary) text-white shadow-sm'
                        : 'hover:bg-(--color-background) text-(--color-text-muted) hover:text-(--color-text)'
                    )}
                  >
                    <span className="text-xs font-medium">{diff.label}</span>
                    <StarRating
                      count={diff.stars}
                      size={8}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Symbol selector - Compact toggle */}
            <div>
              <p className="text-xs font-medium text-(--color-text-muted) mb-2 text-center uppercase tracking-wide">
                Tu símbolo
              </p>
              <div className="flex gap-1.5 p-1 bg-(--color-surface) rounded-lg border border-(--color-border)">
                {/* X Symbol */}
                <button
                  onClick={() => onConfigChange({ playerSymbol: 'X' })}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 rounded-md',
                    'transition-all duration-150',
                    config.playerSymbol === 'X'
                      ? 'bg-(--color-primary) text-white shadow-sm'
                      : 'hover:bg-(--color-background) text-(--color-text-muted) hover:text-(--color-text)'
                  )}
                >
                  <span className="text-xl font-bold">✕</span>
                  <span className="text-xs">Empiezas tú</span>
                </button>

                {/* O Symbol */}
                <button
                  onClick={() => onConfigChange({ playerSymbol: 'O' })}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 rounded-md',
                    'transition-all duration-150',
                    config.playerSymbol === 'O'
                      ? 'bg-(--color-secondary) text-white shadow-sm'
                      : 'hover:bg-(--color-background) text-(--color-text-muted) hover:text-(--color-text)'
                  )}
                >
                  <span className="text-xl font-bold">○</span>
                  <span className="text-xs">Empieza IA</span>
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
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
                Comenzar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ModeSelection;
