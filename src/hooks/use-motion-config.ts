'use client';

import { useEffect, useState } from 'react';
import { DURATION, SCALE } from '@/lib/theme/animations';

/**
 * Hook interno para detectar preferencia de reduced motion
 */
function useReducedMotion() {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setShouldReduceMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setShouldReduceMotion(e.matches);
    };

    // Soporte para navegadores modernos y antiguos
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return shouldReduceMotion;
}

/**
 * useMotionConfig Hook
 *
 * Hook para obtener la configuración de animaciones respetando
 * las preferencias del usuario (prefers-reduced-motion)
 *
 * @param customDuration - Duración personalizada (de DURATION), default: 'normal'
 * @param customScale - Escala personalizada (de SCALE), default: 'subtle'
 * @returns Configuración de animación con shouldReduceMotion, duration y scale
 *
 * @example
 * // Uso básico
 * const { shouldReduceMotion, duration, scale } = useMotionConfig();
 *
 * // Uso con parámetros personalizados
 * const { duration, scale } = useMotionConfig('fast', 'medium');
 *
 * <motion.div
 *   animate={{ scale: scale.hover }}
 *   transition={{ duration: duration / 1000 }}
 * />
 */
export function useMotionConfig(
  customDuration: keyof typeof DURATION = 'normal',
  customScale: keyof typeof SCALE = 'subtle'
) {
  const shouldReduceMotion = useReducedMotion();

  return {
    shouldReduceMotion,
    duration: shouldReduceMotion ? 0 : DURATION[customDuration],
    scale: shouldReduceMotion ? SCALE.none : SCALE[customScale],
  };
}

/**
 * @deprecated Use useMotionConfig with parameters instead
 * @example useMotionConfig('normal', 'subtle')
 */
export function useMotionConfigWithCustom(
  customDuration: keyof typeof DURATION = 'normal',
  customScale: keyof typeof SCALE = 'subtle'
) {
  return useMotionConfig(customDuration, customScale);
}
