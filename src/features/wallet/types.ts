export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'deposit' | 'withdraw' | 'bet' | 'win' | 'bonus' | 'refund';

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description?: string;
  gameSlug?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// DB row types
export interface WalletRow {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransactionRow {
  id: string;
  wallet_id: string;
  type: TransactionType;
  amount: number;
  balance_after: number;
  description: string | null;
  game_slug: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
