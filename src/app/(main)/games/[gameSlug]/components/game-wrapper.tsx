'use client';

import { useRouter } from 'next/navigation';
import { gameRegistry } from '@/features/games/registry';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

// Register games
import ticTacToeModule from '@/features/games/tic-tac-toe';
gameRegistry.register(ticTacToeModule);

interface GameWrapperProps {
  gameSlug: string;
}

export function GameWrapper({ gameSlug }: GameWrapperProps) {
  const router = useRouter();
  const game = gameRegistry.get(gameSlug);

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-(--color-text-muted)">Juego no encontrado</p>
      </div>
    );
  }

  const GameComponent = game.Component;

  const handleBackToHub = () => {
    router.push('/games');
  };

  return (
    <ErrorBoundary
      onError={(error) => {
        console.error(`[${gameSlug}] Game error:`, error);
      }}
    >
      <GameComponent
        mode="ai"
        onBack={handleBackToHub}
      />
    </ErrorBoundary>
  );
}
