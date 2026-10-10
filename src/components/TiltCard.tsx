import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import type { ReactNode } from 'react';

interface Props { children: ReactNode; className?: string; max?: number; glare?: boolean }

/** Card com inclinação 3D que segue o ponteiro e um reflexo de luz. */
export function TiltCard({ children, className = '', max = 8, glare = true }: Props) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 220, damping: 18 });
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 220, damping: 18 });
  const gx = useTransform(px, [0, 1], ['0%', '100%']);
  const gy = useTransform(py, [0, 1], ['0%', '100%']);
  const glareBg = useMotionTemplate`radial-gradient(500px circle at ${gx} ${gy}, rgba(255,255,255,0.12), transparent 45%)`;

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={`group/tilt relative [transform-style:preserve-3d] ${className}`}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1000 }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return;
        const r = e.currentTarget.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => { px.set(0.5); py.set(0.5); }}
    >
      {children}
      {glare && <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-20 rounded-2xl opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100" style={{ background: glareBg }} />}
    </motion.div>
  );
}
