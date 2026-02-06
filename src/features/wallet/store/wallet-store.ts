'use client';

import { create } from 'zustand';
import { getClient } from '@/lib/supabase/client';
import type { InsertTables, UpdateTables } from '@/types/supabase.types';
import type { Wallet, WalletTransaction, WalletRow, WalletTransactionRow, TransactionType } from '../types';
import { validateWalletRow, validateWalletTransactionRows } from '@/lib/validators/database-rows';
import { walletLogger } from '@/lib/utils/logger';

// Use Supabase generated types for database operations
type WalletInsert = InsertTables<'wallets'>;
type WalletUpdate = UpdateTables<'wallets'>;
type WalletTransactionInsert = InsertTables<'wallet_transactions'>;

interface WalletState {
  wallet: Wallet | null;
  transactions: WalletTransaction[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMoreTransactions: boolean;
  error: string | null;

  // Actions
  loadWallet: (userId: string) => Promise<void>;
  loadTransactions: (limit?: number) => Promise<void>;
  loadMoreTransactions: (limit?: number) => Promise<void>;
  placeBet: (amount: number, gameSlug: string, description?: string) => Promise<boolean>;
  recordWin: (amount: number, gameSlug: string, description?: string) => Promise<boolean>;
  addCredits: (amount: number, description?: string) => Promise<boolean>;
  reset: () => void;
}

// Convert DB row to Wallet
function rowToWallet(row: WalletRow): Wallet {
  return {
    id: row.id,
    userId: row.user_id,
    balance: Number(row.balance),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Convert DB row to WalletTransaction
function rowToTransaction(row: WalletTransactionRow): WalletTransaction {
  return {
    id: row.id,
    walletId: row.wallet_id,
    type: row.type,
    amount: Number(row.amount),
    balanceAfter: Number(row.balance_after),
    description: row.description || undefined,
    gameSlug: row.game_slug || undefined,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

// Track pending operations by unique ID to prevent duplicates
const pendingOperations = new Set<string>();

// Prevent duplicate loadWallet calls (race condition fix)
let walletLoadPromise: Promise<void> | null = null;
let walletLoadUserId: string | null = null;

// Constants for retry logic
const MAX_LOCK_WAIT_MS = 5000;
const LOCK_CHECK_INTERVAL_MS = 50;
const MAX_TRANSACTION_RETRIES = 3;
const RETRY_DELAY_MS = 100;

// Generate unique operation ID
function generateOperationId(type: string): string {
  return `${type}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

async function withWalletLock<T>(
  operationType: string,
  operation: () => Promise<T>
): Promise<T> {
  const operationId = generateOperationId(operationType);
  const startTime = Date.now();

  // Check if same type of operation is already in progress (reserved for future debouncing)
  void Array.from(pendingOperations).some(
    id => id.startsWith(operationType + ':')
  );

  // Wait for pending operations with timeout
  while (pendingOperations.size > 0) {
    if (Date.now() - startTime > MAX_LOCK_WAIT_MS) {
      walletLogger.error('[Wallet] Lock timeout, pending ops:', Array.from(pendingOperations));
      throw new Error('Wallet operation timeout - another operation is taking too long');
    }
    await new Promise(resolve => setTimeout(resolve, LOCK_CHECK_INTERVAL_MS));
  }

  pendingOperations.add(operationId);
  try {
    return await operation();
  } finally {
    pendingOperations.delete(operationId);
  }
}

// Transaction execution parameters
interface TransactionParams {
  type: TransactionType;
  amount: number;
  description: string;
  gameSlug?: string;
  errorMessage: string;
}

// Helper to fetch fresh wallet
async function fetchFreshWallet(supabase: ReturnType<typeof getClient>, walletId: string): Promise<Wallet | null> {
  const { data } = await supabase
    .from('wallets')
    .select('*')
    .eq('id', walletId)
    .single();

  return data ? rowToWallet(validateWalletRow(data, 'fetchFreshWallet')) : null;
}

// Generic wallet transaction executor with retry logic
async function executeWalletTransaction(
  wallet: Wallet,
  params: TransactionParams,
  set: (state: Partial<WalletState>) => void,
  _get: () => WalletState
): Promise<{ success: boolean; newBalance?: number }> {
  void _get; // Reserved for future retry logic
  const supabase = getClient();

  // Validate sufficient balance for bets
  if (params.type === 'bet' && wallet.balance < Math.abs(params.amount)) {
    set({ error: 'Saldo insuficiente' });
    return { success: false };
  }

  let retries = 0;
  let currentWallet = wallet;

  while (retries < MAX_TRANSACTION_RETRIES) {
    const expectedBalance = currentWallet.balance;
    const balanceChange = params.type === 'bet' ? -Math.abs(params.amount) : Math.abs(params.amount);
    const newBalance = expectedBalance + balanceChange;

    // Re-validate balance on retry
    if (params.type === 'bet' && currentWallet.balance < Math.abs(params.amount)) {
      set({ error: 'Saldo insuficiente' });
      return { success: false };
    }

    try {
      // Update wallet balance with optimistic locking
      const updateData = {
        balance: newBalance,
        updated_at: new Date().toISOString(),
      } satisfies WalletUpdate;

      // Type assertion needed due to Supabase SSR client type inference issue
      // Our WalletUpdate type matches Database['public']['Tables']['wallets']['Update']
      const { data: updatedWallet, error: walletError } = await (supabase
        .from('wallets') as ReturnType<typeof supabase.from>)
        .update(updateData)
        .eq('id', currentWallet.id)
        .eq('balance', expectedBalance) // Optimistic lock
        .select()
        .single();

      if (walletError || !updatedWallet) {
        // Balance changed concurrently - fetch fresh and retry
        const freshWallet = await fetchFreshWallet(supabase, currentWallet.id);
        if (freshWallet) {
          set({ wallet: freshWallet });
          currentWallet = freshWallet;
        }

        retries++;
        if (retries < MAX_TRANSACTION_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * retries));
          continue;
        }

        set({ error: 'Balance cambió, intenta de nuevo' });
        return { success: false };
      }

      // Record transaction
      const txData = {
        wallet_id: currentWallet.id,
        type: params.type,
        amount: balanceChange,
        balance_after: newBalance,
        description: params.description,
        ...(params.gameSlug && { game_slug: params.gameSlug }),
      } satisfies WalletTransactionInsert;

      const { error: txError } = await (supabase
        .from('wallet_transactions') as ReturnType<typeof supabase.from>)
        .insert(txData);

      if (txError) {
        // Rollback wallet balance - use optimistic locking for safety
        const rollbackData = {
          balance: expectedBalance,
          updated_at: new Date().toISOString(),
        } satisfies WalletUpdate;

        await (supabase
          .from('wallets') as ReturnType<typeof supabase.from>)
          .update(rollbackData)
          .eq('id', currentWallet.id)
          .eq('balance', newBalance); // Only rollback if balance is still what we set

        // Fetch fresh state after rollback attempt
        const freshWallet = await fetchFreshWallet(supabase, currentWallet.id);
        if (freshWallet) {
          set({ wallet: freshWallet });
        }

        throw txError;
      }

      // Update local state
      set({
        wallet: { ...currentWallet, balance: newBalance },
        error: null,
      });

      return { success: true, newBalance };
    } catch (err) {
      walletLogger.error(`Error in wallet transaction (${params.type}):`, err);
      set({ error: params.errorMessage });
      return { success: false };
    }
  }

  set({ error: params.errorMessage });
  return { success: false };
}

const TRANSACTIONS_PAGE_SIZE = 20;

export const useWalletStore = create<WalletState>((set, get) => ({
  wallet: null,
  transactions: [],
  isLoading: false,
  isLoadingMore: false,
  hasMoreTransactions: true,
  error: null,

  loadWallet: async (userId) => {
    // If already loading for this user, wait for the existing promise
    if (walletLoadPromise && walletLoadUserId === userId) {
      await walletLoadPromise;
      return;
    }

    // If wallet already loaded for this user, skip
    const currentWallet = get().wallet;
    if (currentWallet && currentWallet.userId === userId && !get().error) {
      return;
    }

    set({ isLoading: true, error: null });

    // Create the load promise
    walletLoadUserId = userId;
    walletLoadPromise = (async () => {
      const supabase = getClient();

      try {
        const { data, error } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No wallet found, create one directly
            const insertData = { user_id: userId, balance: 1000 } satisfies WalletInsert;
            const { data: newWallet, error: createError } = await (supabase
              .from('wallets') as ReturnType<typeof supabase.from>)
              .insert(insertData)
              .select()
              .single();

            if (createError) {
              // Check if it's a duplicate key error (wallet was created by another request)
              if (createError.code === '23505') {
                // Fetch the existing wallet
                const { data: existingWallet } = await supabase
                  .from('wallets')
                  .select('*')
                  .eq('user_id', userId)
                  .single();

                if (existingWallet) {
                  set({ wallet: rowToWallet(validateWalletRow(existingWallet, 'existingWallet')), isLoading: false });
                  return;
                }
              }
              walletLogger.error('Error creating wallet:', createError);
              set({ error: 'Error al crear la billetera', isLoading: false });
              return;
            }

            if (newWallet) {
              set({ wallet: rowToWallet(validateWalletRow(newWallet, 'newWallet')), isLoading: false });
              return;
            }

            set({ error: 'Error al crear la billetera', isLoading: false });
            return;
          }
          throw error;
        }

        if (data) {
          set({ wallet: rowToWallet(validateWalletRow(data, 'loadWallet')), isLoading: false });
        }
      } catch (err) {
        walletLogger.error('Error loading wallet:', err);
        set({ error: 'Error al cargar la billetera', isLoading: false });
      } finally {
        walletLoadPromise = null;
        walletLoadUserId = null;
      }
    })();

    await walletLoadPromise;
  },

  loadTransactions: async (limit = TRANSACTIONS_PAGE_SIZE) => {
    const { wallet } = get();
    if (!wallet) return;

    const supabase = getClient();

    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
        .limit(limit + 1); // Fetch one extra to check if there are more

      if (error) throw error;

      if (data) {
        const hasMore = data.length > limit;
        const validatedRows = validateWalletTransactionRows(data.slice(0, limit));
        const transactions = validatedRows.map(rowToTransaction);
        set({
          transactions,
          hasMoreTransactions: hasMore,
        });
      }
    } catch (err) {
      walletLogger.error('Error loading transactions:', err);
    }
  },

  loadMoreTransactions: async (limit = TRANSACTIONS_PAGE_SIZE) => {
    const { wallet, transactions, isLoadingMore, hasMoreTransactions } = get();
    if (!wallet || isLoadingMore || !hasMoreTransactions) return;

    set({ isLoadingMore: true });
    const supabase = getClient();

    try {
      // Get the cursor from the last transaction
      const lastTransaction = transactions[transactions.length - 1];
      if (!lastTransaction) {
        set({ isLoadingMore: false, hasMoreTransactions: false });
        return;
      }

      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
        .lt('created_at', lastTransaction.createdAt) // Cursor-based: get older than last
        .order('created_at', { ascending: false })
        .limit(limit + 1);

      if (error) throw error;

      if (data) {
        const hasMore = data.length > limit;
        const validatedRows = validateWalletTransactionRows(data.slice(0, limit));
        const newTransactions = validatedRows.map(rowToTransaction);
        set({
          transactions: [...transactions, ...newTransactions],
          hasMoreTransactions: hasMore,
          isLoadingMore: false,
        });
      }
    } catch (err) {
      walletLogger.error('Error loading more transactions:', err);
      set({ isLoadingMore: false });
    }
  },

  placeBet: async (amount, gameSlug, description) => {
    return withWalletLock('placeBet', async () => {
      const { wallet } = get();
      set({ error: null }); // Clear previous error
      if (!wallet) {
        set({ error: 'Billetera no cargada' });
        return false;
      }

      const result = await executeWalletTransaction(wallet, {
        type: 'bet',
        amount,
        description: description || `Apuesta en ${gameSlug}`,
        gameSlug,
        errorMessage: 'Error al realizar la apuesta',
      }, set, get);

      return result.success;
    });
  },

  recordWin: async (amount, gameSlug, description) => {
    return withWalletLock('recordWin', async () => {
      const { wallet } = get();
      set({ error: null }); // Clear previous error
      if (!wallet) {
        set({ error: 'Billetera no cargada' });
        return false;
      }

      const result = await executeWalletTransaction(wallet, {
        type: 'win',
        amount,
        description: description || `Ganancia en ${gameSlug}`,
        gameSlug,
        errorMessage: 'Error al registrar ganancia',
      }, set, get);

      return result.success;
    });
  },

  addCredits: async (amount, description) => {
    return withWalletLock('addCredits', async () => {
      const { wallet } = get();
      set({ error: null }); // Clear previous error
      if (!wallet) {
        set({ error: 'Billetera no cargada. Intenta recargar la página.' });
        return false;
      }

      const result = await executeWalletTransaction(wallet, {
        type: 'bonus',
        amount,
        description: description || 'Créditos de bonificación',
        errorMessage: 'Error al agregar créditos',
      }, set, get);

      return result.success;
    });
  },

  reset: () => {
    set({
      wallet: null,
      transactions: [],
      isLoading: false,
      isLoadingMore: false,
      hasMoreTransactions: true,
      error: null,
    });
  },
}));

// Memoized selectors - use these to prevent unnecessary re-renders
export const useWallet = () => useWalletStore((state) => state.wallet);
export const useWalletBalance = () => useWalletStore((state) => state.wallet?.balance ?? 0);
export const useWalletTransactions = () => useWalletStore((state) => state.transactions);
export const useWalletLoading = () => useWalletStore((state) => state.isLoading);
export const useWalletError = () => useWalletStore((state) => state.error);
export const useWalletActions = () => useWalletStore((state) => ({
  loadWallet: state.loadWallet,
  loadTransactions: state.loadTransactions,
  loadMoreTransactions: state.loadMoreTransactions,
  placeBet: state.placeBet,
  recordWin: state.recordWin,
  addCredits: state.addCredits,
  reset: state.reset,
}));

// Format balance for display
export function formatBalance(balance: number): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance);
}
