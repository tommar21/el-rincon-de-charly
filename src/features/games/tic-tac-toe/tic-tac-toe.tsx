'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { ModeSelection, GameScreen, OnlineGame } from './components';
import { useTicTacToe } from './hooks/use-tic-tac-toe';
import { useOnlineGame } from './hooks/use-online-game';
import { useStatsStore } from '@/features/profile';
import { useAuth } from '@/features/auth';

// Dynamic import for modal - reduces initial bundle
const AuthModal = dynamic(() => import('@/features/auth').then(m => m.AuthModal), { ssr: false });
import type { AIDifficulty, Player } from '../common/types/game.types';
import type { GameProps, GameMode } from '../registry/types';

// Loading skeleton component
function GameLoadingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-8">
      {/* Title skeleton */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-(--color-surface) animate-pulse" />
        <div className="w-48 h-8 rounded-lg bg-(--color-surface) animate-pulse" />
      </div>

      {/* Buttons skeleton */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <div className="h-14 rounded-xl bg-(--color-surface) animate-pulse" />
        <div className="h-14 rounded-xl bg-(--color-surface) animate-pulse" />
        <div className="h-14 rounded-xl bg-(--color-surface) animate-pulse" />
      </div>
    </div>
  );
}

interface LocalGameConfig {
  mode: GameMode;
  playerSymbol: 'X' | 'O';
  aiDifficulty: AIDifficulty;
}

type TicTacToeProps = Partial<GameProps>;

