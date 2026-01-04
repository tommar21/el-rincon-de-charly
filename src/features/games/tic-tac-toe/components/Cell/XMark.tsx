import { motion } from 'framer-motion';

interface XMarkProps {
  color?: string;
  className?: string;
}

export function XMark({
  color = 'var(--color-primary)',
  className = '',
}: XMarkProps) {
  return (
    <svg
      viewBox="0 0 60 60"
      className={className}
      style={{ filter: `drop-shadow(0 0 8px ${color})` }}
    >
      {/* First line: top-left to bottom-right */}
      <motion.line
        x1={10}
        y1={10}
        x2={50}
        y2={50}
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
      {/* Second line: top-right to bottom-left */}
      <motion.line
        x1={50}
        y1={10}
        x2={10}
        y2={50}
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
      />
    </svg>
  );
}

export default XMark;
