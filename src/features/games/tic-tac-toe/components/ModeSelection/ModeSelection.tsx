'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Users, Globe, ArrowLeft, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import type { AIDifficulty } from '../../../common/types/game.types';
import type { GameMode } from '../../../registry/types';

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
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      {/* Back to Hub button */}
      {onBack && (
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="absolute top-4 left-4 gap-2"
        >
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">Volver</span>
        </Button>
      )}

      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="text-6xl block mb-4">#️⃣</span>
        <h1 className="text-4xl sm:text-5xl font-heading font-bold text-(--color-text)">
          Tic Tac Toe
        </h1>
      </motion.div>

      <AnimatePresence mode="wait">
        {!showAIConfig ? (
          <motion.div
            key="mode-select"
            className="flex flex-col gap-4 w-full max-w-sm"
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
              className="w-full gap-3 text-lg py-6"
            >
              <Bot size={24} />
              Jugar vs IA
            </Button>

            {/* Play Local */}
            <Button
              onClick={() => onStartGame('local')}
              variant="secondary"
              size="lg"
              className="w-full gap-3 text-lg py-6"
            >
              <Users size={24} />
              2 Jugadores
            </Button>

            {/* Play Online */}
            <Button
              onClick={onPlayOnline}
              variant={isAuthenticated ? 'success' : 'outline'}
              size="lg"
              className="w-full gap-3 text-lg py-6"
            >
              <Globe size={24} />
              {isAuthenticated ? 'Jugar Online' : 'Online (Inicia sesión)'}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="ai-config"
            className="flex flex-col gap-6 w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* AI Difficulty selector */}
                <div>
                  <p className="text-sm font-medium text-(--color-text-muted) mb-3 text-center">
                    Dificultad de la IA
                  </p>
                  <ToggleGroup
                    type="single"
                    value={config.aiDifficulty}
                    onValueChange={(value) => value && onConfigChange({ aiDifficulty: value as AIDifficulty })}
                    className="w-full grid grid-cols-4 gap-2"
                  >
                    <ToggleGroupItem
                      value="easy"
                      className="data-[state=on]:bg-(--color-primary) data-[state=on]:text-white"
                    >
                      Fácil
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="medium"
                      className="data-[state=on]:bg-(--color-primary) data-[state=on]:text-white"
                    >
                      Medio
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="hard"
                      className="data-[state=on]:bg-(--color-primary) data-[state=on]:text-white"
                    >
                      Difícil
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="impossible"
                      className="data-[state=on]:bg-(--color-primary) data-[state=on]:text-white text-xs"
                    >
                      Imposible
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                {/* Symbol selector */}
                <div>
                  <p className="text-sm font-medium text-(--color-text-muted) mb-3 text-center">
                    Tu símbolo
                  </p>
                  <ToggleGroup
                    type="single"
                    value={config.playerSymbol}
                    onValueChange={(value) => value && onConfigChange({ playerSymbol: value as 'X' | 'O' })}
                    className="w-full grid grid-cols-2 gap-3"
                  >
                    <ToggleGroupItem
                      value="X"
                      className={cn(
                        'py-4 text-2xl font-bold',
                        'data-[state=on]:bg-(--color-primary) data-[state=on]:text-white',
                        'data-[state=off]:text-(--color-primary)'
                      )}
                    >
                      X
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="O"
                      className={cn(
                        'py-4 text-2xl font-bold',
                        'data-[state=on]:bg-(--color-secondary) data-[state=on]:text-white',
                        'data-[state=off]:text-(--color-secondary)'
                      )}
                    >
                      O
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </CardContent>
            </Card>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                onClick={onHideAIConfig}
                variant="ghost"
                className="flex-1 gap-2"
              >
                <ArrowLeft size={18} />
                Volver
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
