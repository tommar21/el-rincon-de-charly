import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Trophy, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AuthModal } from './AuthModal';
import { cn } from '../../../lib/utils';

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, isConfigured, profile, signOut, isLoading } = useAuth();

  // Don't show anything if Supabase is not configured
  if (!isConfigured) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn('w-10 h-10 rounded-full bg-[var(--color-surface)] animate-pulse', className)} />
    );
  }

  // Show login button if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-[var(--color-primary)] text-black font-semibold',
            'hover:brightness-110 transition-all',
            'hover:scale-105 active:scale-95',
            className
          )}
        >
          <User size={18} />
          <span className="hidden sm:inline">Iniciar Sesion</span>
        </button>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </>
    );
  }

  // Show user menu if authenticated
  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg',
          'bg-[var(--color-surface)] hover:bg-[var(--color-surface)]/80',
          'transition-all'
        )}
      >
        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-black font-bold">
          {profile?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        <span className="hidden sm:inline text-[var(--color-text)] font-medium">
          {profile?.username || 'User'}
        </span>
      </button>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Dropdown menu */}
            <motion.div
              className={cn(
                'absolute right-0 top-full mt-2 z-50',
                'w-48 py-2 rounded-lg',
                'bg-[var(--color-surface)] shadow-lg',
                'border border-[var(--color-text-muted)]/10'
              )}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="px-4 py-2 border-b border-[var(--color-text-muted)]/10">
                <p className="font-semibold text-[var(--color-text)]">
                  {profile?.username}
                </p>
              </div>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  // TODO: Navigate to stats
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2',
                  'text-[var(--color-text)] hover:bg-[var(--color-background)]',
                  'transition-colors'
                )}
              >
                <Trophy size={18} />
                Estadisticas
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  // TODO: Navigate to settings
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2',
                  'text-[var(--color-text)] hover:bg-[var(--color-background)]',
                  'transition-colors'
                )}
              >
                <Settings size={18} />
                Configuracion
              </button>

              <div className="border-t border-[var(--color-text-muted)]/10 mt-2 pt-2">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    signOut();
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2',
                    'text-red-400 hover:bg-red-400/10',
                    'transition-colors'
                  )}
                >
                  <LogOut size={18} />
                  Cerrar Sesion
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default UserMenu;
