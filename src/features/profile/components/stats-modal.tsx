'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Cloud, CloudOff, Loader2, BarChart3 } from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalTitle, ModalDescription } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { StatsDisplay } from './stats-display';
import { useStatsStore } from '../store/stats-store';
import { cn } from '@/lib/utils';
import { useMotionConfig } from '@/hooks/use-motion-config';
import { TRANSITIONS } from '@/lib/theme/motion-defaults';

/**
 * StatsModal Component
 *
 * MEJORAS:
 * - Usa el Modal component unificado (FIX: border visible en header)
 * - Usa Button component con variantes (destructive para reset)
 * - Mantiene AnimatePresence para la confirmación
 */

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StatsModal({ isOpen, onClose }: StatsModalProps) {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const { resetStats, userId, isSyncing, isResetting } = useStatsStore();
  const { shouldReduceMotion } = useMotionConfig();

  // Animation variants that respect reduced motion
  const animationVariants = useMemo(() => {
    if (shouldReduceMotion) {
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
      };
    }
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }, [shouldReduceMotion]);

  const slideVariants = useMemo(() => {
    if (shouldReduceMotion) {
      return {
        initial: { opacity: 1, y: 0 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 1, y: 0 },
      };
    }
    return {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -10 },
    };
  }, [shouldReduceMotion]);

  const handleReset = async () => {
    await resetStats();
    setShowConfirmReset(false);
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <ModalContent size="lg">
        {/* Header con ícono y sync indicator */}
        <ModalHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <BarChart3 className="text-(--color-accent)" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <ModalTitle>Estadisticas</ModalTitle>
                {/* Sync indicator */}
                {isSyncing ? (
                  <Loader2 size={14} className="animate-spin text-(--color-primary)" />
                ) : userId ? (
                  <span title="Sincronizado con la nube">
                    <Cloud size={14} className="text-(--color-success)" />
                  </span>
                ) : (
                  <span title="Solo local">
                    <CloudOff size={14} className="text-(--color-text-muted)" />
                  </span>
                )}
              </div>
              <ModalDescription>Tu historial de partidas</ModalDescription>
            </div>
          </div>
        </ModalHeader>

        {/* Content */}
        <ModalBody>
          <StatsDisplay />
        </ModalBody>

        {/* Footer con botón de reset */}
        <ModalFooter className="flex-col items-stretch">
          <AnimatePresence mode="wait">
            {!showConfirmReset ? (
              <motion.div
                key="reset-btn"
                initial={animationVariants.initial}
                animate={animationVariants.animate}
                exit={animationVariants.exit}
                transition={TRANSITIONS.fast}
                className="w-full"
              >
                <Button
                  variant="outline"
                  size="default"
                  scale="subtle"
                  onClick={() => setShowConfirmReset(true)}
                  icon={<Trash2 size={18} />}
                  className={cn(
                    'w-full',
                    'text-(--color-error) hover:text-(--color-error)',
                    'border-(--color-error)/20 hover:border-(--color-error)/40',
                    'hover:bg-(--color-error)/10'
                  )}
                >
                  Reiniciar estadisticas
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="confirm"
                initial={slideVariants.initial}
                animate={slideVariants.animate}
                exit={slideVariants.exit}
                transition={TRANSITIONS.fast}
                className="space-y-3 w-full"
              >
                <p className="text-sm text-center text-(--color-text-muted)">
                  ¿Estas seguro? Esta accion no se puede deshacer.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    size="default"
                    scale="subtle"
                    onClick={() => setShowConfirmReset(false)}
                    disabled={isResetting}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    size="default"
                    scale="subtle"
                    onClick={handleReset}
                    disabled={isResetting}
                    icon={isResetting ? <Loader2 size={16} className="animate-spin" /> : undefined}
                    className="flex-1"
                  >
                    {isResetting ? 'Reiniciando...' : 'Confirmar'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default StatsModal;
