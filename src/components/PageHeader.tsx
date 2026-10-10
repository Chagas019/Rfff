import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/** Cabeçalho das páginas internas com linhas de telemetria. */
export function PageHeader({ kicker, title, children }: { kicker: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="relative overflow-hidden border-b border-white/5 pb-10 pt-28 sm:pt-32">
      <div className="grid-bg absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
      <svg className="absolute right-0 top-16 h-48 w-[60%] opacity-30" viewBox="0 0 600 200" preserveAspectRatio="none" aria-hidden>
        <path d="M0 150 L80 140 L120 90 L180 110 L240 40 L300 70 L360 30 L420 90 L480 60 L540 120 L600 80" fill="none" stroke="#e10600" strokeWidth="2" />
        <path d="M0 170 L90 160 L150 130 L210 150 L270 100 L330 120 L390 80 L450 130 L510 110 L600 140" fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.6" />
      </svg>
      <div className="container-grid relative">
        <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="label mb-4 flex items-center gap-2 text-race-400">
          <span className="h-px w-10 bg-race" aria-hidden /> {kicker}
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-4xl font-black uppercase leading-none sm:text-6xl">
          {title}
        </motion.h1>
        {children && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-4 max-w-2xl text-zinc-400">
            {children}
          </motion.div>
        )}
      </div>
    </header>
  );
}
