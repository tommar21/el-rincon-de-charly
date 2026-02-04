'use client';

import { memo, useCallback } from 'react';
import { Bot, Wifi, Coins, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface FilterState {
  features: {
    supportsAI: boolean;
    supportsOnline: boolean;
    supportsBetting: boolean;
  };
}

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  gameCount: number;
  filteredCount: number;
}

const featureToggles: { key: keyof FilterState['features']; label: string; icon: typeof Bot }[] = [
  { key: 'supportsAI', label: 'VS IA', icon: Bot },
  { key: 'supportsOnline', label: 'Online', icon: Wifi },
  { key: 'supportsBetting', label: 'Apuestas', icon: Coins },
];

export const FilterBar = memo(function FilterBar({ filters, onFiltersChange, gameCount, filteredCount }: FilterBarProps) {
  const hasActiveFilters = Object.values(filters.features).some(Boolean);

  const handleFeatureToggle = useCallback((feature: keyof FilterState['features']) => {
    onFiltersChange({
      ...filters,
      features: {
        ...filters.features,
        [feature]: !filters.features[feature],
      },
    });
  }, [filters, onFiltersChange]);

  const handleClearFilters = useCallback(() => {
    onFiltersChange({
      features: {
        supportsAI: false,
        supportsOnline: false,
        supportsBetting: false,
      },
    });
  }, [onFiltersChange]);

  return (
    <div className="mb-6">
      {/* Feature Toggles - Horizontal scroll on mobile */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <span className="text-xs text-(--color-text-muted) uppercase tracking-wider whitespace-nowrap shrink-0">Filtrar:</span>

        <div className="flex items-center gap-2">
          {featureToggles.map(({ key, label, icon: Icon }) => {
            const isActive = filters.features[key];
            return (
              <button
                key={key}
                onClick={() => handleFeatureToggle(key)}
                aria-label={`Filtrar por ${label}`}
                aria-pressed={isActive}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0',
                  'transition-all duration-200 border',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) focus-visible:ring-offset-2',
                  isActive
                    ? 'bg-(--color-primary)/10 border-(--color-primary) text-(--color-primary)'
                    : 'bg-transparent border-(--color-border) text-(--color-text-muted) hover:border-(--color-text-muted)'
                )}
              >
                <Icon size={12} />
                {label}
              </button>
            );
          })}

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              aria-label="Limpiar todos los filtros"
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0',
                'text-(--color-error) hover:bg-(--color-error)/10',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-error) focus-visible:ring-offset-2'
              )}
            >
              <X size={12} />
              Limpiar
            </button>
          )}
        </div>

        {/* Results count */}
        {hasActiveFilters && (
          <span className="text-xs text-(--color-text-muted) whitespace-nowrap shrink-0 ml-auto">
            {filteredCount}/{gameCount}
          </span>
        )}
      </div>
    </div>
  );
});
