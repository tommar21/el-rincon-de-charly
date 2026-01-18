'use client';

import { User, LogOut, BarChart3, Trophy, ChevronUp, Settings } from 'lucide-react';
import { useAuth } from '../hooks/use-auth';
import { AuthModal } from './auth-modal';
import { StatsModal, LeaderboardModal } from '@/features/profile';
import { SettingsModal } from '@/features/settings';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils/cn';
import { useModals } from '@/hooks/use-modals';

interface UserMenuProps {
  className?: string;
  compact?: boolean;
}

const MODAL_NAMES = ['auth', 'stats', 'leaderboard', 'settings'] as const;

export function UserMenu({ className, compact = false }: UserMenuProps) {
  const modals = useModals(MODAL_NAMES);
  const { isAuthenticated, profile, signOut, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn(
        'w-10 h-10 rounded-lg',
        'bg-linear-to-br from-primary/20 to-secondary/20',
        'animate-pulse',
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
            compact ? 'w-10 h-10' : 'gap-2',
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

  // Show user menu if authenticated
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {compact ? (
            <Button
              variant="ghost"
              size="icon"
              className={cn('w-10 h-10 p-0', className)}
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-(--color-primary) text-white font-bold">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
            </Button>
          ) : (
            <Button
              variant="outline"
              className={cn(
                'gap-2 px-2 py-1.5 h-auto',
                'hover:border-primary/50',
                className
              )}
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-(--color-primary) text-white text-xs font-bold">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium max-w-[100px] truncate">
                {profile?.username || 'Usuario'}
              </span>
              <ChevronUp size={14} className="text-(--color-text-muted)" />
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align={compact ? 'center' : 'end'}
          className="w-48"
        >
          <DropdownMenuItem onClick={() => modals.open('stats')}>
            <BarChart3 size={16} className="mr-2" />
            Mis Estadisticas
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => modals.open('leaderboard')}>
            <Trophy size={16} className="mr-2" />
            Ranking Global
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => modals.open('settings')}>
            <Settings size={16} className="mr-2" />
            Configuración
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={signOut}
            className="text-(--color-error) focus:text-(--color-error)"
          >
            <LogOut size={16} className="mr-2" />
            Cerrar Sesion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Stats Modal */}
      <StatsModal
        isOpen={modals.isOpen('stats')}
        onClose={() => modals.close('stats')}
      />

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={modals.isOpen('leaderboard')}
        onClose={() => modals.close('leaderboard')}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={modals.isOpen('settings')}
        onClose={() => modals.close('settings')}
      />
    </>
  );
}

export default UserMenu;
