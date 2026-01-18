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
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo, LogoIcon } from '@/components/brand/logo';
import { UserMenu, useAuth } from '@/features/auth';
import { WalletBalance, WalletModal } from '@/features/wallet';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
// ThemeSelector moved to UserMenu settings
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSidebarStore } from './use-sidebar-store';

export type GameSection = 'arcade' | 'casino';

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

interface SidebarProps {
  currentSection: GameSection;
  onSectionChange: (section: GameSection) => void;
  currentCategory?: string;
  onCategoryChange?: (category: string | undefined) => void;
}

export function Sidebar({
  currentSection,
  onSectionChange,
  currentCategory,
  onCategoryChange,
}: SidebarProps) {
  const { isCollapsed, toggle } = useSidebarStore();
  const { isAuthenticated } = useAuth();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard shortcut: Ctrl/Cmd + B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  const handleCategoryClick = (categoryId: string) => {
    if (onCategoryChange) {
      onCategoryChange(currentCategory === categoryId ? undefined : categoryId);
    }
  };

  // Render placeholder during SSR/hydration to prevent layout shift
  if (!mounted) {
    return (
      <>
        <aside
          className={cn(
            'fixed left-0 top-0 h-screen z-(--z-sidebar)',
            'bg-(--sidebar-background) border-r border-(--sidebar-border)',
            'flex flex-col',
            'hidden md:flex'
          )}
          style={{ width: 'var(--sidebar-width)' }}
        />
        <div
          className="hidden md:block"
          style={{ marginLeft: 'var(--sidebar-width)' }}
        />
      </>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        className={cn(
          'fixed left-0 top-0 h-screen z-(--z-sidebar)',
          'bg-(--sidebar-background) border-r border-(--sidebar-border)',
          'flex flex-col',
          'hidden md:flex'
        )}
        initial={false}
        animate={{
          width: isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header - Logo + Collapse Button */}
        <div className="flex items-center justify-between px-4 pt-5 pb-4 border-b border-(--sidebar-border)">
          <Link href="/games" className="flex items-center min-w-0">
            <AnimatePresence mode="wait">
              {isCollapsed ? (
                <motion.div
                  key="icon"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <LogoIcon size={36} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      El Rincon de Charly
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              ) : (
                <motion.div
                  key="full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Logo size="md" />
                </motion.div>
              )}
            </AnimatePresence>
          </Link>

          {!isCollapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggle}
                  className="h-8 w-8 shrink-0"
                >
                  <PanelLeftClose size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Colapsar (Ctrl+B)
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Expand button when collapsed */}
        {isCollapsed && (
          <div className="p-2 border-b border-(--sidebar-border)">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggle}
                  className="w-full h-10"
                >
                  <PanelLeft size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Expandir (Ctrl+B)
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Section Toggle (Arcade / Casino) */}
        <div className={cn('px-4 pt-4 pb-4 border-b border-(--sidebar-border)/30', isCollapsed && 'px-3 pt-3 pb-3')}>
          {isCollapsed ? (
            <div className="flex flex-col gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={currentSection === 'arcade' ? 'primary' : 'ghost'}
                    size="icon"
                    onClick={() => onSectionChange('arcade')}
                    className="w-full h-10"
                  >
                    <Gamepad2 size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Arcade</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={currentSection === 'casino' ? 'primary' : 'ghost'}
                    size="icon"
                    onClick={() => onSectionChange('casino')}
                    className="w-full h-10"
                  >
                    <Coins size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Casino</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <ToggleGroup
              type="single"
              value={currentSection}
              onValueChange={(value) => value && onSectionChange(value as GameSection)}
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
          )}
        </div>

        {/* Categories */}
        <div className={cn('px-4 pt-4 pb-4 border-b border-(--sidebar-border)/30', isCollapsed && 'px-3 pt-3 pb-3')}>
          {!isCollapsed && (
            <p className="text-xs font-semibold uppercase tracking-wide text-(--color-text-subtle) mb-3 px-1">
              Categorias
            </p>
          )}
          <nav className="flex flex-col gap-1" aria-label="Categorias de juegos">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = currentCategory === category.id;

              const button = (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  aria-pressed={isActive}
                  aria-label={isCollapsed ? `Categoria ${category.label}` : undefined}
                  className={cn(
                    'flex items-center gap-3 w-full rounded-lg transition-all duration-200',
                    isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5',
                    'text-sm font-medium',
                    'hover:bg-(--color-surface-hover)',
                    isActive && [
                      'bg-primary/10 text-(--color-primary)',
                      'relative',
                    ],
                    !isActive && 'text-(--color-text-muted)'
                  )}
                >
                  {isActive && !isCollapsed && (
                    <motion.div
                      layoutId="activeCategory"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-(--color-primary) rounded-r-full"
                      transition={{ duration: 0.2 }}
                    />
                  )}
                  <Icon size={18} className="shrink-0" aria-hidden="true" />
                  {!isCollapsed && <span>{category.label}</span>}
                </button>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={category.id}>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent side="right">{category.label}</TooltipContent>
                  </Tooltip>
                );
              }

              return button;
            })}
          </nav>
        </div>

        {/* Search */}
        {!isCollapsed ? (
          <div className="px-4 py-4">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-subtle)"
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Buscar juegos..."
                aria-label="Buscar juegos"
                className={cn(
                  'w-full pl-10 pr-4 py-2.5 rounded-lg',
                  'bg-(--color-background) border border-(--color-border)',
                  'text-sm placeholder:text-(--color-text-subtle)',
                  'focus:outline-none focus:border-(--color-primary) focus:ring-1 focus:ring-primary/20',
                  'transition-all duration-200'
                )}
              />
            </div>
          </div>
        ) : (
          <div className="p-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-full h-10" aria-label="Buscar juegos">
                  <Search size={18} aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Buscar (Ctrl+K)</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div className={cn('border-t border-(--sidebar-border)', isCollapsed ? 'p-3' : 'p-4')}>
          {isAuthenticated ? (
            // Authenticated user footer
            isCollapsed ? (
              <div className="flex flex-col gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <WalletBalance
                        onClick={() => setIsWalletModalOpen(true)}
                        compact
                        className="w-full justify-center"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">Billetera</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <UserMenu compact />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">Perfil</TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <div className="space-y-3">
                <WalletBalance
                  onClick={() => setIsWalletModalOpen(true)}
                  className="w-full"
                />
                <UserMenu className="w-full" />
              </div>
            )
          ) : (
            // Non-authenticated footer - just login button
            <UserMenu compact={isCollapsed} className={isCollapsed ? 'w-full' : 'w-full'} />
          )}
        </div>
      </motion.aside>

      {/* Main content margin */}
      <motion.div
        className="hidden md:block"
        initial={false}
        animate={{
          marginLeft: isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      />

      {/* Wallet Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </TooltipProvider>
  );
}

export default Sidebar;