export function TicTacToe({ onBack = () => {} }: TicTacToeProps) {
  const [gameStarted, setGameStarted] = useState(false);
  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingRoomJoin, setPendingRoomJoin] = useState(false);
  const [config, setConfig] = useState<LocalGameConfig>({
    mode: 'ai',
    playerSymbol: 'X',
    aiDifficulty: 'medium',
  });

  const [isReady, setIsReady] = useState(false);

  const gameStartTimeRef = useRef<number>(Date.now());
  const movesCountRef = useRef<number>(0);
  const { recordGame } = useStatsStore();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Wait for auth to initialize before showing content
  useEffect(() => {
    if (!isLoading) {
      setIsReady(true);
    }
  }, [isLoading]);

  // URL params for shared room links
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomParam = searchParams.get('room');

  // Online game hook
  const onlineGame = useOnlineGame({
    userId: user?.id || '',
    onGameEnd: (winnerId, isDraw, mySymbol) => {
      if (!user) return;
      const result = isDraw ? 'draw' : winnerId === user.id ? 'win' : 'loss';
      recordGame({
        gameType: 'tic-tac-toe',
        opponentType: 'online',
        result,
        playerSymbol: mySymbol,
        moves: onlineGame.board.filter(c => c !== null).length,
        durationSeconds: Math.floor((Date.now() - gameStartTimeRef.current) / 1000),
      });
    },
  });

  // Handle game end for local/AI games
  const handleGameEnd = useCallback(
    (winnerPlayer: Player | null, isDraw: boolean) => {
      const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);

      let result: 'win' | 'loss' | 'draw';
      if (isDraw) {
        result = 'draw';
      } else if (config.mode === 'ai') {
        result = winnerPlayer?.id === config.playerSymbol ? 'win' : 'loss';
      } else {
        result = winnerPlayer?.id === 'X' ? 'win' : 'loss';
      }

      let opponentType: 'human' | 'ai_easy' | 'ai_medium' | 'ai_hard' | 'ai_impossible' | 'online';
      if (config.mode === 'local') {
        opponentType = 'human';
      } else if (config.mode === 'online') {
        opponentType = 'online';
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
    [config.mode, config.playerSymbol, config.aiDifficulty, recordGame]
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

  // Handle shared room link - show auth modal if not authenticated
  useEffect(() => {
    // Wait for auth to initialize before deciding
    if (isLoading) return;

    if (roomParam && !isAuthenticated) {
      console.log('[TicTacToe] Room param detected but user not authenticated, showing auth modal');
      setPendingRoomJoin(true);
      setShowAuthModal(true);
    }
  }, [roomParam, isAuthenticated, isLoading]);

  // Handle shared room link - auto-join when room param is present and user is authenticated
  useEffect(() => {
    // Wait for auth to initialize before deciding
    if (isLoading) return;

    if (roomParam && isAuthenticated && user?.id) {
      console.log('[TicTacToe] Room param detected:', roomParam, 'User:', user.id);
      setIsOnlineMode(true);
      gameStartTimeRef.current = Date.now();
      onlineGame.joinRoom(roomParam);
      setPendingRoomJoin(false);
      // Clear the URL param to avoid re-joining on refresh
      router.replace('/games/tic-tac-toe', { scroll: false });
    }
  }, [roomParam, isAuthenticated, user?.id, isLoading]);

  // Handlers
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

  const handleLeaveOnline = () => {
    if (onlineGame.status === 'playing') {
      setShowLeaveConfirm(true);
      return;
    }
    confirmLeaveGame();
  };

  const confirmLeaveGame = async () => {
    setShowLeaveConfirm(false);
    await onlineGame.leaveGame();
    setIsOnlineMode(false);
  };

  const handlePlayOnline = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setIsOnlineMode(true);
    gameStartTimeRef.current = Date.now();
    onlineGame.findMatch();
  };

  const handlePlayAgain = async () => {
    await onlineGame.leaveGame();
    gameStartTimeRef.current = Date.now();
    onlineGame.findMatch();
  };

  const handleConfigChange = (updates: Partial<LocalGameConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  // Show loading skeleton until auth is ready
  if (!isReady) {
    return <GameLoadingSkeleton />;
  }

  // Online game screen
  if (isOnlineMode) {
    return (
      <OnlineGame
        status={onlineGame.status}
        board={onlineGame.board}
        mySymbol={onlineGame.mySymbol}
        isMyTurn={onlineGame.isMyTurn}
        winner={onlineGame.winner}
        isDraw={onlineGame.isDraw}
        opponentName={onlineGame.opponentName}
        error={onlineGame.error}
        showLeaveConfirm={showLeaveConfirm}
        roomId={onlineGame.room?.id || null}
        onCellClick={onlineGame.makeMove}
        onLeave={handleLeaveOnline}
        onConfirmLeave={confirmLeaveGame}
        onCancelLeave={() => setShowLeaveConfirm(false)}
        onPlayAgain={handlePlayAgain}
        onRetry={() => onlineGame.findMatch()}
        onBack={onBack}
        rematchStatus={onlineGame.rematchStatus}
        onRequestRematch={onlineGame.requestRematch}
        onAcceptRematch={onlineGame.acceptRematch}
        onDeclineRematch={onlineGame.declineRematch}
      />
    );
  }

  // Mode selection screen
  if (!gameStarted) {
    return (
      <>
        <ModeSelection
          config={config}
          showAIConfig={showAIConfig}
          isAuthenticated={isAuthenticated}
          onBack={onBack}
          onStartGame={handleStartGame}
          onShowAIConfig={() => setShowAIConfig(true)}
          onHideAIConfig={() => setShowAIConfig(false)}
          onConfigChange={handleConfigChange}
          onPlayOnline={handlePlayOnline}
        />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            setPendingRoomJoin(false);
          }}
          message={pendingRoomJoin ? '¡Te han invitado a una partida! Inicia sesión para unirte.' : undefined}
        />
      </>
    );
  }

  // Game screen
  return (
    <GameScreen
      board={board}
      currentSymbol={currentSymbol}
      winner={winner}
      isGameOver={isGameOver}
      isAIThinking={isAIThinking}
      mode={config.mode}
      playerSymbol={config.playerSymbol}
      onCellClick={makePlayerMove}
      onRestart={handleRestart}
      onBackToMenu={handleBackToMenu}
    />
  );
}

export default TicTacToe;
