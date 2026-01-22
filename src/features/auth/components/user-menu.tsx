'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { User, LogOut, BarChart3, Trophy, ChevronDown, Settings, Gem, Wallet } from 'lucide-react';
import { useAuth } from '../hooks/use-auth';
import { useWalletStore, formatBalance } from '@/features/wallet/store/wallet-store';

// Dynamic imports for modals - reduces initial bundle size
const AuthModal = dynamic(() => import('./auth-modal').then(m => m.AuthModal), { ssr: false });
const StatsModal = dynamic(() => import('@/features/profile').then(m => m.StatsModal), { ssr: false });
const LeaderboardModal = dynamic(() => import('@/features/profile').then(m => m.LeaderboardModal), { ssr: false });
const SettingsModal = dynamic(() => import('@/features/settings').then(m => m.SettingsModal), { ssr: false });
const WalletModal = dynamic(() => import('@/features/wallet').then(m => m.WalletModal), { ssr: false });
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils/cn';
import { useModals } from '@/hooks/use-modals';

interface UserMenuProps {
  className?: string;
  compact?: boolean;
  showBalance?: boolean;
}

const MODAL_NAMES = ['auth', 'stats', 'leaderboard', 'settings', 'wallet'] as const;

export function UserMenu({ className, compact = false, showBalance = true }: UserMenuProps) {
  const modals = useModals(MODAL_NAMES);
  const { isAuthenticated, profile, signOut, isLoading, user } = useAuth();
  const { wallet, isLoading: walletLoading, loadWallet } = useWalletStore();

  // Load wallet when user logs in
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadWallet(user.id);
    }
  }, [isAuthenticated, user?.id, loadWallet]);

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn(
        'h-10 rounded-full',
        'bg-linear-to-br from-primary/20 to-secondary/20',
        'animate-pulse',
        compact ? 'w-10' : 'w-32',
        className
      )} />
    );
  }

  // Show login button if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <Button
          onClick={() => modals.open('auth')}
          variant="primary"
          size={compact ? 'icon' : 'default'}
          className={cn(
            compact ? 'w-10 h-10 rounded-full' : 'gap-2 rounded-full px-4',
            className
          )}
        >
          <User size={compact ? 18 : 16} />
          {!compact && <span>Iniciar</span>}
        </Button>
        <AuthModal isOpen={modals.isOpen('auth')} onClose={() => modals.close('auth')} />
      </>
    );
  }

  const userInitial = profile?.username?.[0]?.toUpperCase() || 'U';
  const balance = wallet?.balance ?? 0;

  // Show user menu if authenticated
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {compact ? (
            <Button
              variant="ghost"
              size="icon"
              className={cn('w-10 h-10 p-0 rounded-full', className)}
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-(--color-primary) text-white font-bold">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
            </Button>
          ) : (
            <button
              className={cn(
                'flex items-center gap-3 rounded-full',
                'bg-(--color-surface) border border-(--color-border)',
                'hover:border-primary/50 hover:bg-(--color-surface-hover)',
                'transition-all duration-200',
                'pr-3 pl-1 py-1',
                className
              )}
            >
              {/* Avatar */}
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-(--color-primary) text-white text-sm font-bold">
                  {userInitial}
                </AvatarFallback>
              </Avatar>

              {/* Separator */}
              {showBalance && (
                <div className="w-px h-5 bg-(--color-border) -ml-1" />
              )}

              {/* Balance - only show if showBalance is true */}
              {showBalance && (
                <div className="flex items-center gap-1.5 -ml-1">
                  <Gem size={14} className="text-(--color-warning)" />
                  <span className="text-sm font-semibold tabular-nums text-(--color-text)">
                    {walletLoading ? '...' : formatBalance(balance)}
                  </span>
                </div>
              )}

              {/* Username if no balance shown */}
              {!showBalance && (
                <span className="text-sm font-medium max-w-[80px] truncate text-(--color-text)">
                  {profile?.username || 'Usuario'}
                </span>
              )}

              <ChevronDown size={14} className="text-(--color-text-muted)" />
            </button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align={compact ? 'center' : 'end'}
          className="w-52"
        >
          {/* User Info Header */}
          <DropdownMenuLabel className="flex items-center gap-3 py-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-(--color-primary) text-white font-bold">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-(--color-text) truncate">
                {profile?.username || 'Usuario'}
              </span>
              <span className="text-xs text-(--color-text-muted)">
                {formatBalance(balance)} monedas
              </span>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Wallet */}
          <DropdownMenuItem onClick={() => modals.open('wallet')}>
            <Wallet size={16} className="mr-2 text-(--color-warning)" />
            Billetera
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Stats & Ranking */}
          <DropdownMenuItem onClick={() => modals.open('stats')}>
            <BarChart3 size={16} className="mr-2" />
            Mis Estadísticas
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => modals.open('leaderboard')}>
            <Trophy size={16} className="mr-2" />
            Ranking Global
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Settings */}
          <DropdownMenuItem onClick={() => modals.open('settings')}>
            <Settings size={16} className="mr-2" />
            Configuración
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Logout */}
          <DropdownMenuItem
            onClick={signOut}
            className="text-(--color-error) focus:text-(--color-error)"
          >
            <LogOut size={16} className="mr-2" />
            Cerrar Sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modals */}
      <StatsModal
        isOpen={modals.isOpen('stats')}
        onClose={() => modals.close('stats')}
      />
      <LeaderboardModal
        isOpen={modals.isOpen('leaderboard')}
        onClose={() => modals.close('leaderboard')}
      />
      <SettingsModal
        isOpen={modals.isOpen('settings')}
        onClose={() => modals.close('settings')}
      />
      <WalletModal
        isOpen={modals.isOpen('wallet')}
        onClose={() => modals.close('wallet')}
      />
    </>
  );
}

export default UserMenu;
