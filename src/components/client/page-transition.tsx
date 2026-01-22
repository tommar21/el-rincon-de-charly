'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode, useMemo } from 'react';
import { useMotionConfig } from '@/hooks/use-motion-config';
import {
  pageVariants as defaultPageVariants,
  TRANSITIONS,
  getReducedMotionTransition,
  getReducedMotionVariants,
} from '@/lib/theme/motion-defaults';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const { shouldReduceMotion } = useMotionConfig();

  // Skip animations for game routes to prevent flickering
  // Game routes have their own loading states and transitions
  const isGameRoute = pathname?.startsWith('/games/');

  // Memoize variants and transition based on reduced motion preference
  const pageVariants = useMemo(
    () => getReducedMotionVariants(shouldReduceMotion, defaultPageVariants),
    [shouldReduceMotion]
  );

  const pageTransition = useMemo(
    () => getReducedMotionTransition(shouldReduceMotion, TRANSITIONS.page),
    [shouldReduceMotion]
  );

  // For game routes, render without animation wrapper
  if (isGameRoute) {
    return <div className="min-h-full">{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
        transition={pageTransition}
        className="min-h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default PageTransition;
