import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, RefreshCw } from 'lucide-react';
import { Leaderboard } from './Leaderboard';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useAuth } from '../../auth/hooks/useAuth';
import { cn } from '../../../lib/utils';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeaderboardModal({ isOpen, onClose }: LeaderboardModalProps) {
  const { entries, isLoading, isConfigured, refetch } = useLeaderboard({ limit: 20 });
  const { user } = useAuth();

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
                  <Trophy className="text-yellow-400" size={24} />
                  <h2 className="text-xl font-bold text-gradient">
                    Ranking Global
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={refetch}
                    disabled={isLoading}
                    className={cn(
                      'text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1',
                      'disabled:opacity-50'
                    )}
                  >
                    <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={onClose}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {!isConfigured ? (
                  <div className="text-center py-8">
                    <Trophy className="mx-auto mb-4 text-[var(--color-text-muted)]" size={48} />
                    <p className="text-[var(--color-text-muted)]">
                      Leaderboard no disponible
                    </p>
                    <p className="text-sm text-[var(--color-text-muted)] mt-2">
                      Configura Supabase para habilitar el ranking global
                    </p>
                  </div>
                ) : (
                  <Leaderboard
                    entries={entries}
                    currentUserId={user?.id}
                    isLoading={isLoading}
                  />
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default LeaderboardModal;
