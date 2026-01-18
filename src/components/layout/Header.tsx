'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { ThemeSelector } from '@/features/settings';
import { UserMenu } from '@/features/auth';
import { WalletBalance, WalletModal } from '@/features/wallet';
import { cn } from '@/lib/utils';

/**
 * Fixed Header Component
 *
 * MEJORAS:
 * - Fixed positioning (ya no absolute que se solapaba en mobile)
 * - Glass morphism con backdrop-blur
 * - Responsive: mobile menu button + logo hidden en mobile
 * - Safe z-index hierarchy
 * - Border bottom visible
 */

export function Header() {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-(--z-header)',
          'h-16 px-4',
          'flex items-center justify-between',
          'bg-(--glass-backdrop) backdrop-blur-md',
          'border-b border-(--color-border)',
          'transition-all duration-200'
        )}
      >
        {/* Left: Logo / Title */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button - solo visible en mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={cn(
              'sm:hidden',
              'w-10 h-10 rounded-lg',
              'flex items-center justify-center',
              'text-(--color-text) hover:text-(--color-primary)',
              'bg-transparent hover:bg-(--color-surface-hover)',
              'transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)'
            )}
            aria-label="Menú"
          >
            <Menu size={20} />
          </button>

          {/* Logo - hidden en mobile */}
          <Link
            href="/"
            className={cn(
              'hidden sm:block',
              'text-xl font-bold text-gradient font-museo',
              'hover:scale-105 transition-transform duration-200'
            )}
          >
            El Rincón
          </Link>
        </div>

        {/* Right: User Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <WalletBalance
            compact
            onClick={() => setIsWalletModalOpen(true)}
          />
          <ThemeSelector />
          <UserMenu />
        </div>
      </header>

      {/* Wallet Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </>
  );
}

export default Header;
