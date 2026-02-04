import type { RowCount, PhysicsConfig, BallSpeed } from '../types';

/**
 * Speed configuration for ball drops
 * initial: starting velocity (y-axis)
 * max: maximum velocity cap
 */
export const SPEED_CONFIG: Record<BallSpeed, { initial: number; max: number; label: string }> = {
  slow:   { initial: 2, max: 4,  label: 'Lenta' },
  normal: { initial: 3, max: 6,  label: 'Normal' },
  fast:   { initial: 5, max: 10, label: 'Rápida' },
};

/**
 * Desktop physics configuration (viewport width > 500px)
 * [ballSize, pinGap, pinSize, forceNeeded, velocityNeeded]
 */
const DESKTOP_CONFIG: Record<RowCount, [number, number, number, number, number]> = {
  8: [17.6, 44.4, 4.4, 0.01, 0.75],
  9: [15.62, 39.4, 3.9, 0.01125, 0.66666666666],
  10: [14.08, 35.5, 3.5, 0.0125, 0.6],
  11: [12.76, 32.3, 3.2, 0.01375, 0.54545454545],
  12: [11.66, 29.6, 2.93, 0.015, 0.5],
  13: [10.7, 27.2, 2.7, 0.01625, 0.46],
  14: [9.9, 25.2, 2.5, 0.0175, 0.43],
  15: [9.2, 23.4, 2.3, 0.01875, 0.4],
  16: [8.6, 21.8, 2.15, 0.02, 0.375],
};

/**
 * Mobile physics configuration (viewport width <= 500px)
 * Pin sizes increased for better visibility on small screens
 */
const MOBILE_CONFIG: Record<RowCount, [number, number, number, number, number]> = {
  8: [14.08, 35.5, 5.0, 0.0125, 0.6],
  9: [12.76, 32.3, 4.5, 0.01375, 0.54],
  10: [11.66, 29.6, 4.2, 0.015, 0.5],
  11: [10.23, 25.8, 3.8, 0.0171875, 0.43],
  12: [9.35, 23.6, 3.5, 0.01875, 0.4],
  13: [8.56, 21.6, 3.2, 0.02, 0.37],
  14: [7.9, 20.0, 3.0, 0.02125, 0.34],
  15: [7.35, 18.6, 2.8, 0.0225, 0.32],
  16: [6.85, 17.4, 2.6, 0.02375, 0.3],
};

/**
 * Breakpoint for desktop vs mobile configuration
 */
export const MOBILE_BREAKPOINT = 500;

/**
 * Get physics configuration for a given row count and viewport width
 */
export function getPhysicsConfig(rows: RowCount, viewportWidth: number): PhysicsConfig {
  const config = viewportWidth > MOBILE_BREAKPOINT
    ? DESKTOP_CONFIG[rows]
    : MOBILE_CONFIG[rows];

  return {
    ballSize: config[0],
    pinGap: config[1],
    pinSize: config[2],
    forceNeeded: config[3],
    velocityNeeded: config[4],
  };
}

/**
 * Matter.js collision categories
 */
export const COLLISION_CATEGORIES = {
  default: 0x0001,
  collide: 0x0002,
  noCollide: 0x0003,
} as const;

/**
 * Ball mass (affects physics behavior)
 */
export const BALL_MASS = 10;

/**
 * Delay between multiple ball drops (ms)
 */
export const BALL_DROP_DELAY = 500;
