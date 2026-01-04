import { Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme, type ThemeName } from '../../../app/providers/ThemeProvider';
import { cn } from '../../../lib/utils';

interface ThemeOption {
  name: ThemeName;
  label: string;
  icon: typeof Sun;
  colors: {
    primary: string;
    secondary: string;
  };
}

const themes: ThemeOption[] = [
  {
    name: 'neon',
    label: 'Neon',
    icon: Sparkles,
    colors: {
      primary: '#4deeea',
      secondary: '#f000ff',
    },
  },
  {
    name: 'dark',
    label: 'Dark',
    icon: Moon,
    colors: {
      primary: '#60a5fa',
      secondary: '#a78bfa',
    },
  },
  {
    name: 'light',
    label: 'Light',
    icon: Sun,
    colors: {
      primary: '#0891b2',
      secondary: '#7c3aed',
    },
  },
];

interface ThemeSelectorProps {
  className?: string;
}

export function ThemeSelector({ className }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={cn('flex gap-2', className)}>
      {themes.map((t) => {
        const Icon = t.icon;
        const isActive = theme === t.name;

        return (
          <button
            key={t.name}
            onClick={() => setTheme(t.name)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
              'hover:scale-105 active:scale-95',
              isActive
                ? 'bg-[var(--color-primary)] text-black font-semibold'
                : 'bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface)]/80'
            )}
            title={t.label}
          >
            <Icon size={18} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default ThemeSelector;
