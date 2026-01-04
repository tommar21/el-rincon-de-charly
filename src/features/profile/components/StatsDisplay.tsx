import { motion } from 'framer-motion';
import { Trophy, Target, Flame, Clock, TrendingUp } from 'lucide-react';
import { useStatsStore, getWinRate, formatPlayTime } from '../store/statsStore';
import { cn } from '../../../lib/utils';

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
        'flex items-center gap-3 p-4 rounded-xl',
        'bg-[var(--color-surface)]'
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div
        className="p-2 rounded-lg"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-[var(--color-text)]">{value}</p>
        <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
        {subValue && (
          <p className="text-xs text-[var(--color-text-muted)]">{subValue}</p>
        )}
      </div>
    </motion.div>
  );
}

interface StatsDisplayProps {
  className?: string;
}

export function StatsDisplay({ className }: StatsDisplayProps) {
  const { stats, recentGames } = useStatsStore();
  const winRate = getWinRate(stats);

  return (
    <div className={cn('space-y-6', className)}>
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
          color="#22c55e"
        />
        <StatCard
          icon={<Flame size={24} />}
          label="Racha actual"
          value={stats.winStreak}
          subValue={`Mejor: ${stats.bestWinStreak}`}
          color="#f59e0b"
        />
        <StatCard
          icon={<TrendingUp size={24} />}
          label="Derrotas"
          value={stats.gamesLost}
          color="#ef4444"
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
          <h3 className="text-lg font-semibold text-[var(--color-text)]">
            Por oponente
          </h3>
          <div className="space-y-2">
            {Object.entries(stats.byOpponent).map(([opponent, data]) => {
              const opponentWinRate = data.played > 0
                ? Math.round((data.won / data.played) * 100)
                : 0;

              return (
                <div
                  key={opponent}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg',
                    'bg-[var(--color-surface)]'
                  )}
                >
                  <span className="text-[var(--color-text)] capitalize">
                    {opponent.replace('ai_', 'IA ').replace('human', 'Humano')}
                  </span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-400">{data.won}W</span>
                    <span className="text-red-400">{data.lost}L</span>
                    <span className="text-[var(--color-text-muted)]">{data.draw}D</span>
                    <span className="text-[var(--color-primary)] font-semibold">
                      {opponentWinRate}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent games */}
      {recentGames.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[var(--color-text)]">
            Partidas recientes
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentGames.slice(0, 10).map((game) => (
              <div
                key={game.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg',
                  'bg-[var(--color-surface)]'
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                      game.result === 'win' && 'bg-green-500/20 text-green-400',
                      game.result === 'loss' && 'bg-red-500/20 text-red-400',
                      game.result === 'draw' && 'bg-yellow-500/20 text-yellow-400'
                    )}
                  >
                    {game.result === 'win' ? 'W' : game.result === 'loss' ? 'L' : 'D'}
                  </span>
                  <div>
                    <p className="text-[var(--color-text)] text-sm capitalize">
                      vs {game.opponentType.replace('ai_', 'IA ').replace('human', 'Humano')}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {game.moves} movimientos
                    </p>
                  </div>
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {new Date(game.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {stats.gamesPlayed === 0 && (
        <div className="text-center py-8">
          <Trophy className="mx-auto mb-4 text-[var(--color-text-muted)]" size={48} />
          <p className="text-[var(--color-text-muted)]">
            Aun no has jugado ninguna partida
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">
            ¡Empieza a jugar para ver tus estadisticas!
          </p>
        </div>
      )}
    </div>
  );
}

export default StatsDisplay;
