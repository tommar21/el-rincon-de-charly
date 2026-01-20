'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ArrowLeft, Globe, Loader2, LogOut, Copy, Check, X } from 'lucide-react';
import { Board } from '../board';
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
import type { BoardState, WinResult } from '../../types';
import type { OnlineGameStatus } from '../../hooks/use-online-game';

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
  onCellClick: (index: number) => Promise<boolean>;
  onLeave: () => void;
  onConfirmLeave: () => void;
  onCancelLeave: () => void;
  onPlayAgain: () => void;
  onRetry: () => void;
  onBack?: () => void;
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
  onCellClick,
  onLeave,
  onConfirmLeave,
  onCancelLeave,
  onPlayAgain,
  onRetry,
  onBack,
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      {/* Back to Hub button */}
      {onBack && (
        <Button
          onClick={onLeave}
          variant="ghost"
          size="sm"
          className="absolute top-4 left-4 gap-2"
        >
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">Volver</span>
        </Button>
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
              <p className="text-(--color-text-muted)">Buscando partida...</p>
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
              <div className="relative">
                <Globe className="text-(--color-success)" size={48} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-(--color-success) rounded-full animate-ping" />
              </div>
              <p className="text-(--color-text-muted)">Esperando oponente...</p>

              {/* Share section */}
              {roomId && (
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
              )}

              <p className="text-sm text-(--color-text-muted) text-center max-w-xs">
                Comparte el link con un amigo, o espera a que alguien se una automáticamente.
              </p>

              {/* Prominent cancel button */}
              <Button
                onClick={onLeave}
                variant="ghost"
                className="mt-2 gap-2 text-(--color-text-muted) hover:text-(--color-error)"
              >
                <X size={18} />
                Cancelar búsqueda
              </Button>
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
                <p className="text-xl font-bold mb-4">
                  {isDraw ? (
                    <span className="text-(--color-accent)">¡Empate!</span>
                  ) : winner?.winner === mySymbol ? (
                    <span className="text-(--color-success)">¡Ganaste!</span>
                  ) : (
                    <span className="text-(--color-error)">Perdiste</span>
                  )}
                </p>
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
        <div className="mt-8 flex gap-4">
          {status === 'finished' && (
            <Button
              onClick={onPlayAgain}
              variant="primary"
              className="gap-2"
            >
              <RotateCcw size={18} />
              Jugar de nuevo
            </Button>
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
    </div>
  );
}

export default OnlineGame;
