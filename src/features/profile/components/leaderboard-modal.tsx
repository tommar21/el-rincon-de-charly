'use client';

import { RefreshCw, Trophy } from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalTitle, ModalDescription } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Leaderboard } from './leaderboard';
import { useLeaderboard } from '../hooks/use-leaderboard';
import { useAuth } from '@/features/auth/hooks/use-auth';

/**
 * LeaderboardModal Component
 *
 * MEJORAS:
 * - Usa el Modal component unificado (FIX: border visible en header)
 * - Botón de refresh con Button component (icon variant)
 * - Estructura más limpia con subcomponentes de Modal
 */

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeaderboardModal({ isOpen, onClose }: LeaderboardModalProps) {
  const { entries, isLoading, error, refetch } = useLeaderboard({ limit: 20 });
  const { user } = useAuth();

  return (
    <Modal open={isOpen} onClose={onClose}>
      <ModalContent size="lg">
        {/* Header con ícono Trophy y botón refresh */}
        <ModalHeader showClose={false}>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-(--color-warning)/20 flex items-center justify-center">
                <Trophy className="text-(--color-warning)" size={24} />
              </div>
              <div>
                <ModalTitle>Ranking Global</ModalTitle>
                <ModalDescription>Los mejores jugadores</ModalDescription>
              </div>
            </div>

            {/* Botones: Refresh + Close */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                scale="subtle"
                onClick={refetch}
                disabled={isLoading}
                aria-label="Actualizar ranking"
              >
                <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                scale="subtle"
                onClick={onClose}
                aria-label="Cerrar"
              >
                <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
                </svg>
              </Button>
            </div>
          </div>
        </ModalHeader>

        {/* Content */}
        <ModalBody>
          {error ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <p className="text-(--color-error) text-sm">{error}</p>
              <Button variant="outline" size="sm" onClick={refetch}>
                Reintentar
              </Button>
            </div>
          ) : (
            <Leaderboard
              entries={entries}
              currentUserId={user?.id}
              isLoading={isLoading}
            />
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default LeaderboardModal;
