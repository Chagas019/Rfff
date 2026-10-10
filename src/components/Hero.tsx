import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Flag as FlagIcon, Timer, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Race } from '../types';
import { CarIllustration } from './CarIllustration';

const CALLOUTS = [
  { label: 'Unidade de potência', value: 'V6 1.6 turbo híbrido', x: '18%', y: '30%' },
  { label: 'Aerodinâmica ativa', value: 'Modo reta / curva', x: '62%', y: '20%' },
  { label: 'Elétrico (MGU-K)', value: '~50% da potência', x: '70%', y: '78%' },
];

function useSpeedometer(active: boolean) {
  const [speed, setSpeed] = useState(0);
  useEffect(() => {
    if (!active) { setSpeed(338); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 2200);
      const base = 338 * (1 - Math.pow(1 - p, 3));
      setSpeed(Math.round(base + (p === 1 ? Math.sin(t / 250) * 3 : 0)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return speed;
}

export function Hero({ nextRace }: { nextRace: Race | null }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const carX = useTransform(scrollY, [0, 600], [0, reduce ? 0 : 220]);
  const titleY = useTransform(scrollY, [0, 600], [0, reduce ? 0 : -80]);
  const speed = useSpeedometer(!reduce);

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col justify-center overflow-hidden pb-16 pt-24" aria-labelledby="hero-title">
      {/* cenário */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_20%,#1c1c26_0%,#07070a_65%)]" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 [perspective:600px]" aria-hidden>
        <div className="grid-bg absolute inset-0 origin-bottom [transform:rotateX(60deg)] [mask-image:linear-gradient(to_top,black,transparent)]" />
      </div>
      <div className="absolute left-1/4 top-0 -z-10 h-[70vh] w-40 -rotate-12 bg-gradient-to-b from-white/10 to-transparent blur-2xl" aria-hidden />
      <div className="absolute right-1/4 top-0 -z-10 h-[70vh] w-56 rotate-12 bg-gradient-to-b from-race/20 to-transparent blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden" aria-hidden>
        <span className="select-none font-display text-[38vw] font-black italic leading-none text-white/[0.025]">F1</span>
      </div>
      {/* linhas de velocidade */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-px w-1/3 animate-speedline bg-gradient-to-r from-transparent via-race/70 to-transparent"
            style={{ top: `${18 + i * 7.5}%`, animationDelay: `${i * 0.27}s`, animationDuration: `${1.2 + (i % 4) * 0.35}s` }}
          />
        ))}
      </div>

      <div className="container-grid relative">
        <motion.div style={{ y: titleY }} className="relative z-10 max-w-4xl">
          <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="label mb-5 flex items-center gap-3 text-race-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-race" aria-hidden />
            Temporada 2026 · Nova era técnica · 22 Grandes Prêmios
          </motion.p>
          <h1 id="hero-title" className="font-display text-[13vw] font-black uppercase italic leading-[0.85] sm:text-7xl lg:text-8xl">
            {['The race', 'never', 'stops.'].map((w, i) => (
              <motion.span
                key={w}
                className={`block ${i === 2 ? 'text-race' : 'text-gradient'}`}
                initial={{ opacity: 0, x: -60, skewX: -12 }}
                animate={{ opacity: 1, x: 0, skewX: 0 }}
                transition={{ delay: 0.15 + i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                {w}
              </motion.span>
            ))}
          </h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-6 max-w-xl text-lg text-zinc-300 sm:text-xl">
            Tudo sobre velocidade, estratégia e a paixão pela Fórmula 1.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }} className="mt-8 flex flex-wrap gap-3">
            <Link to="/calendario" className="btn-primary"><FlagIcon className="h-4 w-4" aria-hidden />Explorar temporada</Link>
            <Link to={nextRace ? `/calendario/${nextRace.id}` : '/calendario'} className="btn-ghost"><Timer className="h-4 w-4" aria-hidden />Ver próxima corrida</Link>
            <Link to="/pilotos" className="btn-ghost"><Users className="h-4 w-4" aria-hidden />Conhecer os pilotos<ArrowRight className="h-4 w-4" aria-hidden /></Link>
          </motion.div>
        </motion.div>

        {/* carro + telemetria */}
        <div className="relative mt-10 lg:mt-2">
          <motion.div
            style={{ x: carX }}
            initial={reduce ? false : { x: '-110%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1.3, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative ml-auto w-full max-w-5xl drop-shadow-[0_30px_60px_rgba(225,6,0,0.35)]"
          >
            <CarIllustration speed color="#e10600" accent="#f5f5f5" number="26" title="Ilustração de um carro de Fórmula 1 em alta velocidade" className="w-full" />
          </motion.div>
          <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
            {CALLOUTS.map((c, i) => (
              <motion.div key={c.label} className="absolute" style={{ left: c.x, top: c.y }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.4 + i * 0.2 }}>
                <span className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full border border-race bg-race/40" />
                <div className="ml-4 border-l border-race/50 pl-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">{c.label}</p>
                  <p className="font-display text-xs font-bold text-white">{c.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="glass absolute -bottom-6 left-0 hidden rounded-2xl border border-white/10 p-4 sm:block">
            <p className="label text-[10px]">Velocidade · ilustrativo</p>
            <p className="font-display text-4xl font-black tabular-nums text-white" aria-hidden>{speed}<span className="ml-1 text-sm text-race">km/h</span></p>
            <div className="mt-2 flex gap-1" aria-hidden>
              {Array.from({ length: 16 }).map((_, i) => (
                <span key={i} className="h-3 w-1.5 rounded-sm" style={{ background: i / 16 < speed / 360 ? (i > 12 ? '#e10600' : i > 9 ? '#facc15' : '#22c55e') : 'rgba(255,255,255,0.08)' }} />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
