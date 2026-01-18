'use client';

import { type ReactNode, useEffect } from 'react';
import { Toaster } from 'sonner';
import { ThemeProvider } from './theme-provider';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { useStatsStore } from '@/features/profile/store/stats-store';
import { useWalletStore } from '@/features/wallet/store/wallet-store';

interface ProvidersProps {
  children: ReactNode;
}

// Component to handle auth-dependent store initialization
function AuthStoreInitializer() {
  const { user, isAuthenticated } = useAuthStore();
  const { setUserId, startPeriodicSync } = useStatsStore();
  const { loadWallet, reset: resetWallet } = useWalletStore();

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Initialize stats store
      setUserId(user.id);

      // Start periodic stats sync
      const stopSync = startPeriodicSync();

      // Load wallet
      loadWallet(user.id);

      return () => {
        stopSync();
      };
    } else {
      // User logged out - reset stores
      setUserId(null);
      resetWallet();
    }
  }, [isAuthenticated, user?.id, setUserId, startPeriodicSync, loadWallet, resetWallet]);

  return null;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider defaultTheme="ember">
      <AuthStoreInitializer />
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-text-muted)',
          },
        }}
      />
    </ThemeProvider>
  );
}

export default Providers;
