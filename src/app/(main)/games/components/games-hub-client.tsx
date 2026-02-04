'use client';

import { useState, useMemo } from 'react';
import { Gamepad2 } from 'lucide-react';
import type { GameConfig } from '@/features/games/registry/types';
import { GameCard } from './game-card';
import { FilterBar, type FilterState } from './filter-bar';

interface GamesHubClientProps {
  games: GameConfig[];
}

const initialFilters: FilterState = {
  features: {
    supportsAI: false,
    supportsOnline: false,
    supportsBetting: false,
  },
};

export function GamesHubClient({ games }: GamesHubClientProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  // Filter games based on current filters
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      // Feature filters (AND logic - must match all selected)
      if (filters.features.supportsAI && !game.supportsAI) {
        return false;
      }
      if (filters.features.supportsOnline && !game.supportsOnline) {
        return false;
      }
      if (filters.features.supportsBetting && !game.supportsBetting) {
        return false;
      }

      return true;
    });
  }, [games, filters]);

  return (
    <div className="flex flex-col min-h-screen px-4 sm:px-6 md:px-8 lg:px-12 pt-6 sm:pt-10 pb-6 sm:pb-8 landscape:pt-4 landscape:pb-4 max-w-6xl mx-auto w-full">
      {/* Header */}
      <header className="mb-6 sm:mb-8 landscape:mb-4">
        <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
          <div className="w-10 h-10 sm:w-12 sm:h-12 landscape:w-8 landscape:h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Gamepad2 size={20} className="text-(--color-primary) sm:w-6 sm:h-6" />
          </div>
          <h1 className="font-heading text-2xl sm:text-4xl landscape:text-xl font-bold text-(--color-text)">
            Juegos
          </h1>
        </div>
        <p className="text-sm sm:text-lg landscape:text-xs text-(--color-text-muted)">
          Diviértete con juegos clásicos, juega con amigos o contra la IA
        </p>
      </header>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        gameCount={games.length}
        filteredCount={filteredGames.length}
      />

      {/* Games Grid */}
      {filteredGames.length > 0 ? (
        <div className="flex flex-wrap justify-center py-4">
          {filteredGames.map((game, index) => (
            <GameCard key={game.slug} game={game} index={index} totalGames={filteredGames.length} />
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Gamepad2 size={40} className="text-(--color-primary)" />
          </div>
          <h2 className="text-xl font-semibold text-(--color-text) mb-2">
            Sin resultados
          </h2>
          <p className="text-(--color-text-muted) text-center max-w-sm">
            No hay juegos que coincidan con los filtros seleccionados.
            Intenta con otros filtros o limpia la búsqueda.
          </p>
        </div>
      )}
    </div>
  );
}
