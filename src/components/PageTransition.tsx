import { motion, useReducedMotion } from 'framer-motion';
import { Logo } from './Logo';

/** "Cortina de velocidade": faixas inclinadas cruzam a tela a cada troca de página. */
export function PageTransition({ routeKey }: { routeKey: string }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  const sweep = { x: ['-130%', '0%', '0%', '130%'] };
  const ease = [0.76, 0, 0.24, 1] as const;
  return (
    <div key={routeKey} className="pointer-events-none fixed inset-0 z-[90] overflow-hidden" aria-hidden>
      <motion.div className="absolute -inset-y-10 -left-1/4 w-[150%] -skew-x-12 bg-race" initial={{ x: '-130%' }} animate={sweep} transition={{ duration: 0.85, times: [0, 0.4, 0.55, 1], ease }} />
      <motion.div className="absolute -inset-y-10 -left-1/4 flex w-[150%] -skew-x-12 items-center justify-center bg-carbon-950" initial={{ x: '-130%' }} animate={sweep} transition={{ duration: 0.85, delay: 0.06, times: [0, 0.4, 0.55, 1], ease }}>
        <motion.div className="skew-x-12 scale-150" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 0.85, times: [0, 0.4, 0.55, 0.7] }}>
          <Logo />
        </motion.div>
      </motion.div>
      <motion.div className="absolute inset-y-0 left-0 h-1 w-full bg-white/80" initial={{ scaleX: 0, transformOrigin: 'left' }} animate={{ scaleX: [0, 1, 1], opacity: [1, 1, 0] }} transition={{ duration: 0.8 }} />
    </div>
  );
}
