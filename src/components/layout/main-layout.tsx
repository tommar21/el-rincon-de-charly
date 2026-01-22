'use client';

import { useState, useEffect } from 'react';
import { Sidebar, MobileSidebar, useIsCollapsed } from './sidebar';
import { MobileNav } from './mobile-nav';
import { CommandPalette } from '@/components/global/command-palette';
import { PageTransition } from '@/components/client/page-transition';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const isCollapsed = useIsCollapsed();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearchClick = () => {
    setIsCommandPaletteOpen(true);
  };

  // Calculate margin based on collapsed state (only on desktop)
  const mainMargin = mounted && isCollapsed
    ? 'var(--sidebar-collapsed-width)'
    : 'var(--sidebar-width)';

  return (
    <div className="relative min-h-screen bg-(--color-background)">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main
        className="main-content min-h-screen transition-[margin] duration-200 ease-out"
        style={{ marginLeft: mounted ? mainMargin : 'var(--sidebar-width)' }}
      >
        <PageTransition>{children}</PageTransition>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        onSearchClick={handleSearchClick}
        mobileSidebar={
          <MobileSidebar onSearchClick={handleSearchClick} />
        }
      />

      {/* Global Command Palette */}
      <CommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
      />
    </div>
  );
}

export default MainLayout;
