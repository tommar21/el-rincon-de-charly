/**
 * Breakpoints Constants
 * Definiciones de breakpoints para responsive design
 * Alineados con Tailwind CSS default breakpoints
 */

export const BREAKPOINTS = {
  xs: '375px',   // Small phones
  sm: '640px',   // Tailwind sm
  md: '768px',   // Tailwind md
  lg: '1024px',  // Tailwind lg
  xl: '1280px',  // Tailwind xl
  '2xl': '1536px', // Tailwind 2xl
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// Aliases semánticos
export const MOBILE_MAX = BREAKPOINTS.md;    // < 768px
export const TABLET_MIN = BREAKPOINTS.md;    // >= 768px
export const TABLET_MAX = BREAKPOINTS.lg;    // < 1024px
export const DESKTOP_MIN = BREAKPOINTS.lg;   // >= 1024px

// Touch target minimum size (WCAG recommendation)
export const TOUCH_TARGET_MIN = 44; // pixels

/**
 * Helper para crear media queries
 * @param breakpoint - Breakpoint a usar
 * @returns Media query string
 */
export function minWidth(breakpoint: Breakpoint): string {
  return `(min-width: ${BREAKPOINTS[breakpoint]})`;
}

/**
 * Helper para crear media queries max-width
 * @param breakpoint - Breakpoint a usar
 * @returns Media query string
 */
export function maxWidth(breakpoint: Breakpoint): string {
  return `(max-width: ${BREAKPOINTS[breakpoint]})`;
}

/**
 * Helper para crear media queries entre dos breakpoints
 * @param min - Breakpoint mínimo
 * @param max - Breakpoint máximo
 * @returns Media query string
 */
export function between(min: Breakpoint, max: Breakpoint): string {
  return `(min-width: ${BREAKPOINTS[min]}) and (max-width: ${BREAKPOINTS[max]})`;
}
