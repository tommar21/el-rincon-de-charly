import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Loading Components System
 * Componentes unificados para estados de carga:
 * - Skeleton: placeholder animado para contenido
 * - Spinner: indicador de carga rotatorio
 * - LoadingCard: skeleton pre-configurado para cards
 */

// =============================================================================
// SKELETON COMPONENT
// =============================================================================

const skeletonVariants = cva(
  'animate-pulse rounded-lg bg-(--color-border)',
  {
    variants: {
      variant: {
        default: '',
        shimmer: cn(
          'relative overflow-hidden',
          'before:absolute before:inset-0',
          'before:-translate-x-full',
          'before:animate-[shimmer_2s_infinite]',
          'before:bg-gradient-to-r',
          'before:from-transparent before:via-white/10 before:to-transparent'
        ),
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

function Skeleton({ className, variant, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
    />
  );
}

// =============================================================================
// SPINNER COMPONENT
// =============================================================================

const spinnerVariants = cva('animate-spin', {
  variants: {
    size: {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      default: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-8 h-8',
    },
    variant: {
      primary: 'text-(--color-primary)',
      secondary: 'text-(--color-secondary)',
      accent: 'text-(--color-accent)',
      muted: 'text-(--color-text-muted)',
    },
  },
  defaultVariants: {
    size: 'default',
    variant: 'primary',
  },
});

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string;
}

function Spinner({ className, size, variant, label, ...props }: SpinnerProps) {
  return (
    <div
      className="flex items-center gap-2"
      role="status"
      aria-busy="true"
      aria-label={label || 'Cargando'}
      {...props}
    >
      <Loader2
        className={cn(spinnerVariants({ size, variant }), className)}
        aria-hidden="true"
      />
      {label && (
        <span className="text-sm text-(--color-text-muted)">{label}</span>
      )}
      {!label && <span className="sr-only">Cargando...</span>}
    </div>
  );
}

// =============================================================================
// LOADING CARD COMPONENT
// =============================================================================

interface LoadingCardProps {
  count?: number;
  className?: string;
  showAvatar?: boolean;
}

function LoadingCard({
  count = 1,
  className,
  showAvatar = true,
}: LoadingCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'rounded-2xl bg-(--color-surface)',
            'border border-(--color-border)',
            'p-6 space-y-4',
            className
          )}
        >
          <div className="flex items-center gap-4">
            {showAvatar && (
              <Skeleton
                className="w-12 h-12 rounded-xl"
                variant="shimmer"
              />
            )}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" variant="shimmer" />
              <Skeleton className="h-3 w-1/2" variant="shimmer" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

// =============================================================================
// LOADING LIST COMPONENT
// =============================================================================

interface LoadingListProps {
  count?: number;
  className?: string;
}

function LoadingList({ count = 3, className }: LoadingListProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-lg bg-(--color-surface)"
        >
          <Skeleton className="w-10 h-10 rounded-lg" variant="shimmer" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-full" variant="shimmer" />
            <Skeleton className="h-2 w-2/3" variant="shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// LOADING BUTTON COMPONENT
// =============================================================================

interface LoadingButtonProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'muted';
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl';
}

function LoadingButton({
  children = 'Cargando...',
  variant = 'primary',
  size = 'default',
}: LoadingButtonProps) {
  return (
    <button
      disabled
      aria-disabled="true"
      aria-busy="true"
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'rounded-xl font-semibold',
        'transition-all duration-200',
        'opacity-50 cursor-not-allowed',
        'bg-(--color-surface) text-(--color-text)',
        size === 'xs' && 'h-10 px-3 text-xs',
        size === 'sm' && 'h-10 px-4 text-sm',
        size === 'default' && 'h-11 px-6 text-base',
        size === 'lg' && 'h-12 px-8 text-lg',
        size === 'xl' && 'h-14 px-10 text-xl'
      )}
    >
      <Spinner size={size === 'default' ? 'sm' : size} variant={variant} />
      {children}
    </button>
  );
}

export { Skeleton, Spinner, LoadingCard, LoadingList, LoadingButton };
