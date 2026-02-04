'use client';

import { useMemo, useState, useCallback, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Hash,
  Circle,
  Crown,
  CircleDot,
  Gamepad2,
  Bot,
  Users,
  Wifi,
  Coins,
  Pyramid,
} from 'lucide-react';
import type { GameConfig } from '@/features/games/registry/types';
import { cn } from '@/lib/utils/cn';
import { useMotionConfig } from '@/hooks/use-motion-config';
import { TRANSITIONS } from '@/lib/theme/motion-defaults';

interface GameCardProps {
  game: GameConfig;
  index?: number;
  totalGames?: number;
}

// Iconos para cada juego
const gameIcons: Record<string, typeof Hash> = {
  'tic-tac-toe': Hash,
  'connect-4': Circle,
  chess: Crown,
  checkers: CircleDot,
  plinko: Pyramid,
};

export const GameCard = memo(function GameCard({ game, index = 0, totalGames = 1 }: GameCardProps) {
  const Icon = gameIcons[game.slug] || Gamepad2;
  const { shouldReduceMotion } = useMotionConfig();
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  // Handle tap on mobile: first tap expands, second tap navigates
  const handleClick = useCallback((e: React.MouseEvent) => {
    // Check if it's a touch device (no hover capability)
    const isTouchDevice = window.matchMedia('(hover: none)').matches;

    if (isTouchDevice) {
      if (!isExpanded) {
        e.preventDefault();
        setIsExpanded(true);
      } else {
        // Already expanded, navigate
        router.push(`/games/${game.slug}`);
      }
    }
    // On desktop, let the Link handle navigation normally
  }, [isExpanded, game.slug, router]);

  // Close expanded state when clicking outside (for mobile)
  const handleBlur = useCallback(() => {
    setTimeout(() => setIsExpanded(false), 200);
  }, []);

  const showExpand = isHovered || isExpanded;

  // Animation variants that respect reduced motion
  const cardVariants = useMemo(() => {
    if (shouldReduceMotion) {
      return {
        hidden: { opacity: 1 },
        visible: { opacity: 1 },
      };
    }
    return {
      hidden: { opacity: 0, y: 20 },
      visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
          delay: i * 0.1,
          ...TRANSITIONS.normal,
        },
      }),
    };
  }, [shouldReduceMotion]);

  // Player count string
  const playerCount = game.minPlayers === game.maxPlayers
    ? `${game.minPlayers}P`
    : `${game.minPlayers}-${game.maxPlayers}P`;

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      className={cn(
        'flex flex-col items-center -mx-2 -my-4 transition-all duration-200',
        showExpand ? 'z-50' : 'z-0'
      )}
    >
      <Link
        href={`/games/${game.slug}`}
        className="flex flex-col items-center group relative"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onBlur={handleBlur}
      >
        {/* Hexagon */}
        <motion.div
          className="relative"
          animate={shouldReduceMotion ? undefined : {
            scale: showExpand ? 1.08 : 1,
          }}
          transition={TRANSITIONS.fast}
        >
          <svg viewBox="0 0 100 115" className="w-32 h-36">
            {/* Hexagon shape */}
            <polygon
              points="50,0 100,28.75 100,86.25 50,115 0,86.25 0,28.75"
              className={cn(
                'fill-(--color-surface) stroke-(--color-border) stroke-2',
                'transition-all duration-300',
                showExpand && 'fill-(--color-primary)/10 stroke-(--color-primary)'
              )}
            />
          </svg>
          {/* Content inside hexagon */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <Icon size={32} className="text-(--color-primary)" strokeWidth={1.5} />
            <h3 className="font-semibold text-xs text-(--color-text) text-center px-2 leading-tight">
              {game.name}
            </h3>
          </div>
        </motion.div>

        {/* Hover/Tap Expand Card */}
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{
            opacity: showExpand ? 1 : 0,
            y: showExpand ? 0 : 10,
            scale: showExpand ? 1 : 0.95,
          }}
          transition={TRANSITIONS.fast}
          className={cn(
            'absolute top-full mt-1 z-10',
            'w-52 p-3 rounded-xl',
            'bg-(--color-surface) border border-(--color-primary)/30',
            'shadow-xl shadow-(--color-primary)/10',
            isExpanded ? 'pointer-events-auto' : 'pointer-events-none'
          )}
        >
          {/* Description */}
          <p className="text-xs text-(--color-text-muted) text-center mb-3">
            {game.description}
          </p>

          {/* Features Row */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-(--color-surface-hover) text-(--color-text-muted)">
              <Users size={12} />
              <span className="text-xs">{playerCount}</span>
            </div>

            {game.supportsAI && (
              <div className="p-1.5 rounded-full bg-(--color-primary)/10 text-(--color-primary)">
                <Bot size={14} />
              </div>
            )}
            {game.supportsOnline && (
              <div className="p-1.5 rounded-full bg-(--color-success)/10 text-(--color-success)">
                <Wifi size={14} />
              </div>
            )}
            {game.supportsBetting && (
              <div className="p-1.5 rounded-full bg-(--color-warning)/10 text-(--color-warning)">
                <Coins size={14} />
              </div>
            )}
          </div>

          {/* Tap to play indicator - only on mobile */}
          {isExpanded && (
            <div className="text-center">
              <span className="text-xs font-medium text-(--color-primary) animate-pulse">
                Toca de nuevo para jugar →
              </span>
            </div>
          )}
        </motion.div>
      </Link>
    </motion.div>
  );
});
