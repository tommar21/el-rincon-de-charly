'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ArrowLeft, Globe, Loader2, LogOut, Copy, Check, X, Wifi, WifiOff, Coins } from 'lucide-react';
import { Board } from '../board';
import { BetNegotiationOverlay } from '../bet-negotiation-overlay';
import { Button } from '@/components/ui/button';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTitle,
  ModalDescription,
} from '@/components/ui/modal';
import { formatBalance } from '@/features/wallet/store/wallet-store';
import type { BoardState, WinResult } from '../../types';
import type { OnlineGameStatus, RematchStatus } from '../../hooks/use-online-game';
import type { ConnectionStatus } from '../../../common/services/game-room-service';
import type { NegotiationInfo } from '../../../common/hooks';

interface OnlineGameProps {
  status: OnlineGameStatus;
  board: BoardState;
  mySymbol: 'X' | 'O' | null;
  isMyTurn: boolean;
  winner: WinResult | null;
  isDraw: boolean;
  opponentName: string | null;
  error: string | null;
  showLeaveConfirm: boolean;
  roomId: string | null;
  connectionStatus: ConnectionStatus;
  onCellClick: (index: number) => Promise<boolean>;
  onLeave: () => void;
  onConfirmLeave: () => void;
  onCancelLeave: () => void;
  onPlayAgain: () => void;
  onRetry: () => void;
  onBack?: () => void;
  // Rematch props
  rematchStatus: RematchStatus;
  onRequestRematch: () => void;
  onAcceptRematch: () => void;
  onDeclineRematch: () => void;
  // Betting props (optional)
  betAmount?: number | null;
  potTotal?: number;
  // Room type
  isPrivateRoom?: boolean;
  // Negotiation props
  negotiation?: NegotiationInfo;
  balance?: number;
  onSubmitBetProposal?: (amount: number) => void;
  onAcceptBetProposal?: () => void;
  onSkipBetting?: () => void;
}

