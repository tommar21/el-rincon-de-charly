'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gamepad2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  onSearchClick: () => void;
  mobileSidebar?: ReactNode;
}

export function MobileNav({
  onSearchClick,
  mobileSidebar,
}: MobileNavProps) {
  const pathname = usePathname();

  // Check if we're on the games page or inside a game
  const isGamesActive = pathname?.startsWith('/games');

  return (
    <nav className="bottom-nav safe-bottom" aria-label="Navegacion principal">
      {/* Menu trigger - renders MobileSidebar Sheet */}
      <div className="bottom-nav-item">
        {mobileSidebar}
      </div>

      <Link
        href="/games"
        className={cn('bottom-nav-item', isGamesActive && 'active')}
        aria-current={isGamesActive ? 'page' : undefined}
      >
        <Gamepad2 size={20} aria-hidden="true" />
        <span>Juegos</span>
      </Link>

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
