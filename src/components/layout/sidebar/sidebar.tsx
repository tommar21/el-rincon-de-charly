'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Gamepad2,
  Coins,
  Search,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo, LogoIcon } from '@/components/brand/logo';
import { UserMenu, useAuth } from '@/features/auth';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSidebarStore, type GameSection } from './use-sidebar-store';

// Animation variants for smooth transitions
const fadeInOut = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const slideIn = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -8 },
};

export function Sidebar() {
  const {
    isCollapsed,
    isHoverExpanded,
    toggle,
    setHoverExpanded,
    currentSection,
    setCurrentSection,
  } = useSidebarStore();
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Computed: show expanded content when not collapsed OR when hover expanded
  const showExpanded = !isCollapsed || isHoverExpanded;

  // The actual visual width of the sidebar
  const sidebarWidth = showExpanded ? 'var(--sidebar-width)' : 'var(--sidebar-collapsed-width)';

  // The margin for main content (only changes on actual collapse, not hover)
  const contentMargin = isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)';

  // Check if we're inside a game page (e.g., /games/tic-tac-toe)
  const isInGame = pathname?.match(/^\/games\/[^/]+$/) !== null;

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use ref for toggle to avoid re-adding event listener on every render
  const toggleRef = useRef(toggle);
  toggleRef.current = toggle;

  // Keyboard shortcut: Ctrl/Cmd + B - only adds listener once
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggleRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Empty deps - never re-adds listener

  // Hover handlers for expand-on-hover functionality
  const handleMouseEnter = useCallback(() => {
    if (!isCollapsed) return; // Only expand on hover when collapsed

    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Small delay before expanding to avoid accidental triggers
    hoverTimeoutRef.current = setTimeout(() => {
      setHoverExpanded(true);
    }, 100);
  }, [isCollapsed, setHoverExpanded]);

  const handleMouseLeave = useCallback(() => {
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Collapse immediately when mouse leaves
    setHoverExpanded(false);
  }, [setHoverExpanded]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Handle section change with redirect if inside a game
  const handleSectionChange = (section: GameSection) => {
    setCurrentSection(section);
    if (isInGame) {
      router.push('/games');
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
          'flex flex-col overflow-hidden',
          'hidden md:flex'
        )}
        initial={false}
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header - Logo + Collapse Button */}
        <div className="flex items-center justify-between px-4 pt-5 pb-4 border-b border-(--sidebar-border)">
          <Link href="/games" className="flex items-center min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              {!showExpanded ? (
                <motion.div
                  key="icon"
                  variants={fadeInOut}
                  initial="initial"
                  animate="animate"
                  exit="exit"
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
                  variants={slideIn}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.15 }}
                >
                  <Logo size="md" />
                </motion.div>
              )}
            </AnimatePresence>
          </Link>

          <AnimatePresence initial={false}>
            {showExpanded && (
              <motion.div
                variants={fadeInOut}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.15 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggle}
                      className="h-8 w-8 shrink-0"
                    >
                      {isCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {isCollapsed ? 'Fijar expandido (Ctrl+B)' : 'Colapsar (Ctrl+B)'}
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Expand button when collapsed (not hover expanded) */}
        <AnimatePresence initial={false}>
          {!showExpanded && (
            <motion.div
              className="p-2 border-b border-(--sidebar-border)"
              variants={fadeInOut}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.15 }}
            >
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section Toggle (Arcade / Casino) */}
        <div className={cn('border-b border-(--sidebar-border)/30 transition-all duration-200', showExpanded ? 'px-4 pt-4 pb-4' : 'px-3 pt-3 pb-3')}>
          <AnimatePresence mode="wait" initial={false}>
            {!showExpanded ? (
              <motion.div
                key="collapsed-sections"
                className="flex flex-col gap-2"
                variants={fadeInOut}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.15 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={currentSection === 'arcade' ? 'primary' : 'ghost'}
                      size="icon"
                      onClick={() => handleSectionChange('arcade')}
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
                      onClick={() => handleSectionChange('casino')}
                      className="w-full h-10"
                    >
                      <Coins size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Casino</TooltipContent>
                </Tooltip>
              </motion.div>
            ) : (
              <motion.div
                key="expanded-sections"
                variants={slideIn}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.15 }}
              >
                <ToggleGroup
                  type="single"
                  value={currentSection}
                  onValueChange={(value) => value && handleSectionChange(value as GameSection)}
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search */}
        <AnimatePresence mode="wait" initial={false}>
          {showExpanded ? (
            <motion.div
              key="expanded-search"
              className="px-4 py-4"
              variants={slideIn}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.15 }}
            >
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
            </motion.div>
          ) : (
            <motion.div
              key="collapsed-search"
              className="p-2"
              variants={fadeInOut}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.15 }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-full h-10" aria-label="Buscar juegos">
                    <Search size={18} aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Buscar (Ctrl+K)</TooltipContent>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div className={cn('border-t border-(--sidebar-border) transition-all duration-200', showExpanded ? 'p-4' : 'p-3')}>
          <AnimatePresence mode="wait" initial={false}>
            {!showExpanded ? (
              <motion.div
                key="collapsed-user"
                variants={fadeInOut}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.15 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <UserMenu compact />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {isAuthenticated ? 'Perfil' : 'Iniciar sesión'}
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            ) : (
              <motion.div
                key="expanded-user"
                variants={slideIn}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.15 }}
              >
                <UserMenu className="w-full" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* Main content margin - only responds to actual collapse state, not hover */}
      <motion.div
        className="hidden md:block"
        initial={false}
        animate={{ marginLeft: contentMargin }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      />
    </TooltipProvider>
  );
}

export default Sidebar;
