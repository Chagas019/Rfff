import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/** Cabeçalho das páginas internas no estilo da landing: rótulo discreto e título gigante entrando "em velocidade". */
export function PageHeader({ kicker, title, children }: { kicker: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="relative overflow-hidden pb-10 pt-28 sm:pt-36">
      <div className="container-grid relative">
        <p className="label mb-4 flex items-center gap-2 animate-fade-slide-up anim-delay-100">
          <span className="h-px w-10 bg-gold animate-race-line-left anim-delay-200" aria-hidden /> {kicker}
        </p>
        <div className="overflow-hidden pb-2">
          <h1 className="text-[clamp(52px,9vw,120px)] font-semibold leading-[0.85] tracking-[-0.06em] animate-speed-reveal anim-delay-200">
            {title}
          </h1>
        </div>
        {children && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="mt-6 max-w-2xl text-[17px] text-white/60">
            {children}
          </motion.div>
        )}
      </div>
    </header>
  );
}
