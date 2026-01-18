-- Migration: Add missing INSERT policies for wallet tables
-- The original migration only had SELECT and UPDATE policies

-- Allow users to insert their own wallet (fallback if trigger didn't create one)
CREATE POLICY "Users can create their own wallet"
  ON wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to insert transactions for their own wallet
CREATE POLICY "Users can create transactions for their wallet"
  ON wallet_transactions FOR INSERT
  WITH CHECK (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id = auth.uid()
    )
  );
