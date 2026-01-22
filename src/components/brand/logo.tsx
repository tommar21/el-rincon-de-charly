'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'full' | 'icon-only' | 'wordmark';
  size?: 'sm' | 'md' | 'lg';
  collapsed?: boolean;
  animated?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 24, text: 'text-sm' },
  md: { icon: 32, text: 'text-base' },
  lg: { icon: 40, text: 'text-lg' },
};

// Stylized dice icon with "C" integrated
function LogoIcon({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="El Rincón de Charly logo"
    >
      <title>El Rincón de Charly</title>
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-secondary)" />
        </linearGradient>
        <linearGradient id="logo-gradient-light" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Background rounded square (dice shape) */}
      <rect
        x="4"
        y="4"
        width="40"
        height="40"
        rx="10"
        fill="url(#logo-gradient)"
      />

      {/* Inner highlight */}
      <rect
        x="6"
        y="6"
        width="36"
        height="36"
        rx="8"
        fill="url(#logo-gradient-light)"
      />

      {/* Dice dots - stylized as "C" shape */}
      {/* Top left dot */}
      <circle cx="15" cy="15" r="3.5" fill="white" opacity="0.95" />

      {/* Middle left dot */}
      <circle cx="15" cy="24" r="3.5" fill="white" opacity="0.95" />

      {/* Bottom left dot */}
      <circle cx="15" cy="33" r="3.5" fill="white" opacity="0.95" />

      {/* Top right dot */}
      <circle cx="33" cy="15" r="3.5" fill="white" opacity="0.95" />

      {/* Bottom right dot */}
      <circle cx="33" cy="33" r="3.5" fill="white" opacity="0.95" />

      {/* Center accent dot */}
      <circle cx="24" cy="24" r="4" fill="white" opacity="0.9" />
    </svg>
  );
}

export function Logo({
  variant = 'full',
  size = 'md',
  collapsed = false,
  animated = true,
  className,
}: LogoProps) {
  const sizeConfig = sizes[size];
  const showIcon = variant === 'full' || variant === 'icon-only' || collapsed;
  const showText = (variant === 'full' || variant === 'wordmark') && !collapsed;

  const iconVariants = {
    rest: { rotate: 0 },
    hover: { rotate: 5, transition: { duration: 0.3 } },
  };

  const IconWrapper = animated ? motion.div : 'div';
  const iconProps = animated
    ? {
        variants: iconVariants,
        initial: 'rest',
        whileHover: 'hover',
      }
    : {};

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {showIcon && (
        <IconWrapper {...iconProps} className="shrink-0">
          <LogoIcon size={sizeConfig.icon} />
        </IconWrapper>
      )}

      {showText && (
        <span
          className={cn(
            'font-heading font-bold text-(--color-text) leading-tight whitespace-nowrap',
            sizeConfig.text
          )}
        >
          El Rincón de Charly
        </span>
      )}
    </div>
  );
}

export { LogoIcon };
export default Logo;
