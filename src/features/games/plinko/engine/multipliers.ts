import type { RowCount, MultiplierColor } from '../types';

/**
 * Multiplier values per row count
 * These are calibrated for balanced gameplay
 */
export const MULTIPLIERS: Record<RowCount, number[]> = {
  8: [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
  9: [5.6, 2.0, 1.6, 1.0, 0.7, 0.7, 1.0, 1.6, 2.0, 5.6],
  10: [8.9, 3.0, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 3.0, 8.9],
  11: [8.4, 3.0, 1.9, 1.3, 1.0, 0.7, 0.7, 1.0, 1.3, 1.9, 3.0, 8.4],
  12: [10, 3.0, 1.6, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 1.6, 3.0, 10],
  13: [16, 4.0, 2.0, 1.5, 1.2, 1.0, 0.7, 0.7, 1.0, 1.2, 1.5, 2.0, 4.0, 16],
  14: [25, 5.0, 2.5, 1.8, 1.4, 1.1, 0.9, 0.5, 0.9, 1.1, 1.4, 1.8, 2.5, 5.0, 25],
  15: [40, 8.0, 3.0, 2.0, 1.6, 1.3, 1.0, 0.7, 0.7, 1.0, 1.3, 1.6, 2.0, 3.0, 8.0, 40],
  16: [110, 25, 8.0, 4.0, 2.0, 1.4, 1.1, 0.9, 0.5, 0.9, 1.1, 1.4, 2.0, 4.0, 8.0, 25, 110],
};

/**
 * Color scheme for multipliers (text colors)
 * green = high multiplier, blue = medium, red = low
 */
export const MULTIPLIER_TEXT_COLORS: Record<RowCount, MultiplierColor[]> = {
  8: ['green', 'blue', 'blue', 'blue', 'red', 'blue', 'blue', 'blue', 'green'],
  9: ['green', 'green', 'blue', 'blue', 'red', 'red', 'blue', 'blue', 'green', 'green'],
  10: ['green', 'green', 'blue', 'blue', 'red', 'blue', 'red', 'blue', 'blue', 'green', 'green'],
  11: ['green', 'green', 'blue', 'blue', 'blue', 'red', 'red', 'blue', 'blue', 'blue', 'green', 'green'],
  12: ['green', 'green', 'blue', 'blue', 'blue', 'red', 'blue', 'red', 'blue', 'blue', 'blue', 'green', 'green'],
  13: ['green', 'green', 'blue', 'blue', 'blue', 'blue', 'red', 'red', 'blue', 'blue', 'blue', 'blue', 'green', 'green'],
  14: ['green', 'green', 'green', 'blue', 'blue', 'blue', 'blue', 'red', 'blue', 'blue', 'blue', 'blue', 'green', 'green', 'green'],
  15: ['green', 'green', 'green', 'blue', 'blue', 'blue', 'blue', 'red', 'red', 'blue', 'blue', 'blue', 'blue', 'green', 'green', 'green'],
  16: ['green', 'green', 'green', 'green', 'blue', 'blue', 'blue', 'blue', 'red', 'blue', 'blue', 'blue', 'blue', 'green', 'green', 'green', 'green'],
};

/**
 * Background colors for multiplier slots
 */
export const MULTIPLIER_BG_COLORS: Record<MultiplierColor, string> = {
  green: '#2e4141',
  blue: '#262640',
  red: '#3d303d',
};

/**
 * Text colors for multipliers
 */
export const MULTIPLIER_TEXT_HEX: Record<MultiplierColor, string> = {
  green: '#61e698',
  blue: '#5042d2',
  red: '#e15b73',
};

/**
 * Get multiplier value for a specific slot
 */
export function getMultiplier(rows: RowCount, slotIndex: number): number {
  const multipliers = MULTIPLIERS[rows];
  if (slotIndex < 0 || slotIndex >= multipliers.length) {
    return 1;
  }
  return multipliers[slotIndex];
}

/**
 * Get the color for a multiplier slot
 */
export function getMultiplierColor(rows: RowCount, slotIndex: number): MultiplierColor {
  const colors = MULTIPLIER_TEXT_COLORS[rows];
  if (slotIndex < 0 || slotIndex >= colors.length) {
    return 'blue';
  }
  return colors[slotIndex];
}

/**
 * Calculate the final slot based on path directions
 * Each direction (0=left, 1=right) affects the final position
 */
export function calculateFinalSlot(path: (0 | 1)[]): number {
  // Start at center (0)
  // Each right (1) adds 1, each left (0) subtracts nothing from the running total
  // The final position is the count of rights
  return path.reduce<number>((acc, dir) => acc + dir, 0);
}
