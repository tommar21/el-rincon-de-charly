'use client';

import { memo } from 'react';
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

// Stylized dice icon with "C" integrated - modernized version
const LogoIcon = memo(function LogoIcon({ size = 32, className }: { size?: number; className?: string }) {
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
        {/* Main gradient with enhanced colors */}
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="50%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-secondary)" />
        </linearGradient>
        {/* Inner glow effect */}
        <linearGradient id="logo-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.25" />
          <stop offset="50%" stopColor="white" stopOpacity="0.1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        {/* Shadow for depth */}
        <filter id="logo-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="black" floodOpacity="0.3" />
        </filter>
        {/* Dot glow */}
        <filter id="dot-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background rounded square (dice shape) with shadow */}
      <rect
        x="4"
        y="4"
        width="40"
        height="40"
        rx="10"
        fill="url(#logo-gradient)"
        filter="url(#logo-shadow)"
      />

      {/* Inner glow overlay */}
      <rect
        x="4"
        y="4"
        width="40"
        height="40"
        rx="10"
        fill="url(#logo-glow)"
      />

      {/* Subtle border for definition */}
      <rect
        x="4.5"
        y="4.5"
        width="39"
        height="39"
        rx="9.5"
        fill="none"
        stroke="white"
        strokeOpacity="0.1"
        strokeWidth="1"
      />

      {/* Dice dots - stylized as "C" shape with glow */}
      <g filter="url(#dot-glow)">
        {/* Top left dot */}
        <circle cx="15" cy="15" r="3.5" fill="white" />
        {/* Middle left dot */}
        <circle cx="15" cy="24" r="3.5" fill="white" />
        {/* Bottom left dot */}
        <circle cx="15" cy="33" r="3.5" fill="white" />
        {/* Top right dot */}
        <circle cx="33" cy="15" r="3.5" fill="white" />
        {/* Bottom right dot */}
        <circle cx="33" cy="33" r="3.5" fill="white" />
        {/* Center accent dot - slightly larger */}
        <circle cx="24" cy="24" r="4.5" fill="white" />
      </g>
    </svg>
  );
});

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
