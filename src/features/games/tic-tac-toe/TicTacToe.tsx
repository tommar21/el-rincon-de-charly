import { useState, useRef, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Bot, Users, Zap, BarChart3, Trophy, Globe, Loader2, LogOut, ArrowLeft } from 'lucide-react';
import { Board } from './components/Board';
import { useTicTacToe } from './hooks/useTicTacToe';
import { useOnlineGame } from './hooks/useOnlineGame';
import { ThemeSelector } from '../../settings/components/ThemeSelector';
import { UserMenu } from '../../auth/components/UserMenu';
import { useStatsStore } from '../../profile/store/statsStore';
import { useAuth } from '../../auth/hooks/useAuth';
import type { GameMode, AIDifficulty, Player } from '../common/types/game.types';
import { cn } from '../../../lib/utils';

// Lazy load modals
const StatsModal = lazy(() => import('../../profile/components/StatsModal'));
const LeaderboardModal = lazy(() => import('../../profile/components/LeaderboardModal'));

interface GameConfig {
  mode: GameMode;
  playerSymbol: 'X' | 'O';
  aiDifficulty: AIDifficulty;
}

interface TicTacToeProps {
  onBackToHub?: () => void;
}

export function TicTacToe({ onBackToHub }: TicTacToeProps) {
  const [gameStarted, setGameStarted] = useState(false);
  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [config, setConfig] = useState<GameConfig>({
    mode: 'ai',
    playerSymbol: 'X',
    aiDifficulty: 'medium',
  });
  const gameStartTimeRef = useRef<number>(Date.now());
  const movesCountRef = useRef<number>(0);
  const { recordGame } = useStatsStore();
  const { user, isAuthenticated } = useAuth();

  // Online game hook
  const onlineGame = useOnlineGame({
    userId: user?.id || '',
    onGameEnd: (winnerId, isDraw) => {
      if (!user) return;
      const result = isDraw ? 'draw' : winnerId === user.id ? 'win' : 'loss';
      recordGame({
        gameType: 'tic-tac-toe',
        opponentType: 'online',
        result,
        playerSymbol: onlineGame.mySymbol || 'X',
        moves: onlineGame.board.filter(c => c !== null).length,
        durationSeconds: Math.floor((Date.now() - gameStartTimeRef.current) / 1000),
      });
    },
  });

  // Handle game end - record stats
  const handleGameEnd = useCallback(
    (winnerPlayer: Player | null, isDraw: boolean) => {
      const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);

      let result: 'win' | 'loss' | 'draw';
      if (isDraw) {
        result = 'draw';
      } else if (winnerPlayer) {
        result = winnerPlayer.isAI ? 'loss' : 'win';
      } else {
        result = 'draw';
      }

      // Determine opponent type
      let opponentType: 'human' | 'ai_easy' | 'ai_medium' | 'ai_hard' | 'ai_impossible';
      if (config.mode === 'local') {
        opponentType = 'human';
      } else {
        opponentType = `ai_${config.aiDifficulty}` as typeof opponentType;
      }

      recordGame({
        gameType: 'tic-tac-toe',
        opponentType,
        result,
        playerSymbol: config.playerSymbol,
        moves: movesCountRef.current,
        durationSeconds,
      });
    },
    [config, recordGame]
  );

  const {
    board,
    currentSymbol,
    winner,
    isGameOver,
    isAIThinking,
    makePlayerMove,
    resetGame,
    gameHistory,
  } = useTicTacToe({
    mode: config.mode,
    playerSymbol: config.playerSymbol,
    aiDifficulty: config.aiDifficulty,
    onGameEnd: handleGameEnd,
  });

  // Update moves count when game history changes
  movesCountRef.current = gameHistory.length;

  const handleStartGame = (mode: GameMode) => {
    setConfig((prev) => ({ ...prev, mode }));
    setGameStarted(true);
    gameStartTimeRef.current = Date.now();
    resetGame();
  };

  const handleRestart = () => {
    gameStartTimeRef.current = Date.now();
    resetGame();
  };

  const handleBackToMenu = () => {
    setGameStarted(false);
    setShowAIConfig(false);
    resetGame();
  };

  // Online game screen
  if (isOnlineMode) {
    const handleLeaveOnline = async () => {
      // Confirm if game is in progress
      if (onlineGame.status === 'playing') {
        const confirmed = window.confirm('¿Seguro que quieres abandonar? Perderás la partida.');
        if (!confirmed) return;
      }
      await onlineGame.leaveGame();
      setIsOnlineMode(false);
    };

    return (
      <div className="relative flex flex-col items-center justify-center min-h-screen p-4">
        {/* Top bar */}
        <div className="absolute top-4 right-4 flex items-center gap-3">
          <ThemeSelector />
          <UserMenu />
        </div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gradient font-museo mb-2">
            Tic Tac Toe Online
          </h1>

          {/* Status */}
          <AnimatePresence mode="wait">
            {onlineGame.status === 'searching' && (
              <motion.div
                key="searching"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 mt-8"
              >
                <Loader2 className="animate-spin text-[var(--color-primary)]" size={48} />
                <p className="text-[var(--color-text-muted)]">Buscando partida...</p>
              </motion.div>
            )}

            {onlineGame.status === 'waiting' && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 mt-8"
              >
                <div className="relative">
                  <Globe className="text-green-400" size={48} />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
                </div>
                <p className="text-[var(--color-text-muted)]">Esperando oponente...</p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Sala creada. Comparte con un amigo o espera a que alguien se una.
                </p>
              </motion.div>
            )}

            {(onlineGame.status === 'playing' || onlineGame.status === 'finished') && (
              <motion.div
                key="playing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-4"
              >
                {/* Opponent info */}
                <p className="text-sm text-[var(--color-text-muted)] mb-2">
                  vs <span className="text-[var(--color-accent)] font-semibold">{onlineGame.opponentName || 'Oponente'}</span>
                </p>

                {/* Turn indicator */}
                {onlineGame.status === 'playing' && (
                  <p className="text-lg mb-4">
                    {onlineGame.isMyTurn ? (
                      <span className="text-green-400 font-semibold">Tu turno ({onlineGame.mySymbol})</span>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">Turno del oponente...</span>
                    )}
                  </p>
                )}

                {/* Winner message */}
                {onlineGame.status === 'finished' && (
                  <p className="text-xl font-bold mb-4">
                    {onlineGame.isDraw ? (
                      <span className="text-[var(--color-accent)]">¡Empate!</span>
                    ) : onlineGame.winner?.winner === onlineGame.mySymbol ? (
                      <span className="text-green-400">¡Ganaste!</span>
                    ) : (
                      <span className="text-red-400">Perdiste</span>
                    )}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Board for playing/finished states */}
        {(onlineGame.status === 'playing' || onlineGame.status === 'finished') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6"
          >
            <Board
              board={onlineGame.board}
              onCellClick={(index) => onlineGame.makeMove(index)}
              disabled={!onlineGame.isMyTurn || onlineGame.status === 'finished'}
              winningLine={onlineGame.winner?.line}
            />
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div
          className="mt-8 flex gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {onlineGame.status === 'finished' && (
            <button
              onClick={async () => {
                await onlineGame.leaveGame();
                gameStartTimeRef.current = Date.now();
                onlineGame.findMatch();
              }}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-lg',
                'bg-[var(--color-primary)] text-black font-medium',
                'hover:brightness-110 transition-all',
                'hover:scale-105 active:scale-95'
              )}
            >
              <RotateCcw size={18} />
              Jugar de nuevo
            </button>
          )}
          <button
            onClick={handleLeaveOnline}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-lg',
              'bg-red-500/20 text-red-400 font-medium',
              'hover:bg-red-500/30 transition-all',
              'hover:scale-105 active:scale-95'
            )}
          >
            <LogOut size={18} />
            {onlineGame.status === 'finished' ? 'Menu' : 'Abandonar'}
          </button>
        </motion.div>

        {/* Error */}
        {onlineGame.error && (
          <p className="mt-4 text-red-400 text-sm">{onlineGame.error}</p>
        )}

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

  // Mode selection screen
  if (!gameStarted) {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-screen p-4">
        {/* Top bar with theme, stats and user menu */}
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

        {/* Back to Hub button */}
        {onBackToHub && (
          <button
            onClick={onBackToHub}
            className={cn(
              'absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg',
              'bg-[var(--color-surface)] text-[var(--color-text)]',
              'hover:bg-[var(--color-surface)]/80 transition-all',
              'hover:scale-105 active:scale-95'
            )}
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Volver</span>
          </button>
        )}

        <motion.h1
          className="text-4xl sm:text-6xl font-bold mb-8 text-gradient font-museo"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Tic Tac Toe
        </motion.h1>

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
              <button
                onClick={() => setShowAIConfig(true)}
                className={cn(
                  'flex items-center justify-center gap-3 p-4 rounded-xl',
                  'bg-[var(--color-primary)] text-black font-semibold text-lg',
                  'hover:brightness-110 transition-all duration-200',
                  'hover:scale-105 active:scale-95'
                )}
              >
                <Bot size={24} />
                Jugar vs IA
              </button>

              {/* Play Local */}
              <button
                onClick={() => handleStartGame('local')}
                className={cn(
                  'flex items-center justify-center gap-3 p-4 rounded-xl',
                  'bg-[var(--color-secondary)] text-white font-semibold text-lg',
                  'hover:brightness-110 transition-all duration-200',
                  'hover:scale-105 active:scale-95'
                )}
              >
                <Users size={24} />
                2 Jugadores
              </button>

              {/* Play Online */}
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    alert('Inicia sesion para jugar online');
                    return;
                  }
                  setIsOnlineMode(true);
                  gameStartTimeRef.current = Date.now();
                  onlineGame.findMatch();
                }}
                disabled={!isAuthenticated}
                className={cn(
                  'flex items-center justify-center gap-3 p-4 rounded-xl',
                  'bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-lg',
                  'hover:brightness-110 transition-all duration-200',
                  'hover:scale-105 active:scale-95',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                )}
              >
                <Globe size={24} />
                {isAuthenticated ? 'Jugar Online' : 'Online (Inicia sesion)'}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="ai-config"
              className="flex flex-col gap-4 w-full max-w-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* AI Difficulty selector */}
              <div>
                <p className="text-sm text-[var(--color-text-muted)] mb-2 text-center">
                  Dificultad de la IA
                </p>
                <div className="flex gap-2">
                  {(['easy', 'medium', 'hard', 'impossible'] as AIDifficulty[]).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setConfig((prev) => ({ ...prev, aiDifficulty: diff }))}
                      className={cn(
                        'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all',
                        config.aiDifficulty === diff
                          ? 'bg-[var(--color-primary)] text-black'
                          : 'bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface)]/80'
                      )}
                    >
                      {diff === 'easy' && 'Facil'}
                      {diff === 'medium' && 'Medio'}
                      {diff === 'hard' && 'Dificil'}
                      {diff === 'impossible' && 'Imposible'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Symbol selector */}
              <div>
                <p className="text-sm text-[var(--color-text-muted)] mb-2 text-center">
                  Tu simbolo
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfig((prev) => ({ ...prev, playerSymbol: 'X' }))}
                    className={cn(
                      'flex-1 py-3 rounded-lg font-bold text-2xl transition-all',
                      config.playerSymbol === 'X'
                        ? 'bg-[var(--color-primary)] text-black glow-cyan'
                        : 'bg-[var(--color-surface)] text-[var(--color-primary)]'
                    )}
                  >
                    X
                  </button>
                  <button
                    onClick={() => setConfig((prev) => ({ ...prev, playerSymbol: 'O' }))}
                    className={cn(
                      'flex-1 py-3 rounded-lg font-bold text-2xl transition-all',
                      config.playerSymbol === 'O'
                        ? 'bg-[var(--color-secondary)] text-white glow-magenta'
                        : 'bg-[var(--color-surface)] text-[var(--color-secondary)]'
                    )}
                  >
                    O
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowAIConfig(false)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 p-3 rounded-xl',
                    'bg-[var(--color-surface)] text-[var(--color-text)] font-medium',
                    'hover:bg-[var(--color-surface)]/80 transition-all',
                    'hover:scale-105 active:scale-95'
                  )}
                >
                  <ArrowLeft size={18} />
                  Volver
                </button>
                <button
                  onClick={() => handleStartGame('ai')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 p-3 rounded-xl',
                    'bg-[var(--color-primary)] text-black font-semibold',
                    'hover:brightness-110 transition-all duration-200',
                    'hover:scale-105 active:scale-95'
                  )}
                >
                  <Bot size={18} />
                  Comenzar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

  // Game screen
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4">
      {/* Top bar with theme, stats and user menu */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <button
          onClick={() => setShowStatsModal(true)}
          className={cn(
            'p-2 rounded-lg',
            'bg-[var(--color-surface)] text-[var(--color-text)]',
            'hover:bg-[var(--color-surface)]/80 transition-all',
            'hover:scale-105 active:scale-95'
          )}
          title="Ver estadísticas"
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
        className="mb-6 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-gradient font-museo mb-2">
          Tic Tac Toe
        </h1>

        {/* Game status */}
        <AnimatePresence mode="wait">
          {isGameOver ? (
            <motion.div
              key="gameover"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-xl font-semibold"
            >
              {winner ? (
                <span
                  className={cn(
                    winner.winner === 'X' ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary)]'
                  )}
                >
                  {config.mode === 'ai'
                    ? winner.winner === config.playerSymbol
                      ? '¡Ganaste!'
                      : 'La IA gano'
                    : `¡${winner.winner} gana!`}
                </span>
              ) : (
                <span className="text-[var(--color-accent)]">¡Empate!</span>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="turn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 text-lg"
            >
              {isAIThinking ? (
                <>
                  <Zap className="animate-pulse text-[var(--color-accent)]" size={20} />
                  <span className="text-[var(--color-text-muted)]">IA pensando...</span>
                </>
              ) : (
                <>
                  <span className="text-[var(--color-text-muted)]">Turno de</span>
                  <span
                    className={cn(
                      'font-bold text-2xl',
                      currentSymbol === 'X' ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary)]'
                    )}
                  >
                    {currentSymbol}
                  </span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Board */}
      <Board
        board={board}
        onCellClick={makePlayerMove}
        disabled={isGameOver || isAIThinking}
        winningLine={winner?.line}
      />

      {/* Controls */}
      <motion.div
        className="mt-6 flex gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={handleRestart}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-[var(--color-surface)] text-[var(--color-text)]',
            'hover:bg-[var(--color-surface)]/80 transition-all',
            'hover:scale-105 active:scale-95'
          )}
        >
          <RotateCcw size={18} />
          Reiniciar
        </button>
        <button
          onClick={handleBackToMenu}
          className={cn(
            'px-4 py-2 rounded-lg',
            'bg-[var(--color-surface)] text-[var(--color-text)]',
            'hover:bg-[var(--color-surface)]/80 transition-all',
            'hover:scale-105 active:scale-95'
          )}
        >
          Menu
        </button>
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

export default TicTacToe;
