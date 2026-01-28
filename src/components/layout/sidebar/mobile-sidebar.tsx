'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Gamepad2,
  Coins,
  Search,
  Menu,
} from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { ThemeSelector } from '@/features/settings';
import { UserMenu } from '@/features/auth';
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
import { useSidebarStore, type GameSection } from './use-sidebar-store';

interface MobileSidebarProps {
  onSearchClick?: () => void;
}

export function MobileSidebar({ onSearchClick }: MobileSidebarProps) {
  const { currentSection, setCurrentSection } = useSidebarStore();

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch with Radix UI generated IDs
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSectionChange = (section: GameSection) => {
    setCurrentSection(section);
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
            <div className="flex items-center gap-2">
              <ThemeSelector className="flex-1" />
              <UserMenu />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default MobileSidebar;
