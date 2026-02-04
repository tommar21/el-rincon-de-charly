import { gameRegistry } from '@/features/games/registry';
import { GamesHubClient } from './components/games-hub-client';

// Register games
import ticTacToeModule from '@/features/games/tic-tac-toe';
import plinkoModule from '@/features/games/plinko';
gameRegistry.register(ticTacToeModule);
gameRegistry.register(plinkoModule);

// Force dynamic rendering to ensure client providers are available
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Juegos | El Rincon de Charly',
  description: 'Hub de juegos - Tic Tac Toe y mas',
};

export default function GamesPage() {
  const games = gameRegistry.getEnabled();

  return <GamesHubClient games={games} />;
}
