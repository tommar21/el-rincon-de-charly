import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { StatsDisplay } from './StatsDisplay';
import { useStatsStore } from '../store/statsStore';
import { cn } from '../../../lib/utils';
import { useState } from 'react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StatsModal({ isOpen, onClose }: StatsModalProps) {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const { resetStats, userId, isSyncing } = useStatsStore();

  const handleReset = () => {
    resetStats();
    setShowConfirmReset(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div
              className={cn(
                'bg-[var(--color-background)] rounded-2xl w-full max-w-lg max-h-[90vh]',
                'overflow-hidden flex flex-col'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--color-surface)]">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gradient">
                    Estadisticas
                  </h2>
                  {/* Sync indicator */}
                  {isSyncing ? (
                    <Loader2 size={16} className="animate-spin text-[var(--color-primary)]" />
                  ) : userId ? (
                    <span title="Sincronizado con la nube">
                      <Cloud size={16} className="text-green-400" />
                    </span>
                  ) : (
                    <span title="Solo local">
                      <CloudOff size={16} className="text-[var(--color-text-muted)]" />
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <StatsDisplay />
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[var(--color-surface)]">
                {!showConfirmReset ? (
                  <button
                    onClick={() => setShowConfirmReset(true)}
                    className={cn(
                      'flex items-center justify-center gap-2 w-full py-2 rounded-lg',
                      'text-red-400 hover:bg-red-400/10 transition-colors'
                    )}
                  >
                    <Trash2 size={18} />
                    Reiniciar estadisticas
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-center text-[var(--color-text-muted)]">
                      ¿Estas seguro? Esta accion no se puede deshacer.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowConfirmReset(false)}
                        className={cn(
                          'flex-1 py-2 rounded-lg',
                          'bg-[var(--color-surface)] text-[var(--color-text)]',
                          'hover:bg-[var(--color-surface)]/80 transition-colors'
                        )}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleReset}
                        className={cn(
                          'flex-1 py-2 rounded-lg',
                          'bg-red-500 text-white',
                          'hover:bg-red-600 transition-colors'
                        )}
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default StatsModal;
