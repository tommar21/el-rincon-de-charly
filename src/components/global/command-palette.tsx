'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Hash,
  Circle,
  Crown,
  CircleDot,
  Gamepad2,
  Sun,
  Moon,
  Flame,
  Settings,
  User,
  Trophy,
  BarChart3,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useTheme, type Theme } from '@/components/client/theme-provider';
import { useAuth } from '@/features/auth';
import { cn } from '@/lib/utils';

// Game icons mapping
const gameIcons: Record<string, typeof Hash> = {
  'tic-tac-toe': Hash,
  'connect-4': Circle,
  chess: Crown,
  checkers: CircleDot,
};

// Available games
const games = [
  { slug: 'tic-tac-toe', name: 'Tic Tac Toe', available: true },
  { slug: 'connect-4', name: 'Conecta 4', available: false },
  { slug: 'chess', name: 'Ajedrez', available: false },
  { slug: 'checkers', name: 'Damas', available: false },
];

// Theme options
const themes: { name: Theme; label: string; icon: typeof Sun }[] = [
  { name: 'ember', label: 'Ember', icon: Flame },
  { name: 'midnight', label: 'Midnight', icon: Moon },
  { name: 'dawn', label: 'Dawn', icon: Sun },
];

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandPalette({ open: controlledOpen, onOpenChange }: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated } = useAuth();

  // Prevent hydration mismatch with Radix UI generated IDs
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use controlled or internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  const runCommand = useCallback((command: () => void) => {
    setIsOpen(false);
    command();
  }, [setIsOpen]);

  // Keyboard shortcut: Ctrl/Cmd + K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, setIsOpen]);

  // Don't render dialog until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      <CommandInput placeholder="Buscar juegos, acciones..." />
      <CommandList>
        <CommandEmpty>No se encontraron resultados.</CommandEmpty>

        {/* Games */}
        <CommandGroup heading="Juegos">
          {games.map((game) => {
            const Icon = gameIcons[game.slug] || Gamepad2;
            return (
              <CommandItem
                key={game.slug}
                disabled={!game.available}
                onSelect={() => {
                  if (game.available) {
                    runCommand(() => router.push(`/games/${game.slug}`));
                  }
                }}
                className={cn(!game.available && 'opacity-50')}
              >
                <Icon size={16} className="mr-2" />
                <span>{game.name}</span>
                {!game.available && (
                  <span className="ml-auto text-xs text-(--color-text-muted)">
                    Pronto
                  </span>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* Themes */}
        <CommandGroup heading="Tema">
          {themes.map((t) => {
            const Icon = t.icon;
            const isActive = theme === t.name;
            return (
              <CommandItem
                key={t.name}
                onSelect={() => runCommand(() => setTheme(t.name))}
              >
                <Icon size={16} className="mr-2" />
                <span>{t.label}</span>
                {isActive && (
                  <span className="ml-auto text-xs text-(--color-primary)">
                    Activo
                  </span>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navegacion">
          <CommandItem onSelect={() => runCommand(() => router.push('/games'))}>
            <Gamepad2 size={16} className="mr-2" />
            <span>Ir a Juegos</span>
          </CommandItem>
          {isAuthenticated && (
            <>
              {/* TODO: Implement global modal store to open these from command palette */}
              <CommandItem
                disabled
                className="opacity-50"
              >
                <BarChart3 size={16} className="mr-2" />
                <span>Mis Estadisticas</span>
                <span className="ml-auto text-xs text-(--color-text-muted)">
                  Pronto
                </span>
              </CommandItem>
              <CommandItem
                disabled
                className="opacity-50"
              >
                <Trophy size={16} className="mr-2" />
                <span>Ranking Global</span>
                <span className="ml-auto text-xs text-(--color-text-muted)">
                  Pronto
                </span>
              </CommandItem>
            </>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export default CommandPalette;
