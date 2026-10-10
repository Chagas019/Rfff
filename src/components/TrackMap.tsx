import { motion, useReducedMotion } from 'framer-motion';
import { useId, useMemo } from 'react';
import { trackPath } from '../utils/track';

interface Props { points: [number, number][]; name: string; color?: string; animated?: boolean; className?: string }

/** Traçado esquemático do circuito com carro luminoso percorrendo a pista. */
export function TrackMap({ points, name, color = '#e10600', animated = true, className = '' }: Props) {
  const reduce = useReducedMotion();
  const d = useMemo(() => trackPath(points), [points]);
  const id = useId().replace(/:/g, '');
  const move = animated && !reduce;
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={`Traçado esquemático: ${name}`}>
      <defs>
        <filter id={`g${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d={d} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" strokeLinejoin="round" />
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
        filter={`url(#g${id})`}
        initial={move ? { pathLength: 0 } : false}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.8, ease: 'easeInOut' }}
      />
      <circle cx={points[0][0]} cy={points[0][1]} r="2.2" fill="#fff" />
      {move && (
        <circle r="1.8" fill="#22d3ee" filter={`url(#g${id})`}>
          <animateMotion dur="6s" repeatCount="indefinite" path={d} />
        </circle>
      )}
    </svg>
  );
}
