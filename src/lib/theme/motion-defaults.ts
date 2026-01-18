import type { Transition, Variants, Easing } from 'framer-motion';
import { DURATION } from './animations';

/**
 * Motion Presets - Configuraciones estándar para animaciones
 *
 * Usar estos presets asegura consistencia en toda la aplicación
 * y facilita el mantenimiento de animaciones.
 */

// =============================================================================
// EASING PRESETS (Array format for Framer Motion)
// =============================================================================

export const MOTION_EASING = {
  easeIn: [0.4, 0, 1, 1] as Easing,
  easeOut: [0, 0, 0.2, 1] as Easing,
  easeInOut: [0.4, 0, 0.2, 1] as Easing,
  spring: [0.68, -0.55, 0.265, 1.55] as Easing,
} as const;

// =============================================================================
// TRANSITION PRESETS
// =============================================================================

export const TRANSITIONS = {
  /** Transición rápida para micro-interacciones */
  fast: {
    type: 'tween',
    duration: DURATION.fast / 1000,
    ease: MOTION_EASING.easeOut,
  } as Transition,

  /** Transición estándar para la mayoría de animaciones */
  normal: {
    type: 'tween',
    duration: DURATION.normal / 1000,
    ease: MOTION_EASING.easeOut,
  } as Transition,

  /** Transición lenta para elementos grandes */
  slow: {
    type: 'tween',
    duration: DURATION.slow / 1000,
    ease: MOTION_EASING.easeInOut,
  } as Transition,

  /** Transición tipo spring para elementos interactivos */
  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 25,
    mass: 1,
  } as Transition,

  /** Transición tipo spring suave para modales */
  springModal: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
    mass: 1,
  } as Transition,

  /** Transición para páginas */
  page: {
    type: 'tween',
    duration: 0.2,
    ease: MOTION_EASING.easeInOut,
  } as Transition,
} as const;

// =============================================================================
// STAGGER PRESETS
// =============================================================================

export const STAGGER = {
  /** Stagger rápido para listas cortas */
  fast: 0.03,
  /** Stagger normal para listas */
  normal: 0.05,
  /** Stagger lento para efecto dramático */
  slow: 0.1,
} as const;

// =============================================================================
// VARIANT PRESETS
// =============================================================================

/** Variantes para fade in/out simple */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

/** Variantes para fade + slide up */
export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

/** Variantes para fade + slide down */
export const fadeDownVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
};

/** Variantes para scale in/out */
export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

/** Variantes para modales */
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
};

/** Variantes para pages */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

/** Variantes para cards con stagger */
export const cardContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: STAGGER.normal,
      delayChildren: 0.1,
    },
  },
};

export const cardItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

/** Variantes para listas con stagger */
export const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: STAGGER.fast,
    },
  },
};

export const listItemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Crea variantes de stagger personalizadas
 */
export function createStaggerVariants(
  staggerDelay: number = STAGGER.normal
): { container: Variants; item: Variants } {
  return {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay,
        },
      },
    },
    item: {
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 },
    },
  };
}

/**
 * Obtiene transición respetando prefers-reduced-motion
 */
export function getReducedMotionTransition(
  shouldReduce: boolean,
  normalTransition: Transition = TRANSITIONS.normal
): Transition {
  if (shouldReduce) {
    return { duration: 0 };
  }
  return normalTransition;
}

/**
 * Obtiene variantes respetando prefers-reduced-motion
 */
export function getReducedMotionVariants(
  shouldReduce: boolean,
  normalVariants: Variants
): Variants {
  if (shouldReduce) {
    // Sin animación - estados instantáneos
    return {
      hidden: { opacity: 1 },
      visible: { opacity: 1 },
      exit: { opacity: 1 },
      initial: { opacity: 1 },
      enter: { opacity: 1 },
    };
  }
  return normalVariants;
}
