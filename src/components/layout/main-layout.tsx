'use client';

import { useState, useEffect } from 'react';
import { Sidebar, MobileSidebar, useIsCollapsed } from './sidebar';
import { MobileNav } from './mobile-nav';
import { CommandPalette } from '@/components/global/command-palette';
import { PageTransition } from '@/components/client/page-transition';

interface MainLayoutProps {
  children: React.ReactNode;
}

// Check if we're on mobile (client-side only)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const isCollapsed = useIsCollapsed();
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearchClick = () => {
    setIsCommandPaletteOpen(true);
  };

  // Calculate margin based on collapsed state (only on desktop)
  // On mobile, margin should be 0
  const mainMargin = isMobile
    ? '0'
    : mounted && isCollapsed
      ? 'var(--sidebar-collapsed-width)'
      : 'var(--sidebar-width)';

  return (
    <div className="relative min-h-screen bg-(--color-background)">
      {/* Desktop Sidebar */}
      <Sidebar onSearchClick={handleSearchClick} />

      {/* Main Content */}
      <main
        className="main-content min-h-screen transition-[margin] duration-200 ease-out"
        style={{ marginLeft: mainMargin }}
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
        isMobile={isMobile}
      />
    </div>
  );
}

export default MainLayout;
