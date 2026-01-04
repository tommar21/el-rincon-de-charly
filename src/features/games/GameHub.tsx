import { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Trophy, Gamepad2 } from 'lucide-react';
import { ThemeSelector } from '../settings/components/ThemeSelector';
import { UserMenu } from '../auth/components/UserMenu';
import { cn } from '../../lib/utils';

// Lazy load modals
const StatsModal = lazy(() => import('../profile/components/StatsModal'));
const LeaderboardModal = lazy(() => import('../profile/components/LeaderboardModal'));

// Lazy load games
const TicTacToe = lazy(() => import('./tic-tac-toe/TicTacToe'));

type GameId = 'tic-tac-toe' | null;

interface Game {
  id: GameId;
  name: string;
  description: string;
  icon: string;
  available: boolean;
}

const GAMES: Game[] = [
  {
    id: 'tic-tac-toe',
    name: 'Tic Tac Toe',
    description: 'El clasico Ta-Te-Ti. Juega vs IA, local u online.',
    icon: '#️⃣',
    available: true,
  },
  {
    id: null,
    name: 'Conecta 4',
    description: 'Conecta 4 fichas en linea para ganar.',
    icon: '🔴',
    available: false,
  },
  {
    id: null,
    name: 'Ajedrez',
    description: 'El juego de estrategia por excelencia.',
    icon: '♟️',
    available: false,
  },
  {
    id: null,
    name: 'Damas',
    description: 'Captura todas las fichas del oponente.',
    icon: '⚫',
    available: false,
  },
];

export function GameHub() {
  const [selectedGame, setSelectedGame] = useState<GameId>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

  // If a game is selected, render it
  if (selectedGame === 'tic-tac-toe') {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]" />
          </div>
        }
      >
        <TicTacToe onBackToHub={() => setSelectedGame(null)} />
      </Suspense>
    );
  }

  // Game Hub main screen
  return (
    <div className="relative flex flex-col items-center min-h-screen p-4">
      {/* Top bar */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <button
          onClick={() => setShowStatsModal(true)}
          className={cn(
            'p-2 rounded-lg',
            'bg-[var(--color-surface)] text-[var(--color-text)]',
            'hover:bg-[var(--color-surface)]/80 transition-all',
            'hover:scale-105 active:scale-95'
          )}
          title="Ver estadisticas"
        >
          <BarChart3 size={20} />
        </button>
        <button
          onClick={() => setShowLeaderboardModal(true)}
          className={cn(
            'p-2 rounded-lg',
            'bg-[var(--color-surface)] text-yellow-400',
            'hover:bg-[var(--color-surface)]/80 transition-all',
            'hover:scale-105 active:scale-95'
          )}
          title="Ver ranking"
        >
          <Trophy size={20} />
        </button>
        <ThemeSelector />
        <UserMenu />
      </div>

      {/* Header */}
      <motion.div
        className="mt-16 mb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <Gamepad2 className="text-[var(--color-primary)]" size={40} />
          <h1 className="text-4xl sm:text-6xl font-bold text-gradient font-museo">
            Game Hub
          </h1>
        </div>
        <p className="text-[var(--color-text-muted)] text-lg">
          Selecciona un juego para comenzar
        </p>
      </motion.div>

      {/* Games Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {GAMES.map((game, index) => (
          <motion.button
            key={game.name}
            onClick={() => game.available && game.id && setSelectedGame(game.id)}
            disabled={!game.available}
            className={cn(
              'relative p-6 rounded-xl text-left transition-all duration-200',
              'bg-[var(--color-surface)] border border-[var(--color-surface)]',
              game.available
                ? 'hover:border-[var(--color-primary)] hover:scale-105 cursor-pointer'
                : 'opacity-50 cursor-not-allowed'
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <span className="text-4xl mb-3 block">{game.icon}</span>
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-1">
              {game.name}
            </h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              {game.description}
            </p>
            {!game.available && (
              <span className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)]">
                Proximamente
              </span>
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* Stats Modal */}
      <Suspense fallback={null}>
        <StatsModal
          isOpen={showStatsModal}
          onClose={() => setShowStatsModal(false)}
        />
      </Suspense>

      {/* Leaderboard Modal */}
      <Suspense fallback={null}>
        <LeaderboardModal
          isOpen={showLeaderboardModal}
          onClose={() => setShowLeaderboardModal(false)}
        />
      </Suspense>
    </div>
  );
}

export default GameHub;
