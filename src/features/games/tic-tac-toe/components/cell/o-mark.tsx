'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';

interface OMarkProps {
  color?: string;
  className?: string;
}

export const OMark = memo(function OMark({
  color = 'var(--color-secondary)',
  className = '',
}: OMarkProps) {
  return (
    <svg
      viewBox="0 0 60 60"
      className={className}
      style={{ filter: `drop-shadow(0 0 8px ${color})` }}
    >
      <motion.circle
        cx={30}
        cy={30}
        r={20}
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </svg>
  );
});

export default OMark;
