/**
 * Shared constants for game features
 */

// Bet presets available for selection
export const BET_PRESETS = [10, 25, 50, 100, 250, 500] as const;

export type BetPreset = (typeof BET_PRESETS)[number];
