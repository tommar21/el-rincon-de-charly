'use client';

import { useEffect } from 'react';
import { Coins } from 'lucide-react';
import { useWalletStore, formatBalance } from '../store/wallet-store';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

interface WalletBalanceProps {
  onClick?: () => void;
  compact?: boolean;
  className?: string;
}

export function WalletBalance({ onClick, compact = false, className }: WalletBalanceProps) {
  const { wallet, isLoading, loadWallet } = useWalletStore();
  const { user, isAuthenticated } = useAuth();

  // Load wallet when user logs in
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadWallet(user.id);
    }
  }, [isAuthenticated, user?.id, loadWallet]);

  // Don't show if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 h-10',
        className
      )}>
        <div className="w-5 h-5 rounded-full bg-(--color-warning)/30 animate-pulse" />
        <span className="text-(--color-text-muted) text-sm">...</span>
      </div>
    );
  }

  const balance = wallet?.balance ?? 0;

  if (compact) {
    return (
      <Button
        onClick={onClick}
        variant="ghost"
        size="icon"
        className={cn(
          'w-10 h-10',
          'bg-(--color-warning)/10 hover:bg-(--color-warning)/20',
          className
        )}
      >
        <Coins size={18} className="text-(--color-warning)" />
      </Button>
    );
  }

  return (
    <Card
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 cursor-pointer',
        'bg-linear-to-r from-(--color-warning)/5 to-transparent',
        'border-(--color-warning)/20',
        'hover:border-(--color-warning)/40 hover:from-(--color-warning)/10',
        'transition-all duration-200',
        className
      )}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-(--color-warning)/15">
        <Coins size={20} className="text-(--color-warning)" />
      </div>
      <div className="text-left flex-1 min-w-0">
        <p className="text-xs text-(--color-text-muted) font-medium">Balance</p>
        <p className="font-bold text-lg text-(--color-text) tabular-nums">
          {formatBalance(balance)}
        </p>
      </div>
    </Card>
  );
}

export default WalletBalance;
