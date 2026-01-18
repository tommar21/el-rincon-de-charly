'use client';

import { useState } from 'react';
import { Sidebar, MobileSidebar, type GameSection } from './sidebar';
import { MobileNav } from './mobile-nav';
import { CommandPalette } from '@/components/global/command-palette';
import { PageTransition } from '@/components/client/page-transition';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [currentSection, setCurrentSection] = useState<GameSection>('arcade');
  const [currentCategory, setCurrentCategory] = useState<string | undefined>(
    undefined
  );
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const handleSearchClick = () => {
    setIsCommandPaletteOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-(--color-background)">
      {/* Desktop Sidebar */}
      <Sidebar
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        currentCategory={currentCategory}
        onCategoryChange={setCurrentCategory}
      />

      {/* Main Content */}
      <main className="main-content min-h-screen">
        <PageTransition>{children}</PageTransition>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        onSearchClick={handleSearchClick}
        mobileSidebar={
          <MobileSidebar
            currentSection={currentSection}
            onSectionChange={setCurrentSection}
            currentCategory={currentCategory}
            onCategoryChange={setCurrentCategory}
            onSearchClick={handleSearchClick}
          />
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
