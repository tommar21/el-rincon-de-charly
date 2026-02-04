import { notFound } from 'next/navigation';
import { gameRegistry } from '@/features/games/registry';
import { GameWrapper } from './components/game-wrapper';

// Register games (ideally this should be in a central place)
import ticTacToeModule from '@/features/games/tic-tac-toe';
import plinkoModule from '@/features/games/plinko';
gameRegistry.register(ticTacToeModule);
gameRegistry.register(plinkoModule);

interface GamePageProps {
  params: Promise<{
    gameSlug: string;
  }>;
}

export async function generateMetadata({ params }: GamePageProps) {
  const { gameSlug } = await params;
  const game = gameRegistry.get(gameSlug);

  if (!game) {
    return {
      title: 'Juego no encontrado',
    };
  }

  return {
    title: `${game.config.name} | El Rincon de Charly`,
    description: game.config.description,
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const { gameSlug } = await params;
  const game = gameRegistry.get(gameSlug);

  if (!game || !game.config.enabled) {
    notFound();
  }

  return <GameWrapper gameSlug={gameSlug} />;
}
