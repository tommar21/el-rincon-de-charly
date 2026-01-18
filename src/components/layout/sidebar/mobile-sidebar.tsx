'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Gamepad2,
  Coins,
  Search,
  Grid3X3,
  Spade,
  Puzzle,
  Dices,
  Menu,
} from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { ThemeSelector } from '@/features/settings';
import { UserMenu } from '@/features/auth';
import { WalletBalance, WalletModal } from '@/features/wallet';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { GameSection } from './sidebar';

interface Category {
  id: string;
  label: string;
  icon: typeof Grid3X3;
}

const categories: Category[] = [
  { id: 'board', label: 'Tablero', icon: Grid3X3 },
  { id: 'card', label: 'Cartas', icon: Spade },
  { id: 'puzzle', label: 'Puzzle', icon: Puzzle },
  { id: 'casino', label: 'Casino', icon: Dices },
];

interface MobileSidebarProps {
  currentSection: GameSection;
  onSectionChange: (section: GameSection) => void;
  currentCategory?: string;
  onCategoryChange?: (category: string | undefined) => void;
  onSearchClick?: () => void;
}

export function MobileSidebar({
  currentSection,
  onSectionChange,
  currentCategory,
  onCategoryChange,
  onSearchClick,
}: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch with Radix UI generated IDs
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    if (onCategoryChange) {
      onCategoryChange(currentCategory === categoryId ? undefined : categoryId);
    }
  };

  const handleSectionChange = (section: GameSection) => {
    onSectionChange(section);
  };

  // Render placeholder button during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Abrir menu"
      >
        <Menu size={24} />
      </Button>
    );
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Abrir menu"
          >
            <Menu size={24} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0 bg-(--sidebar-background)">
          <SheetHeader className="p-4 border-b border-(--sidebar-border)">
            <SheetTitle asChild>
              <Link href="/games" onClick={() => setIsOpen(false)}>
                <Logo size="md" />
              </Link>
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col h-[calc(100%-65px)]">
            {/* Section Toggle */}
            <div className="p-4 border-b border-(--sidebar-border)">
              <ToggleGroup
                type="single"
                value={currentSection}
                onValueChange={(value) => {
                  if (value) handleSectionChange(value as GameSection);
                }}
                className="w-full bg-(--color-background) rounded-lg p-1"
              >
                <ToggleGroupItem
                  value="arcade"
                  className={cn(
                    'flex-1 gap-2 data-[state=on]:bg-(--color-primary) data-[state=on]:text-white',
                    'rounded-md px-3 py-2 text-sm font-medium'
                  )}
                >
                  <Gamepad2 size={16} />
                  Arcade
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="casino"
                  className={cn(
                    'flex-1 gap-2 data-[state=on]:bg-(--color-primary) data-[state=on]:text-white',
                    'rounded-md px-3 py-2 text-sm font-medium'
                  )}
                >
                  <Coins size={16} />
                  Casino
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Categories */}
            <div className="p-4 border-b border-(--sidebar-border)">
              <p className="text-xs font-semibold uppercase tracking-wide text-(--color-text-subtle) mb-3 px-1">
                Categorias
              </p>
              <nav className="flex flex-col gap-1">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isActive = currentCategory === category.id;

                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        handleCategoryClick(category.id);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'flex items-center gap-3 w-full rounded-lg transition-all duration-200',
                        'px-3 py-2.5 text-sm font-medium',
                        'hover:bg-(--color-surface-hover)',
                        isActive && [
                          'bg-(--color-primary)/10 text-(--color-primary)',
                        ],
                        !isActive && 'text-(--color-text-muted)'
                      )}
                    >
                      <Icon size={18} className="shrink-0" />
                      <span>{category.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Search */}
            <div className="p-4">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-(--color-text-muted)"
                onClick={() => {
                  setIsOpen(false);
                  onSearchClick?.();
                }}
              >
                <Search size={16} />
                Buscar juegos...
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Footer */}
            <div className="p-4 border-t border-(--sidebar-border) space-y-3">
              <WalletBalance
                onClick={() => {
                  setIsOpen(false);
                  setIsWalletModalOpen(true);
                }}
                className="w-full"
              />
              <div className="flex items-center gap-2">
                <ThemeSelector className="flex-1" />
                <UserMenu />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Wallet Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </>
  );
}

export default MobileSidebar;
