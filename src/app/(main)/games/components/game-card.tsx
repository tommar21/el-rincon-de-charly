'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Hash, Circle, Crown, CircleDot, Gamepad2, Bot, Users, Wifi, Coins } from 'lucide-react';
import type { GameConfig } from '@/features/games/registry/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import { useMotionConfig } from '@/hooks/use-motion-config';
import { cardItemVariants, TRANSITIONS } from '@/lib/theme/motion-defaults';

interface GameCardProps {
  game: GameConfig;
  index?: number;
}

// Iconos para cada juego
const gameIcons: Record<string, typeof Hash> = {
  'tic-tac-toe': Hash,
  'connect-4': Circle,
  chess: Crown,
  checkers: CircleDot,
};

export function GameCard({ game, index = 0 }: GameCardProps) {
  const Icon = gameIcons[game.slug] || Gamepad2;
  const { shouldReduceMotion } = useMotionConfig();

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

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
    >
      <Link href={`/games/${game.slug}`} className="block group">
        <Card className={cn(
          'overflow-hidden',
          'transition-all duration-200',
          'hover:border-primary/50',
          'hover:shadow-lg hover:shadow-(--color-primary)/5',
          'group-hover:scale-[1.02]'
        )}>
          {/* Thumbnail */}
          <div className={cn(
            'aspect-4/3 flex items-center justify-center',
            'bg-linear-to-br from-primary/10 to-secondary/10',
            'relative overflow-hidden'
          )}>
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-[0.03]">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, var(--color-text) 1px, transparent 0)`,
                backgroundSize: '24px 24px'
              }} />
            </div>

            {/* Icon */}
            <motion.div
              className="relative z-10"
              whileHover={shouldReduceMotion ? undefined : { scale: 1.1, rotate: 5 }}
              transition={TRANSITIONS.fast}
            >
              <Icon size={56} className="text-(--color-primary)" strokeWidth={1.5} />
            </motion.div>
          </div>

          {/* Content */}
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg text-(--color-text) mb-1">
              {game.name}
            </h3>
            <p className="text-sm text-(--color-text-muted) line-clamp-2 mb-3">
              {game.description}
            </p>

            {/* Tags/Badges */}
            <div className="flex flex-wrap gap-1.5">
              {game.supportsAI && (
                <Badge variant="primary" className="text-xs gap-1">
                  <Bot size={12} />
                  VS IA
                </Badge>
              )}
              {game.minPlayers >= 2 && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Users size={12} />
                  {game.minPlayers}-{game.maxPlayers}P
                </Badge>
              )}
              {game.supportsOnline && (
                <Badge variant="success" className="text-xs gap-1">
                  <Wifi size={12} />
                  Online
                </Badge>
              )}
              {game.supportsBetting && (
                <Badge variant="warning" className="text-xs gap-1">
                  <Coins size={12} />
                  Casino
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
