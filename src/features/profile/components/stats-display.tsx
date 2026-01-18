'use client';

import { motion } from 'framer-motion';
import { Trophy, Target, Flame, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { useStatsStore, getWinRate, formatPlayTime } from '../store/stats-store';
import { cn } from '@/lib/utils/cn';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
}

function StatCard({ icon, label, value, subValue, color = 'var(--color-primary)' }: StatCardProps) {
  return (
    <motion.div
      className={cn(
        'relative flex flex-col p-4 rounded-2xl overflow-hidden',
        'bg-background/50 border border-border/30',
        'hover:border-border/50 transition-colors'
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      {/* Subtle glow */}
      <div
        className="absolute top-0 right-0 w-20 h-20 opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 100% 0%, ${color} 0%, transparent 70%)`,
          filter: 'blur(20px)',
        }}
      />
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: `${color}15`, color }}
      >
        {icon}
      </div>
      <p className="text-3xl font-bold text-(--color-text)">{value}</p>
      <p className="text-sm text-(--color-text-muted) mt-1">{label}</p>
      {subValue && (
        <p className="text-xs text-(--color-text-muted) mt-0.5">{subValue}</p>
      )}
    </motion.div>
  );
}

interface StatsDisplayProps {
  className?: string;
}

export function StatsDisplay({ className }: StatsDisplayProps) {
  const { stats, recentGames, isSyncing } = useStatsStore();
  const winRate = getWinRate(stats);

  return (
    <div className={cn('space-y-6 relative', className)}>
      {/* Loading overlay when syncing from cloud - pointer-events-none allows interaction during sync */}
      {isSyncing && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-lg pointer-events-none">
          <div className="flex items-center gap-2 text-(--color-text-muted)">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Sincronizando...</span>
          </div>
        </div>
      )}
      {/* Main stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          icon={<Target size={24} />}
          label="Partidas"
          value={stats.gamesPlayed}
          color="var(--color-primary)"
        />
        <StatCard
          icon={<Trophy size={24} />}
          label="Victorias"
          value={stats.gamesWon}
          subValue={`${winRate}% win rate`}
          color="var(--color-success)"
        />
        <StatCard
          icon={<Flame size={24} />}
          label="Racha actual"
          value={stats.winStreak}
          subValue={`Mejor: ${stats.bestWinStreak}`}
          color="var(--color-warning)"
        />
        <StatCard
          icon={<TrendingUp size={24} />}
          label="Derrotas"
          value={stats.gamesLost}
          color="var(--color-error)"
        />
        <StatCard
          icon={<Target size={24} />}
          label="Empates"
          value={stats.gamesDraw}
          color="var(--color-text-muted)"
        />
        <StatCard
          icon={<Clock size={24} />}
          label="Tiempo jugado"
          value={formatPlayTime(stats.totalPlayTime)}
          color="var(--color-secondary)"
        />
      </div>

      {/* Stats by opponent */}
      {Object.keys(stats.byOpponent).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-(--color-text-muted) uppercase tracking-wide">
            Por oponente
          </h3>
          <div className="space-y-2">
            {Object.entries(stats.byOpponent).map(([opponent, data], index) => {
              const opponentWinRate = data.played > 0
                ? Math.round((data.won / data.played) * 100)
                : 0;

              return (
                <motion.div
                  key={opponent}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-xl',
                    'bg-background/50 border border-border/30'
                  )}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <span className="text-(--color-text) font-medium capitalize">
                    {opponent.replace('ai_', 'IA ').replace('human', 'Humano')}
                  </span>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="px-2 py-0.5 rounded-md bg-(--color-success)/10 text-(--color-success) font-medium">{data.won}W</span>
                    <span className="px-2 py-0.5 rounded-md bg-(--color-error)/10 text-(--color-error) font-medium">{data.lost}L</span>
                    <span className="px-2 py-0.5 rounded-md bg-(--color-text-muted)/10 text-(--color-text-muted) font-medium">{data.draw}D</span>
                    <span className="text-(--color-primary) font-bold ml-2">
                      {opponentWinRate}%
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent games */}
      {recentGames.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-(--color-text-muted) uppercase tracking-wide">
            Partidas recientes
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentGames.slice(0, 10).map((game, index) => (
              <motion.div
                key={game.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl',
                  'bg-background/50 border border-border/30',
                  'hover:bg-(--color-background) transition-colors'
                )}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold',
                      game.result === 'win' && 'bg-(--color-success)/15 text-(--color-success)',
                      game.result === 'loss' && 'bg-(--color-error)/15 text-(--color-error)',
                      game.result === 'draw' && 'bg-(--color-warning)/15 text-(--color-warning)'
                    )}
                  >
                    {game.result === 'win' ? 'W' : game.result === 'loss' ? 'L' : 'D'}
                  </span>
                  <div>
                    <p className="text-(--color-text) text-sm font-medium capitalize">
                      vs {game.opponentType.replace('ai_', 'IA ').replace('human', 'Humano')}
                    </p>
                    <p className="text-xs text-(--color-text-muted)">
                      {game.moves} movimientos
                    </p>
                  </div>
                </div>
                <span className="text-xs text-(--color-text-muted)">
                  {new Date(game.createdAt).toLocaleDateString()}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {stats.gamesPlayed === 0 && (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-background/50 flex items-center justify-center">
            <Trophy className="text-(--color-text-muted)" size={40} />
          </div>
          <p className="text-(--color-text) font-medium">
            Aun no has jugado ninguna partida
          </p>
          <p className="text-sm text-(--color-text-muted) mt-1">
            ¡Empieza a jugar para ver tus estadisticas!
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default StatsDisplay;
