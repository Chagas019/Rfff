import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

/** Título de seção: rótulo com linha dourada e título que entra "em velocidade" ao aparecer na tela. */
export function SectionHeader({ kicker, title, children, action }: { kicker: string; title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <Reveal y={16}>
          <p className="label mb-3 flex items-center gap-2">
            <span className="h-px w-8 bg-gold" aria-hidden />
            {kicker}
          </p>
        </Reveal>
        <div className="overflow-hidden pb-1">
          <motion.h2
            className="text-[clamp(40px,6vw,72px)] font-semibold leading-[0.88] tracking-[-0.05em]"
            initial={reduce ? false : { opacity: 0, x: '-60%', skewX: -8, filter: 'blur(8px)' }}
            whileInView={{ opacity: 1, x: 0, skewX: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {title}
          </motion.h2>
        </div>
        {children && <Reveal delay={0.15} y={16}><p className="mt-4 text-[17px] text-white/60">{children}</p></Reveal>}
      </div>
      {action && <Reveal delay={0.2} y={16}>{action}</Reveal>}
    </div>
  );
}
