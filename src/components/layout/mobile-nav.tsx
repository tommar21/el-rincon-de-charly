'use client';

import { ReactNode } from 'react';
import { Gamepad2, Coins, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GameSection } from './sidebar';

interface MobileNavProps {
  currentSection: GameSection;
  onSectionChange: (section: GameSection) => void;
  onSearchClick: () => void;
  mobileSidebar?: ReactNode;
}

export function MobileNav({
  currentSection,
  onSectionChange,
  onSearchClick,
  mobileSidebar,
}: MobileNavProps) {
  return (
    <nav className="bottom-nav safe-bottom" aria-label="Navegacion principal">
      {/* Menu trigger - renders MobileSidebar Sheet */}
      <div className="bottom-nav-item">
        {mobileSidebar}
      </div>

      <button
        onClick={() => onSectionChange('arcade')}
        className={cn('bottom-nav-item', currentSection === 'arcade' && 'active')}
        aria-pressed={currentSection === 'arcade'}
        aria-label="Seccion Arcade"
      >
        <Gamepad2 size={20} aria-hidden="true" />
        <span>Arcade</span>
      </button>

      <button
        onClick={() => onSectionChange('casino')}
        className={cn('bottom-nav-item', currentSection === 'casino' && 'active')}
        aria-pressed={currentSection === 'casino'}
        aria-label="Seccion Casino"
      >
        <Coins size={20} aria-hidden="true" />
        <span>Casino</span>
      </button>

      <button
        onClick={onSearchClick}
        className="bottom-nav-item"
        aria-label="Abrir busqueda"
      >
        <Search size={20} aria-hidden="true" />
        <span>Buscar</span>
      </button>
    </nav>
  );
}

export default MobileNav;
