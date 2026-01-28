'use client';

import { useMemo } from 'react';
import { Gamepad2, Coins } from 'lucide-react';
import type { GameConfig } from '@/features/games/registry/types';
import { useSidebarStore, type GameSection } from '@/components/layout/sidebar';
import { GameCard } from './game-card';

// Static config - defined outside component to avoid recreation on each render
const SECTION_CONFIG = {
  arcade: {
    title: 'Arcade',
    description: 'Juegos clásicos para divertirte con amigos o contra la IA',
    icon: Gamepad2,
    iconColor: 'text-(--color-primary)',
    bgColor: 'bg-primary/10',
  },
  casino: {
    title: 'Casino',
    description: 'Apuesta tus monedas y gana grandes premios',
    icon: Coins,
    iconColor: 'text-(--color-warning)',
    bgColor: 'bg-(--color-warning)/10',
  },
} as const satisfies Record<GameSection, {
  title: string;
  description: string;
  icon: typeof Gamepad2;
  iconColor: string;
  bgColor: string;
}>;

interface GamesHubClientProps {
  games: GameConfig[];
}

export function GamesHubClient({ games }: GamesHubClientProps) {
  const { currentSection } = useSidebarStore();

  // Filter games based on current section
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      // Casino section: games with category 'casino' OR supportsBetting
      const isCasinoGame = game.category === 'casino' || game.supportsBetting;

      if (currentSection === 'casino') {
        return isCasinoGame;
      }
      // Arcade section: games that are NOT casino games
      return !isCasinoGame;
    });
  }, [games, currentSection]);

  const config = SECTION_CONFIG[currentSection];
  const SectionIcon = config.icon;

  return (
    <div className="flex flex-col min-h-screen px-4 sm:px-6 md:px-8 lg:px-12 pt-6 sm:pt-10 pb-6 sm:pb-8 landscape:pt-4 landscape:pb-4 max-w-6xl mx-auto w-full">
      {/* Header */}
      <header className="mb-6 sm:mb-10 landscape:mb-4">
        <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 landscape:w-8 landscape:h-8 rounded-xl ${config.bgColor} flex items-center justify-center`}>
            <SectionIcon size={20} className={`${config.iconColor} sm:w-6 sm:h-6`} />
          </div>
          <h1 className="font-heading text-2xl sm:text-4xl landscape:text-xl font-bold text-(--color-text)">
            {config.title}
          </h1>
        </div>
        <p className="text-sm sm:text-lg landscape:text-xs text-(--color-text-muted)">
          {config.description}
        </p>
      </header>

      {/* Games Grid */}
      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 landscape:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-7 landscape:gap-3">
          {filteredGames.map((game, index) => (
            <GameCard key={game.slug} game={game} index={index} />
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div className={`w-20 h-20 rounded-2xl ${config.bgColor} flex items-center justify-center mb-4`}>
            <SectionIcon size={40} className={config.iconColor} />
          </div>
          <h2 className="text-xl font-semibold text-(--color-text) mb-2">
            Próximamente
          </h2>
          <p className="text-(--color-text-muted) text-center max-w-sm">
            {currentSection === 'casino'
              ? 'Estamos preparando juegos de casino increíbles. ¡Vuelve pronto!'
              : 'Estamos trabajando en más juegos arcade. ¡Vuelve pronto!'}
          </p>
        </div>
      )}
    </div>
  );
}
