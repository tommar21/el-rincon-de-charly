import { TOUCH_TARGET_MIN } from '@/lib/theme/breakpoints';

/**
 * Responsive Utilities
 * Funciones helper para detección de dispositivos y tamaños touch-friendly
 */

/**
 * Verifica si el dispositivo es mobile (< 768px)
 * @returns true si es mobile
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

/**
 * Verifica si el dispositivo es tablet (768px - 1024px)
 * @returns true si es tablet
 */
export function isTablet(): boolean {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  return width >= 768 && width < 1024;
}

/**
 * Verifica si el dispositivo es desktop (>= 1024px)
 * @returns true si es desktop
 */
export function isDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 1024;
}

/**
 * Verifica si el dispositivo soporta touch
 * @returns true si soporta touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Obtiene el tamaño apropiado para touch targets
 * Si es dispositivo touch, asegura que el tamaño sea al menos 44px (WCAG)
 * @param baseSize - Tamaño base deseado
 * @returns Tamaño apropiado en pixels
 */
export function getTouchFriendlySize(baseSize: number): number {
  if (typeof window === 'undefined') return baseSize;

  const isTouch = isTouchDevice();
  return isTouch ? Math.max(baseSize, TOUCH_TARGET_MIN) : baseSize;
}

/**
 * Obtiene el ancho de la ventana
 * @returns Ancho en pixels, 0 si no está disponible
 */
export function getWindowWidth(): number {
  if (typeof window === 'undefined') return 0;
  return window.innerWidth;
}

/**
 * Obtiene el alto de la ventana
 * @returns Alto en pixels, 0 si no está disponible
 */
export function getWindowHeight(): number {
  if (typeof window === 'undefined') return 0;
  return window.innerHeight;
}

/**
 * Verifica si el viewport es landscape
 * @returns true si es landscape
 */
export function isLandscape(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > window.innerHeight;
}

/**
 * Verifica si el viewport es portrait
 * @returns true si es portrait
 */
export function isPortrait(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerHeight > window.innerWidth;
}
