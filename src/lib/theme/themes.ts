import { Zap, Moon, Flame } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Theme } from '@/components/client/theme-provider';

export interface ThemeConfig {
  id: Theme;
  label: string;
  description: string;
  icon: LucideIcon;
  emoji: string;
  colors: {
    primary: string;
    secondary: string;
  };
}

/**
 * Centralized theme configuration.
 * Used by theme-selector, command-palette, and settings-modal.
 */
export const AVAILABLE_THEMES: ThemeConfig[] = [
  {
    id: 'ember',
    label: 'Ember',
    description: 'Naranja vibrante',
    icon: Flame,
    emoji: '🔥',
    colors: {
      primary: '#FF6B35',
      secondary: '#7C4DFF',
    },
  },
  {
    id: 'midnight',
    label: 'Midnight',
    description: 'Azul profundo',
    icon: Moon,
    emoji: '🌙',
    colors: {
      primary: '#3B82F6',
      secondary: '#6366F1',
    },
  },
  {
    id: 'neon',
    label: 'Neon',
    description: 'Vibrante y futurista',
    icon: Zap,
    emoji: '💜',
    colors: {
      primary: '#00F5FF',
      secondary: '#FF00FF',
    },
  },
] as const;

/**
 * Get theme config by ID
 */
export function getThemeById(themeId: Theme): ThemeConfig {
  return AVAILABLE_THEMES.find(t => t.id === themeId) || AVAILABLE_THEMES[0];
}

/**
 * Theme IDs for type safety
 */
export const THEME_IDS = AVAILABLE_THEMES.map(t => t.id);
