'use client';

import { useEffect, useState } from 'react';
import { DURATION, SCALE, prefersReducedMotion } from '@/lib/theme/animations';

/**
 * useMotionConfig Hook
 *
 * Hook para obtener la configuración de animaciones respetando
 * las preferencias del usuario (prefers-reduced-motion)
 *
 * @returns Configuración de animación con shouldReduceMotion, duration y scale
 *
 * @example
 * const { shouldReduceMotion, duration, scale } = useMotionConfig();
 *
 * <motion.div
 *   animate={{ scale: scale.hover }}
 *   transition={{ duration: duration / 1000 }}
 * />
 */
export function useMotionConfig() {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    // Verificar preferencia inicial
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setShouldReduceMotion(mediaQuery.matches);

    // Listener para cambios en la preferencia
    const handleChange = (e: MediaQueryListEvent) => {
      setShouldReduceMotion(e.matches);
    };

    // Agregar listener (soporte para navegadores antiguos y modernos)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback para navegadores antiguos
      mediaQuery.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return {
    shouldReduceMotion,
    // Si reduce motion está activo, duración = 0
    duration: shouldReduceMotion ? 0 : DURATION.normal,
    // Si reduce motion está activo, sin escala
    scale: shouldReduceMotion ? SCALE.none : SCALE.subtle,
  };
}

/**
 * useMotionConfigWithCustom Hook
 *
 * Versión del hook que permite especificar duration y scale custom
 *
 * @param customDuration - Duración personalizada (de DURATION)
 * @param customScale - Escala personalizada (de SCALE)
 * @returns Configuración de animación
 */
export function useMotionConfigWithCustom(
  customDuration: keyof typeof DURATION = 'normal',
  customScale: keyof typeof SCALE = 'subtle'
) {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setShouldReduceMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setShouldReduceMotion(e.matches);
    };

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

  return {
    shouldReduceMotion,
    duration: shouldReduceMotion ? 0 : DURATION[customDuration],
    scale: shouldReduceMotion ? SCALE.none : SCALE[customScale],
  };
}
