'use client';

import { ChevronUp, Check } from 'lucide-react';
import { useTheme } from '@/components/client/theme-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils/cn';
import { AVAILABLE_THEMES, getThemeById } from '@/lib/theme/themes';

interface ThemeSelectorProps {
  className?: string;
  compact?: boolean;
}

export function ThemeSelector({ className, compact = false }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();

  const currentTheme = getThemeById(theme);
  const CurrentIcon = currentTheme.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <Button
            variant="ghost"
            size="icon"
            className={cn('w-10 h-10', className)}
          >
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`,
              }}
            >
              <CurrentIcon size={16} className="text-white" />
            </div>
          </Button>
        ) : (
          <Button
            variant="outline"
            className={cn(
              'gap-2 px-3 py-2.5 h-auto flex-1',
              'hover:border-primary/50',
              className
            )}
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`,
              }}
            >
              <CurrentIcon size={12} className="text-white" />
            </div>
            <span className="text-sm font-medium">{currentTheme.label}</span>
            <ChevronUp size={14} className="text-(--color-text-muted) ml-auto" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align={compact ? 'center' : 'start'}
        className="w-52"
      >
        <DropdownMenuLabel className="text-xs uppercase tracking-wide text-(--color-text-muted)">
          Tema
        </DropdownMenuLabel>
        {AVAILABLE_THEMES.map((t) => {
          const Icon = t.icon;
          const isActive = theme === t.id;

          return (
            <DropdownMenuItem
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                'gap-3 py-2.5 cursor-pointer',
                isActive && 'bg-primary/10'
              )}
            >
              {/* Color Preview */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.secondary})`,
                }}
              >
                <Icon size={14} className="text-white" />
              </div>

              {/* Label */}
              <div className="flex flex-col flex-1 min-w-0">
                <span className={cn('text-sm font-medium', isActive && 'text-(--color-primary)')}>
                  {t.label}
                </span>
                <span className="text-xs text-(--color-text-muted)">
                  {t.description}
                </span>
              </div>

              {/* Active Indicator */}
              {isActive && (
                <Check size={16} className="text-(--color-primary) shrink-0" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ThemeSelector;
