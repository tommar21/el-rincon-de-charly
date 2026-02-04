/**
 * Type guards for Supabase database row types.
 * These replace unsafe `as unknown as Type` assertions with runtime validation.
 */

import type { WalletRow, WalletTransactionRow, TransactionType } from '@/features/wallet/types';
import type { GameStatsRow } from '@/features/profile/types';
import type { Profile } from '@/features/auth/types';
import { validatorLogger } from '@/lib/utils/logger';

// Valid transaction types for validation
const VALID_TRANSACTION_TYPES: TransactionType[] = [
  'deposit', 'withdraw', 'bet', 'win', 'bonus', 'refund'
];

/**
 * Type guard for WalletRow
 * Validates that an unknown value has the shape of a wallet database row
 */
export function isWalletRow(data: unknown): data is WalletRow {
  if (!data || typeof data !== 'object') return false;

  const row = data as Record<string, unknown>;

  return (
    typeof row.id === 'string' &&
    typeof row.user_id === 'string' &&
    (typeof row.balance === 'number' || typeof row.balance === 'string') &&
    typeof row.created_at === 'string' &&
    typeof row.updated_at === 'string'
  );
}

/**
 * Validates and returns a WalletRow or throws
 */
export function validateWalletRow(data: unknown, context?: string): WalletRow {
  if (!isWalletRow(data)) {
    validatorLogger.error('Invalid wallet row data:', data, 'Context:', context);
    throw new Error(`Invalid wallet data${context ? ` in ${context}` : ''}`);
  }

  // Normalize balance to number (Supabase sometimes returns numeric as string)
  return {
    ...data,
    balance: typeof data.balance === 'string' ? parseFloat(data.balance) : data.balance,
  };
}

/**
 * Type guard for WalletTransactionRow
 */
export function isWalletTransactionRow(data: unknown): data is WalletTransactionRow {
  if (!data || typeof data !== 'object') return false;

  const row = data as Record<string, unknown>;

  return (
    typeof row.id === 'string' &&
    typeof row.wallet_id === 'string' &&
    typeof row.type === 'string' &&
    VALID_TRANSACTION_TYPES.includes(row.type as TransactionType) &&
    (typeof row.amount === 'number' || typeof row.amount === 'string') &&
    (typeof row.balance_after === 'number' || typeof row.balance_after === 'string') &&
    (row.description === null || typeof row.description === 'string') &&
    (row.game_slug === null || typeof row.game_slug === 'string') &&
    typeof row.created_at === 'string'
  );
}

/**
 * Validates and returns a WalletTransactionRow or throws
 */
export function validateWalletTransactionRow(data: unknown, context?: string): WalletTransactionRow {
  if (!isWalletTransactionRow(data)) {
    validatorLogger.error('Invalid wallet transaction row data:', data, 'Context:', context);
    throw new Error(`Invalid wallet transaction data${context ? ` in ${context}` : ''}`);
  }

  // Normalize numeric fields
  return {
    ...data,
    amount: typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount,
    balance_after: typeof data.balance_after === 'string' ? parseFloat(data.balance_after) : data.balance_after,
    metadata: data.metadata ?? {},
  };
}

/**
 * Type guard for GameStatsRow
 */
export function isGameStatsRow(data: unknown): data is GameStatsRow {
  if (!data || typeof data !== 'object') return false;

  const row = data as Record<string, unknown>;

  return (
    typeof row.id === 'string' &&
    typeof row.user_id === 'string' &&
    typeof row.game_type === 'string' &&
    (typeof row.games_played === 'number' || row.games_played === null) &&
    (typeof row.games_won === 'number' || row.games_won === null) &&
    (typeof row.games_lost === 'number' || row.games_lost === null) &&
    (typeof row.games_draw === 'number' || row.games_draw === null) &&
    (typeof row.win_streak === 'number' || row.win_streak === null) &&
    (typeof row.best_win_streak === 'number' || row.best_win_streak === null) &&
    (typeof row.total_play_time === 'number' || row.total_play_time === null) &&
    (row.by_opponent === null || typeof row.by_opponent === 'object') &&
    typeof row.updated_at === 'string'
  );
}

/**
 * Validates and returns a GameStatsRow with normalized values
 */
export function validateGameStatsRow(data: unknown, context?: string): GameStatsRow {
  if (!isGameStatsRow(data)) {
    validatorLogger.error('Invalid game stats row data:', data, 'Context:', context);
    throw new Error(`Invalid game stats data${context ? ` in ${context}` : ''}`);
  }

  // Normalize null values to defaults
  return {
    id: data.id,
    user_id: data.user_id,
    game_type: data.game_type,
    games_played: data.games_played ?? 0,
    games_won: data.games_won ?? 0,
    games_lost: data.games_lost ?? 0,
    games_draw: data.games_draw ?? 0,
    win_streak: data.win_streak ?? 0,
    best_win_streak: data.best_win_streak ?? 0,
    total_play_time: data.total_play_time ?? 0,
    by_opponent: (data.by_opponent as GameStatsRow['by_opponent']) ?? {},
    updated_at: data.updated_at,
  };
}

/**
 * Validate array of wallet transaction rows
 */
export function validateWalletTransactionRows(data: unknown[]): WalletTransactionRow[] {
  return data.map((item, index) =>
    validateWalletTransactionRow(item, `transaction[${index}]`)
  );
}

/**
 * Type guard for Profile database row.
 * Note: The profiles table only has id, username, avatar_url, created_at, updated_at.
 * The games_played, games_won, win_rate fields are computed from game_stats.
 */
export function isProfileRow(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;

  const row = data as Record<string, unknown>;

  // Check for empty object (Supabase sometimes returns {} instead of null)
  if (Object.keys(row).length === 0) return false;

  // Only check fields that exist in the profiles table
  return (
    typeof row.id === 'string' &&
    (row.username === null || typeof row.username === 'string') &&
    (row.avatar_url === null || typeof row.avatar_url === 'string')
  );
}

/**
 * Validates and returns a Profile with default values for computed fields.
 * The database only stores id, username, avatar_url - game stats are computed separately.
 */
export function validateProfile(data: unknown, context?: string): Profile {
  if (!isProfileRow(data)) {
    validatorLogger.error('Invalid profile data:', data, 'Context:', context);
    throw new Error(`Invalid profile data${context ? ` in ${context}` : ''}`);
  }

  const row = data as Record<string, unknown>;

  return {
    id: row.id as string,
    username: (row.username as string | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    // Default values for computed fields (populated from game_stats elsewhere)
    games_played: typeof row.games_played === 'number' ? row.games_played : 0,
    games_won: typeof row.games_won === 'number' ? row.games_won : 0,
    win_rate: typeof row.win_rate === 'number' ? row.win_rate : 0,
    created_at: typeof row.created_at === 'string' ? row.created_at : undefined,
    updated_at: typeof row.updated_at === 'string' ? row.updated_at : undefined,
  };
}

/**
 * Legacy type guard - kept for backward compatibility
 * @deprecated Use isProfileRow instead
 */
export function isProfile(data: unknown): data is Profile {
  return isProfileRow(data);
}