export function OnlineGame({
  status,
  board,
  mySymbol,
  isMyTurn,
  winner,
  isDraw,
  opponentName,
  error,
  showLeaveConfirm,
  roomId,
  connectionStatus,
  onCellClick,
  onLeave,
  onConfirmLeave,
  onCancelLeave,
  onPlayAgain,
  onRetry,
  onBack,
  rematchStatus,
  onRequestRematch,
  onAcceptRematch,
  onDeclineRematch,
  betAmount,
  potTotal,
  isPrivateRoom = false,
  negotiation,
  balance = 0,
  onSubmitBetProposal,
  onAcceptBetProposal,
  onSkipBetting,
}: OnlineGameProps) {
  const [copied, setCopied] = useState(false);

  const copyRoomLink = async () => {
    if (!roomId) return;

    const link = `${window.location.origin}/games/tic-tac-toe?room=${roomId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // Connection status indicator config
  const connectionIndicator = {
    connected: { icon: Wifi, color: 'text-(--color-success)', label: 'Conectado' },
    connecting: { icon: Wifi, color: 'text-(--color-warning) animate-pulse', label: 'Conectando...' },
    reconnecting: { icon: Wifi, color: 'text-(--color-warning) animate-pulse', label: 'Reconectando...' },
    disconnected: { icon: WifiOff, color: 'text-(--color-error)', label: 'Desconectado' },
  }[connectionStatus];

  // Only show connection indicator when actually connected or having issues
  const showConnectionStatus = status === 'playing' && connectionStatus !== 'disconnected';

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-6">
      {/* Connection status indicator - only during gameplay */}
      {showConnectionStatus && (
        <div
          className={`absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 rounded-full bg-(--color-surface) border border-(--color-border) ${connectionIndicator.color}`}
          title={connectionIndicator.label}
        >
          <connectionIndicator.icon size={14} />
          <span className="text-xs hidden sm:inline">{connectionIndicator.label}</span>
        </div>
      )}

      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-(--color-text) mb-2">
          Tic Tac Toe Online
        </h1>

        {/* Status */}
        <AnimatePresence mode="wait">
          {status === 'searching' && (
            <motion.div
              key="searching"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 mt-8"
            >
              <Loader2 className="animate-spin text-(--color-primary)" size={48} />
              <p className="text-(--color-text-muted)">
                {betAmount ? (
                  <>Buscando partida con apuesta de {formatBalance(betAmount)}...</>
                ) : (
                  <>Buscando partida...</>
                )}
              </p>
              <Button
                onClick={onLeave}
                variant="ghost"
                className="mt-4 gap-2"
              >
                <X size={18} />
                Cancelar
              </Button>
            </motion.div>
          )}

          {status === 'waiting' && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 mt-8"
            >
              {isPrivateRoom ? (
                <>
                  {/* Private room - show invite link */}
                  <div className="relative">
                    <Globe className="text-(--color-success)" size={48} />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-(--color-success) rounded-full animate-ping" />
                  </div>
                  <p className="text-(--color-text-muted)">Esperando oponente...</p>

                  {/* Show bet amount while waiting */}
                  {betAmount && (
                    <div className="flex items-center gap-2 py-2 px-4 rounded-lg bg-(--color-warning)/10 border border-(--color-warning)/30">
                      <Coins className="text-(--color-warning)" size={16} />
                      <span className="text-(--color-warning) text-sm font-medium">
                        Apuesta: {formatBalance(betAmount)}
                      </span>
                    </div>
                  )}

                  {/* Share section - only for private rooms */}
                  {roomId ? (
                    <Button
                      onClick={copyRoomLink}
                      variant="outline"
                      size="lg"
                      className="gap-2"
                    >
                      {copied ? (
                        <>
                          <Check size={18} />
                          ¡Link copiado!
                        </>
                      ) : (
                        <>
                          <Copy size={18} />
                          Copiar link de invitación
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 text-(--color-text-muted)">
                      <Loader2 className="animate-spin" size={16} />
                      <span className="text-sm">Creando sala...</span>
                    </div>
                  )}

                  <p className="text-sm text-(--color-text-muted) text-center max-w-xs">
                    Comparte el link con un amigo para que se una a la partida.
                  </p>
                </>
              ) : (
                <>
                  {/* Public matchmaking - show searching animation */}
                  <Loader2 className="animate-spin text-(--color-primary)" size={48} />
                  <p className="text-(--color-text-muted)">
                    {betAmount ? (
                      <>Buscando partida con apuesta de {formatBalance(betAmount)}...</>
                    ) : (
                      <>Buscando partida...</>
                    )}
                  </p>
                </>
              )}

              {/* Cancel button */}
              <Button
                onClick={onLeave}
                variant="ghost"
                className="mt-4 gap-2"
              >
                <X size={18} />
                Cancelar
              </Button>
            </motion.div>
          )}

          {status === 'negotiating' && (
            <motion.div
              key="negotiating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 mt-8"
            >
              <Coins className="text-(--color-warning)" size={48} />
              <p className="text-(--color-text-muted)">
                Negociando apuesta con <span className="text-(--color-accent) font-semibold">{opponentName || 'oponente'}</span>...
              </p>
              <p className="text-sm text-(--color-text-muted) text-center max-w-xs">
                Ambos jugadores tienen propuestas de apuesta diferentes. Lleguen a un acuerdo o jueguen sin apostar.
              </p>
            </motion.div>
          )}

          {(status === 'playing' || status === 'finished') && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-4"
            >
              {/* Opponent info */}
              <p className="text-sm text-(--color-text-muted) mb-2">
                vs <span className="text-(--color-accent) font-semibold">{opponentName || 'Oponente'}</span>
              </p>

              {/* Pot indicator for betting games */}
              {betAmount && potTotal && potTotal > 0 && (
                <div className="flex items-center justify-center gap-2 mb-3 py-2 px-4 rounded-lg bg-(--color-warning)/10 border border-(--color-warning)/30">
                  <Coins className="text-(--color-warning)" size={18} />
                  <span className="text-(--color-warning) font-semibold">
                    Pot: {formatBalance(potTotal)}
                  </span>
                </div>
              )}

              {/* Turn indicator */}
              {status === 'playing' && (
                <p className="text-lg mb-4">
                  {isMyTurn ? (
                    <span className="text-(--color-success) font-semibold">Tu turno ({mySymbol})</span>
                  ) : (
                    <span className="text-(--color-text-muted)">Turno del oponente...</span>
                  )}
                </p>
              )}

              {/* Winner message */}
              {status === 'finished' && (
                <div className="mb-4">
                  <p className="text-xl font-bold">
                    {isDraw ? (
                      <span className="text-(--color-accent)">¡Empate!</span>
                    ) : winner?.winner === mySymbol ? (
                      <span className="text-(--color-success)">¡Ganaste!</span>
                    ) : (
                      <span className="text-(--color-error)">Perdiste</span>
                    )}
                  </p>
                  {/* Betting result message */}
                  {betAmount && potTotal && potTotal > 0 && (
                    <p className="text-sm mt-1">
                      {isDraw ? (
                        <span className="text-(--color-accent)">
                          Apuesta reembolsada: {formatBalance(betAmount)}
                        </span>
                      ) : winner?.winner === mySymbol ? (
                        <span className="text-(--color-success)">
                          +{formatBalance(potTotal)}
                        </span>
                      ) : (
                        <span className="text-(--color-error)">
                          -{formatBalance(betAmount)}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Board for playing/finished states */}
      {(status === 'playing' || status === 'finished') && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6"
        >
          <Board
            board={board}
            onCellClick={(index) => onCellClick(index)}
            disabled={!isMyTurn || status === 'finished'}
            winningLine={winner?.line}
          />
        </motion.div>
      )}

      {/* Action buttons - only show for playing/finished states */}
      {(status === 'playing' || status === 'finished') && (
        <div className="mt-8 flex flex-col items-center gap-4">
          {status === 'finished' && (
            <>
              {/* Rematch UI */}
              {rematchStatus === 'none' && (
                <div className="flex gap-4">
                  <Button
                    onClick={onRequestRematch}
                    variant="primary"
                    className="gap-2"
                  >
                    <RotateCcw size={18} />
                    Revancha
                  </Button>
                  <Button
                    onClick={onPlayAgain}
                    variant="outline"
                    className="gap-2"
                  >
                    Nueva partida
                  </Button>
                </div>
              )}

              {rematchStatus === 'requested' && (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 text-(--color-text-muted)">
                    <Loader2 className="animate-spin" size={18} />
                    <span>Esperando respuesta de {opponentName || 'oponente'}...</span>
                  </div>
                  <Button
                    onClick={onDeclineRematch}
                    variant="ghost"
                    size="sm"
                  >
                    Cancelar
                  </Button>
                </div>
              )}

              {rematchStatus === 'received' && (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-(--color-accent) font-semibold">
                    ¡{opponentName || 'Tu oponente'} quiere la revancha!
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={onAcceptRematch}
                      variant="primary"
                      className="gap-2"
                    >
                      <Check size={18} />
                      Aceptar
                    </Button>
                    <Button
                      onClick={onDeclineRematch}
                      variant="ghost"
                    >
                      Rechazar
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          <Button
            onClick={onLeave}
            variant="destructive"
            className="gap-2"
          >
            <LogOut size={18} />
            {status === 'finished' ? 'Menú' : 'Abandonar'}
          </Button>
        </div>
      )}

      {/* Error with retry option */}
      {error && (
        <div className="mt-4 flex flex-col items-center gap-3">
          <p className="text-(--color-error) text-sm">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
          >
            Reintentar
          </Button>
        </div>
      )}

      {/* Leave Game Confirmation Modal */}
      <Modal open={showLeaveConfirm} onClose={onCancelLeave}>
        <ModalContent size="sm">
          <ModalHeader showClose={false}>
            <ModalTitle>¿Abandonar partida?</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <ModalDescription>
              Si abandonas ahora, perderás la partida y se contará como derrota.
            </ModalDescription>
          </ModalBody>
          <ModalFooter className="justify-end">
            <Button
              variant="ghost"
              onClick={onCancelLeave}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirmLeave}
            >
              Abandonar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Bet Negotiation Overlay */}
      {negotiation && onSubmitBetProposal && onAcceptBetProposal && onSkipBetting && (
        <BetNegotiationOverlay
          isOpen={status === 'negotiating' && negotiation.state === 'pending'}
          myProposal={negotiation.myProposal}
          opponentProposal={negotiation.opponentProposal}
          opponentName={opponentName || 'Oponente'}
          deadline={negotiation.deadline}
          balance={balance}
          negotiationState={negotiation.state}
          onAccept={onAcceptBetProposal}
          onCounterPropose={onSubmitBetProposal}
          onSkip={onSkipBetting}
        />
      )}
    </div>
  );
}

export default OnlineGame;
