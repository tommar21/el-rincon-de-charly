/**
 * Animation Constants
 * Constantes para duraciones, easings y escalas de animación
 */

// Duraciones de animación (en ms)
export const DURATION = {
  instant: 0,
  fast: 150,
  normal: 200,
  slow: 300,
  slower: 500,
} as const;

export type AnimationDuration = keyof typeof DURATION;

// Easings para animaciones
export const EASING = {
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

export type AnimationEasing = keyof typeof EASING;

// Escalas de transformación para hover/active states
export const SCALE = {
  none: { hover: 1, active: 1 },
  subtle: { hover: 1.02, active: 0.98 },  // Para la mayoría de elementos
  normal: { hover: 1.05, active: 0.95 },  // Solo para GameCard u elementos destacados
  large: { hover: 1.1, active: 0.9 },     // Raramente usado
} as const;

export type AnimationScale = keyof typeof SCALE;

// Variantes de Framer Motion para animaciones comunes
export const motionVariants = {
  // Fade in/out
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: DURATION.normal / 1000 },
  },

  // Fade in con movimiento vertical
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: DURATION.normal / 1000 },
  },

  // Scale in/out
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: DURATION.normal / 1000, ease: EASING.easeOut },
  },

  // Slide in desde la derecha
  slideInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: DURATION.normal / 1000 },
  },

  // Stagger children (para listas)
  staggerChildren: {
    animate: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  },
} as const;

// Helpers para detectar preferencias de usuario

/**
 * Verifica si el usuario prefiere movimiento reducido
 * @returns true si el usuario ha activado prefers-reduced-motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Obtiene la duración apropiada respetando preferencias del usuario
 * @param duration - Duración deseada
 * @returns 0 si prefers-reduced-motion está activo, duration en ms si no
 */
export function getAnimationDuration(duration: AnimationDuration): number {
  return prefersReducedMotion() ? 0 : DURATION[duration];
}

/**
 * Obtiene la escala apropiada respetando preferencias del usuario
 * @param scale - Escala deseada
 * @returns SCALE.none si prefers-reduced-motion está activo, scale si no
 */
export function getAnimationScale(scale: AnimationScale): typeof SCALE[AnimationScale] {
  return prefersReducedMotion() ? SCALE.none : SCALE[scale];
}

/**
 * Genera string de transition CSS respetando preferencias
 * @param properties - Propiedades CSS a animar
 * @param duration - Duración
 * @param easing - Easing function
 * @returns String de transition CSS
 */
export function getTransitionCSS(
  properties: string | string[],
  duration: AnimationDuration = 'normal',
  easing: AnimationEasing = 'easeInOut'
): string {
  const props = Array.isArray(properties) ? properties : [properties];
  const dur = getAnimationDuration(duration);

  if (dur === 0) return 'none';

  return props
    .map((prop) => `${prop} ${dur}ms ${EASING[easing]}`)
    .join(', ');
}
