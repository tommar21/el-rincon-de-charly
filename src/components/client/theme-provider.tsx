'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type Theme = 'ember' | 'midnight' | 'dawn';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'el-rincon-theme';

// Migration map for old theme names
const THEME_MIGRATION: Record<string, Theme> = {
  neon: 'ember',
  dark: 'midnight',
  light: 'dawn',
};

const VALID_THEMES: Theme[] = ['ember', 'midnight', 'dawn'];

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({
  children,
  defaultTheme = 'ember',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount (with migration support)
  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) {
      // Check if it's an old theme name that needs migration
      if (THEME_MIGRATION[stored]) {
        const migratedTheme = THEME_MIGRATION[stored];
        setThemeState(migratedTheme);
        localStorage.setItem(THEME_KEY, migratedTheme);
      } else if (VALID_THEMES.includes(stored as Theme)) {
        setThemeState(stored as Theme);
      }
    }
    setMounted(true);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(THEME_KEY, theme);
    }
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  // Prevent flash of wrong theme
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  // Return default values during SSR/prerendering when context is not available
  if (context === undefined) {
    return {
      theme: 'ember' as Theme,
      setTheme: () => {},
    };
  }
  return context;
}

export default ThemeProvider;
