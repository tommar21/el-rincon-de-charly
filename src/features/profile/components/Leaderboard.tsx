import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, User } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface LeaderboardEntry {
  id: string;
  username: string;
  avatarUrl?: string;
  gamesWon: number;
  gamesPlayed: number;
  winRate: number;
  rank: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  isLoading?: boolean;
  className?: string;
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="text-yellow-400" size={20} />;
    case 2:
      return <Medal className="text-gray-300" size={20} />;
    case 3:
      return <Medal className="text-amber-600" size={20} />;
    default:
      return <span className="text-[var(--color-text-muted)] text-sm font-semibold">{rank}</span>;
  }
}

function getRankBgColor(rank: number) {
  switch (rank) {
    case 1:
      return 'bg-yellow-500/10 border-yellow-500/30';
    case 2:
      return 'bg-gray-400/10 border-gray-400/30';
    case 3:
      return 'bg-amber-600/10 border-amber-600/30';
    default:
      return 'bg-[var(--color-surface)] border-transparent';
  }
}

export function Leaderboard({
  entries,
  currentUserId,
  isLoading,
  className,
}: LeaderboardProps) {
  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-[var(--color-surface)] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Trophy className="mx-auto mb-4 text-[var(--color-text-muted)]\" size={48} />
        <p className="text-[var(--color-text-muted)]">
          Aun no hay datos de ranking
        </p>
        <p className="text-sm text-[var(--color-text-muted)]">
          Juega partidas para aparecer en el leaderboard
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {entries.map((entry, index) => {
        const isCurrentUser = entry.id === currentUserId;

        return (
          <motion.div
            key={entry.id}
            className={cn(
              'flex items-center gap-4 p-4 rounded-xl border',
              getRankBgColor(entry.rank),
              isCurrentUser && 'ring-2 ring-[var(--color-primary)]'
            )}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {/* Rank */}
            <div className="w-8 flex items-center justify-center">
              {getRankIcon(entry.rank)}
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-[var(--color-surface)] flex items-center justify-center overflow-hidden">
              {entry.avatarUrl ? (
                <img
                  src={entry.avatarUrl}
                  alt={entry.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="text-[var(--color-text-muted)]" size={20} />
              )}
            </div>

            {/* User info */}
            <div className="flex-1 min-w-0">
              <p className={cn(
                'font-semibold truncate',
                isCurrentUser ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'
              )}>
                {entry.username}
                {isCurrentUser && ' (Tu)'}
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                {entry.gamesPlayed} partidas
              </p>
            </div>

            {/* Stats */}
            <div className="text-right">
              <p className="font-bold text-green-400">
                {entry.gamesWon} W
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                {entry.winRate}%
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default Leaderboard;
