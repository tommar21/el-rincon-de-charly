'use client';

import { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Gamepad2, Coins, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore, type GameSection } from './sidebar';

interface MobileNavProps {
  onSearchClick: () => void;
  mobileSidebar?: ReactNode;
}

export function MobileNav({
  onSearchClick,
  mobileSidebar,
}: MobileNavProps) {
  const { currentSection, setCurrentSection } = useSidebarStore();
  const pathname = usePathname();
  const router = useRouter();

  // Check if we're inside a game page (e.g., /games/tic-tac-toe)
  const isInGame = pathname?.match(/^\/games\/[^/]+$/) !== null;

  // Handle section change with redirect if inside a game
  const handleSectionChange = (section: GameSection) => {
    setCurrentSection(section);
    if (isInGame) {
      router.push('/games');
    }
  };

  return (
    <nav className="bottom-nav safe-bottom" aria-label="Navegacion principal">
      {/* Menu trigger - renders MobileSidebar Sheet */}
      <div className="bottom-nav-item">
        {mobileSidebar}
      </div>

      <button
        onClick={() => handleSectionChange('arcade')}
        className={cn('bottom-nav-item', currentSection === 'arcade' && 'active')}
        aria-pressed={currentSection === 'arcade'}
        aria-label="Seccion Arcade"
      >
        <Gamepad2 size={20} aria-hidden="true" />
        <span>Arcade</span>
      </button>

      <button
        onClick={() => handleSectionChange('casino')}
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
