import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Button Variants System
 * Sistema unificado de botones con soporte para:
 * - 8 variantes de estilo (primary, secondary, accent, etc.)
 * - 6 tamaños (xs, sm, default, lg, xl, icon)
 * - 3 escalas de animación (none, subtle, normal)
 * - Estados de loading y disabled
 * - Soporte para iconos
 */

const buttonVariants = cva(
  // Base styles - consistentes en todas las variantes
  cn(
    'inline-flex items-center justify-center gap-2',
    'rounded-xl font-semibold',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'whitespace-nowrap'
  ),
  {
    variants: {
      variant: {
        // Primary - neon cyan/brand color
        primary: cn(
          'bg-(--color-primary) text-(--color-primary-foreground,#000)',
          'hover:bg-(--color-primary-dark)',
          'focus-visible:ring-(--color-primary)',
          'shadow-sm hover:shadow-(--shadow-glow-cyan)'
        ),
        // Secondary - neon magenta
        secondary: cn(
          'bg-(--color-secondary) text-(--color-secondary-foreground,#fff)',
          'hover:bg-(--color-secondary-dark)',
          'focus-visible:ring-(--color-secondary)',
          'shadow-sm hover:shadow-(--shadow-glow-magenta)'
        ),
        // Accent - gold/yellow
        accent: cn(
          'bg-(--color-accent) text-(--color-accent-foreground,#000)',
          'hover:bg-(--color-accent-dark)',
          'focus-visible:ring-(--color-accent)',
          'shadow-sm hover:shadow-(--shadow-glow-accent)'
        ),
        // Success - green
        success: cn(
          'bg-(--color-success) text-white',
          'hover:bg-(--color-success-muted)',
          'focus-visible:ring-(--color-success)'
        ),
        // Destructive - red/error
        destructive: cn(
          'bg-(--color-error) text-white',
          'hover:bg-(--color-error-muted)',
          'focus-visible:ring-(--color-error)'
        ),
        // Outline - transparent con border
        outline: cn(
          'border-2 border-(--color-border)',
          'bg-transparent text-(--color-text)',
          'hover:bg-(--color-surface-hover)',
          'hover:border-(--color-primary)',
          'focus-visible:ring-(--color-primary)'
        ),
        // Ghost - hover sutil
        ghost: cn(
          'bg-transparent text-(--color-text)',
          'hover:bg-(--color-surface-hover)',
          'focus-visible:ring-(--color-border-focus)'
        ),
        // Surface - elevado como card
        surface: cn(
          'bg-(--color-surface) text-(--color-text)',
          'hover:bg-(--color-surface-hover)',
          'border border-(--color-border)',
          'focus-visible:ring-(--color-primary)'
        ),
        // Gradient - premium animated gradient
        gradient: cn(
          'text-white font-bold',
          'bg-gradient-to-r from-(--color-primary) via-(--color-secondary) to-(--color-primary)',
          'bg-[length:200%_100%]',
          'animate-[gradient-shift_3s_ease_infinite]',
          'hover:shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.4)]',
          'focus-visible:ring-(--color-primary)'
        ),
      },
      size: {
        xs: 'h-10 px-3 text-xs',
        sm: 'h-10 px-4 text-sm',
        default: 'h-11 px-6 text-base',
        lg: 'h-12 px-8 text-lg',
        xl: 'h-14 px-10 text-xl',
        icon: 'h-11 w-11',
      },
      // Scale animation en interaction
      scale: {
        none: '',
        subtle: 'hover:scale-[1.02] active:scale-[0.98]',  // Para la mayoría
        normal: 'hover:scale-105 active:scale-95',          // Para énfasis
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
      scale: 'subtle',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      scale,
      asChild = false,
      loading,
      icon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, scale, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>{children}</span>
          </>
        ) : (
          <>
            {icon && <span className="shrink-0">{icon}</span>}
            {children}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
