import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Logo } from './Logo';

const EASE = [0.76, 0, 0.24, 1] as const;
const DURATION = 1.05;
/** entra (0 → 33%), segura a tela (33% → 68%) e sai pela direita (68% → 100%) */
const SWEEP = { x: ['-120%', '0%', '0%', '120%'] };
const TIMES = [0, 0.33, 0.68, 1];

/**
 * "Apagaram as luzes": três faixas inclinadas (vinho, vermelho e azul-noite) cobrem a tela,
 * as cinco luzes de largada acendem e apagam, o nome da página entra "em velocidade"
 * e as faixas saem pela direita revelando a página nova.
 */
export function PageTransition({ routeKey, label }: { routeKey: string; label: string }) {
  const reduce = useReducedMotion();
  // sai da tela (e do DOM) quando a animação termina, para não deixar uma camada fixa por cima do site
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), (DURATION + 0.25) * 1000);
    return () => clearTimeout(t);
  }, []);
  if (reduce || done) return null;
  const band = (className: string, delay: number) => (
    <motion.div
      className={`absolute -inset-y-16 -left-[20%] w-[140%] -skew-x-[14deg] ${className}`}
      initial={{ x: '-120%' }}
      animate={SWEEP}
      transition={{ duration: DURATION, delay, times: TIMES, ease: EASE }}
    />
  );

  return (
    <div key={routeKey} className="pointer-events-none fixed inset-0 z-[90] overflow-hidden" aria-hidden>
      {band('bg-[#8B0000]', 0)}
      {band('bg-[#E10600]', 0.04)}
      <motion.div
        className="absolute -inset-y-16 -left-[20%] flex w-[140%] -skew-x-[14deg] items-center justify-center bg-carbon-950"
        initial={{ x: '-120%' }}
        animate={SWEEP}
        transition={{ duration: DURATION, delay: 0.08, times: TIMES, ease: EASE }}
      >
        <div className="flex skew-x-[14deg] flex-col items-center gap-6 px-6">
          {/* luzes de largada: acendem uma a uma e apagam juntas */}
          <div className="flex gap-2 sm:gap-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.span
                key={i}
                className="h-4 w-4 rounded-full sm:h-5 sm:w-5"
                initial={{ backgroundColor: 'rgba(255,255,255,0.08)', boxShadow: '0 0 0 rgba(225,6,0,0)' }}
                animate={{
                  backgroundColor: ['rgba(255,255,255,0.08)', '#E10600', '#E10600', 'rgba(255,255,255,0.08)'],
                  boxShadow: ['0 0 0 rgba(225,6,0,0)', '0 0 18px rgba(225,6,0,0.9)', '0 0 18px rgba(225,6,0,0.9)', '0 0 0 rgba(225,6,0,0)'],
                }}
                transition={{ duration: 0.45 - i * 0.04, delay: 0.3 + i * 0.04, times: [0, 0.05, 0.7, 1] }}
              />
            ))}
          </div>
          <div className="overflow-hidden pb-1">
            <motion.p
              className="whitespace-nowrap font-albert text-[clamp(44px,8vw,104px)] font-semibold leading-[0.9] tracking-[-0.05em] text-white"
              initial={{ opacity: 0, x: '-60%', skewX: -8, filter: 'blur(8px)' }}
              animate={{ opacity: [0, 1, 1, 0], x: ['-60%', '0%', '0%', '8%'], skewX: [-8, 0, 0, 0], filter: ['blur(8px)', 'blur(0px)', 'blur(0px)', 'blur(4px)'] }}
              transition={{ duration: 0.6, delay: 0.32, times: [0, 0.45, 0.8, 1], ease: [0.16, 1, 0.3, 1] }}
            >
              {label}
            </motion.p>
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0.7, 0.7, 0] }} transition={{ duration: 0.7, delay: 0.3, times: [0, 0.3, 0.8, 1] }}>
            <Logo />
          </motion.div>
        </div>
      </motion.div>
      {/* linha de corrida dourada no topo */}
      <motion.div
        className="absolute left-0 top-0 h-[3px] w-full origin-left bg-gold"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: [0, 1, 1], opacity: [1, 1, 0] }}
        transition={{ duration: 0.9, times: [0, 0.7, 1], ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
