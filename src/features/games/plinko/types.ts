/**
 * Number of rows/lines in the Plinko board
 */
export type RowCount = 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;

/**
 * Game state
 */
export type PlinkoState = 'idle' | 'dropping' | 'finished';

/**
 * Configuration for a Plinko game session
 */
export interface PlinkoGameConfig {
  rows: RowCount;
  betAmount: number;
}

/**
 * Result of a single ball drop
 */
export interface DropResult {
  betAmount: number;
  multiplier: number;
  winAmount: number;
  slotIndex: number;
}

/**
 * Physics configuration for Matter.js elements
 * Values calibrated per row count for desktop (>500px) and mobile
 */
export interface PhysicsConfig {
  ballSize: number;
  pinGap: number;
  pinSize: number;
  forceNeeded: number;
  velocityNeeded: number;
}

/**
 * Ball path direction at each pin collision
 * 0 = left, 1 = right
 */
export type BallDirection = 0 | 1;

/**
 * Ball data with its predetermined path
 */
export interface BallData {
  id: string;
  path: BallDirection[];
  finalSlot: number;
}

/**
 * Multiplier color scheme
 */
export type MultiplierColor = 'green' | 'blue' | 'red';

/**
 * Ball drop speed setting
 */
export type BallSpeed = 'slow' | 'normal' | 'fast';
