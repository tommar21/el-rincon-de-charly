'use client';

import { useState, useEffect, useCallback } from 'react';
import { TOUCH_TARGET_MIN } from '@/lib/theme/breakpoints';

/**
 * Responsive Hook - SSR-safe responsive utilities
 *
 * Solves hydration mismatch issues by:
 * 1. Using safe default values during SSR
 * 2. Updating values only on client via useEffect
 * 3. Listening to resize events for dynamic updates
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isMobile, isTouch, width } = useResponsive();
 *
 *   return (
 *     <div style={{ padding: isMobile ? '16px' : '32px' }}>
 *       {isTouch ? 'Touch device' : 'Non-touch device'}
 *     </div>
 *   );
 * }
 * ```
 */

interface ResponsiveState {
  /** Window width in pixels */
  width: number;
  /** Window height in pixels */
  height: number;
  /** Is viewport < 768px */
  isMobile: boolean;
  /** Is viewport 768px - 1023px */
  isTablet: boolean;
  /** Is viewport >= 1024px */
  isDesktop: boolean;
  /** Device supports touch */
  isTouch: boolean;
  /** Viewport is landscape */
  isLandscape: boolean;
  /** Viewport is portrait */
  isPortrait: boolean;
  /** Has been hydrated on client */
  isHydrated: boolean;
}

interface UseResponsiveReturn extends ResponsiveState {
  /** Get touch-friendly size (min 44px for touch devices) */
  getTouchFriendlySize: (baseSize: number) => number;
}

const DEFAULT_STATE: ResponsiveState = {
  width: 0,
  height: 0,
  isMobile: false,
  isTablet: false,
  isDesktop: true, // Default to desktop for SSR
  isTouch: false,
  isLandscape: true,
  isPortrait: false,
  isHydrated: false,
};

function getResponsiveState(): ResponsiveState {
  if (typeof window === 'undefined') {
    return DEFAULT_STATE;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return {
    width,
    height,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    isTouch,
    isLandscape: width > height,
    isPortrait: height > width,
    isHydrated: true,
  };
}

export function useResponsive(): UseResponsiveReturn {
  const [state, setState] = useState<ResponsiveState>(DEFAULT_STATE);

  // Update state on client mount and resize
  useEffect(() => {
    const updateState = () => {
      setState(getResponsiveState());
    };

    // Initial update
    updateState();

    // Listen to resize events with debounce
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateState, 100);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Memoized function for touch-friendly sizes
  const getTouchFriendlySize = useCallback(
    (baseSize: number): number => {
      return state.isTouch ? Math.max(baseSize, TOUCH_TARGET_MIN) : baseSize;
    },
    [state.isTouch]
  );

  return {
    ...state,
    getTouchFriendlySize,
  };
}

/**
 * Hook for media query matching - SSR-safe
 *
 * @param query - CSS media query string
 * @returns boolean indicating if query matches
 *
 * @example
 * ```tsx
 * const isDark = useMediaQuery('(prefers-color-scheme: dark)');
 * const isLargeScreen = useMediaQuery('(min-width: 1280px)');
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches); // eslint-disable-line react-hooks/set-state-in-effect -- browser API sync

    // Listen for changes
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]);

  return matches;
}

export default useResponsive;
