'use client';

import { Circle, Crown, CircleDot } from 'lucide-react';
import type { GameConfig } from '@/features/games/registry/types';
import { GameCard } from './game-card';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils/cn';

interface GamesHubClientProps {
  games: GameConfig[];
}

const COMING_SOON_GAMES: Array<{
  name: string;
  slug: string;
  icon: typeof Circle;
  description: string;
}> = [
  {
    name: 'Conecta 4',
    slug: 'connect-4',
    icon: Circle,
    description: 'Conecta 4 fichas en linea para ganar.',
  },
  {
    name: 'Ajedrez',
    slug: 'chess',
    icon: Crown,
    description: 'El juego de estrategia por excelencia.',
  },
  {
    name: 'Damas',
    slug: 'checkers',
    icon: CircleDot,
    description: 'Captura todas las fichas del oponente.',
  },
];

export function GamesHubClient({ games }: GamesHubClientProps) {
  return (
    <div className="flex flex-col min-h-screen px-6 md:px-8 lg:px-12 pt-10 pb-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <header className="mb-10">
        <h1 className="font-heading text-4xl font-bold text-(--color-text) mb-2">
          Juegos
        </h1>
        <p className="text-lg text-(--color-text-muted)">
          Selecciona un juego para comenzar a jugar
        </p>
      </header>

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 lg:gap-7">
        {/* Active Games */}
        {games.map((game, index) => (
          <GameCard key={game.slug} game={game} index={index} />
        ))}

        {/* Coming Soon Cards */}
        {COMING_SOON_GAMES.map((game) => (
          <ComingSoonCard key={game.slug} {...game} />
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-6">
        <Separator className="mb-6" />
        <p className="text-sm text-(--color-text-muted) text-center">
          Mas juegos proximamente...
        </p>
      </footer>
    </div>
  );
}

function ComingSoonCard({
  name,
  icon: Icon,
  description,
}: {
  name: string;
  slug: string;
  icon: typeof Circle;
  description: string;
}) {
  return (
    <Card className={cn(
      'overflow-hidden opacity-50 cursor-not-allowed',
      'hover:border-(--color-border)'
    )}>
      {/* Thumbnail */}
      <div className="aspect-4/3 bg-(--color-surface) flex items-center justify-center">
        <Icon size={48} className="text-(--color-text-subtle)" />
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="font-semibold text-(--color-text) truncate">{name}</h3>
          <Badge variant="warning" className="text-xs shrink-0">
            Pronto
          </Badge>
        </div>
        <p className="text-sm text-(--color-text-muted) line-clamp-2">{description}</p>
      </CardContent>
    </Card>
  );
}
