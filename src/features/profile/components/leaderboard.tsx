'use client';

import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { LeaderboardEntry } from '../types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  isLoading?: boolean;
  className?: string;
}

function getRankDisplay(rank: number) {
  switch (rank) {
    case 1:
      return {
        icon: <Crown className="text-(--color-warning)" size={18} />,
        bg: 'bg-(--color-warning)/10 border-(--color-warning)/30',
        glow: null,
      };
    case 2:
      return {
        icon: <Medal className="text-(--color-text-muted)" size={18} />,
        bg: 'bg-(--color-text-muted)/10 border-(--color-text-muted)/30',
        glow: null,
      };
    case 3:
      return {
        icon: <Medal className="text-(--color-warning-muted)" size={18} />,
        bg: 'bg-(--color-warning-muted)/10 border-(--color-warning-muted)/30',
        glow: null,
      };
    default:
      return {
        icon: <span className="text-(--color-text-muted) text-sm font-bold">{rank}</span>,
        bg: 'bg-(--color-surface) border-transparent',
        glow: null,
      };
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
          <motion.div
            key={i}
            className="h-[72px] rounded-2xl bg-(--color-background)/50 border border-(--color-border)/30"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
          />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <motion.div
        className={cn('text-center py-12', className)}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-(--color-background)/50 flex items-center justify-center">
          <Trophy className="text-(--color-text-muted)" size={40} />
        </div>
        <p className="text-(--color-text) font-medium">
          Aun no hay datos de ranking
        </p>
        <p className="text-sm text-(--color-text-muted) mt-1">
          Juega partidas para aparecer en el leaderboard
        </p>
      </motion.div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {entries.map((entry, index) => {
        const isCurrentUser = entry.id === currentUserId;
        const rankDisplay = getRankDisplay(entry.rank);

        return (
          <motion.div
            key={entry.id}
            className={cn(
              'relative flex items-center gap-4 p-4 rounded-2xl border overflow-hidden',
              rankDisplay.bg,
              isCurrentUser && 'ring-2 ring-(--color-primary) ring-offset-2 ring-offset-(--color-surface)'
            )}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ x: 4 }}
          >
            {/* Glow for top 3 - FIX: Usa CSS variables en lugar de hardcoded */}
            {entry.rank <= 3 && (
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  background: entry.rank === 1
                    ? 'radial-gradient(circle at 0% 50%, var(--color-warning) 0%, transparent 50%)'
                    : entry.rank === 2
                    ? 'radial-gradient(circle at 0% 50%, var(--color-text-muted) 0%, transparent 50%)'
                    : 'radial-gradient(circle at 0% 50%, var(--color-warning-muted) 0%, transparent 50%)',
                }}
              />
            )}

            {/* Rank */}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-(--color-background)/50">
              {rankDisplay.icon}
            </div>

            {/* Avatar */}
            <div className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden',
              'bg-gradient-to-br from-(--color-primary)/20 to-(--color-secondary)/20',
              'border border-(--color-border)/30'
            )}>
              {entry.avatarUrl ? (
                <img
                  src={entry.avatarUrl}
                  alt={entry.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-(--color-primary) font-bold">
                  {entry.username?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
            </div>

            {/* User info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={cn(
                  'font-semibold truncate',
                  isCurrentUser ? 'text-(--color-primary)' : 'text-(--color-text)'
                )}>
                  {entry.username}
                </p>
                {isCurrentUser && (
                  <span className="px-2 py-0.5 rounded-md bg-(--color-primary)/20 text-(--color-primary) text-xs font-medium">
                    Tu
                  </span>
                )}
                {entry.rank === 1 && (
                  <Sparkles size={14} className="text-(--color-warning)" />
                )}
              </div>
              <p className="text-sm text-(--color-text-muted)">
                {entry.gamesPlayed} partidas jugadas
              </p>
            </div>

            {/* Stats */}
            <div className="text-right">
              <p className="font-bold text-lg text-(--color-success)">
                {entry.gamesWon}
                <span className="text-xs font-medium ml-1">W</span>
              </p>
              <p className="text-sm text-(--color-text-muted)">
                {entry.winRate}% win
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default Leaderboard;
