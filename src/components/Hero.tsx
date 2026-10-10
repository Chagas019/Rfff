import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Flag as FlagIcon, Timer, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studioImages } from '../data/carImages';
import { teams } from '../data/teams';
import type { Race } from '../types';
import { formatWeekend } from '../utils/format';
import { StudioCar } from './StudioCar';

function useSpeedometer(active: boolean) {
  const [speed, setSpeed] = useState(0);
  useEffect(() => {
    if (!active) { setSpeed(338); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 2200);
      setSpeed(Math.round(338 * (1 - Math.pow(1 - p, 3)) + (p === 1 ? Math.sin(t / 250) * 3 : 0)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return speed;
}

const TITLE = ['The race', 'never', 'stops.'];

export function Hero({ nextRace }: { nextRace: Race | null }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const panelY = useTransform(scrollY, [0, 700], [0, reduce ? 0 : 160]);
  // ao rolar, o painel gira em 3D e "desce" para a próxima seção
  const panelRotY = useTransform(scrollY, [0, 700], [0, reduce ? 0 : -24]);
  const panelRotX = useTransform(scrollY, [0, 700], [0, reduce ? 0 : 12]);
  const panelScale = useTransform(scrollY, [0, 700], [1, reduce ? 1 : 0.86]);
  const titleY = useTransform(scrollY, [0, 700], [0, reduce ? 0 : -60]);
  const speed = useSpeedometer(!reduce);
  const featured = teams.find((t) => t.id === 'audi' && studioImages[t.id]) ?? teams.find((t) => studioImages[t.id]) ?? teams[0];

  // holofote vermelho que segue o cursor no fundo
  const mx = useMotionValue(50);
  const my = useMotionValue(30);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });
  const spot = useTransform([sx, sy], ([x, y]) => `radial-gradient(600px circle at ${x}% ${y}%, rgba(225,6,0,0.16), transparent 60%)`);

  return (
    <section
      className="relative isolate overflow-hidden pb-16 pt-24 lg:min-h-[100svh]"
      aria-labelledby="hero-title"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width) * 100);
        my.set(((e.clientY - r.top) / r.height) * 100);
      }}
    >
      {/* cenário */}
      <div className="absolute inset-0 -z-20 bg-carbon-950" aria-hidden />
      <motion.div className="absolute inset-0 -z-10" style={{ background: reduce ? undefined : spot }} aria-hidden />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 [perspective:600px]" aria-hidden>
        <div className="grid-bg absolute inset-0 origin-bottom [transform:rotateX(60deg)] [mask-image:linear-gradient(to_top,black,transparent)]" />
      </div>
      <svg className="absolute left-0 top-24 -z-10 h-[70%] w-1/3 opacity-20" viewBox="0 0 200 400" fill="none" aria-hidden>
        {[0, 14, 28, 42].map((o) => <path key={o} d={`M${-20 + o} 400 V${120 + o} Q${-20 + o} ${40 + o} ${60 + o} ${40 + o} H220`} stroke="#fff" strokeWidth="1.5" />)}
      </svg>
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="absolute h-px w-1/3 animate-speedline bg-gradient-to-r from-transparent via-race/70 to-transparent" style={{ top: `${15 + i * 10}%`, animationDelay: `${i * 0.3}s`, animationDuration: `${1.2 + (i % 4) * 0.35}s` }} />
        ))}
      </div>

      <div className="container-grid relative grid items-center gap-12 lg:min-h-[calc(100svh-10rem)] lg:grid-cols-[1fr_1.15fr]">
        <motion.div style={{ y: titleY }} className="relative z-10">
          <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="label mb-5 flex items-center gap-3 text-race-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-race" aria-hidden />
            Temporada 2026 · Nova era técnica
          </motion.p>
          <h1 id="hero-title" className="font-display text-[14vw] font-black uppercase leading-[0.85] sm:text-7xl xl:text-8xl">
            {TITLE.map((w, i) => (
              <span key={w} className="block overflow-hidden pb-1 pr-4">
                <motion.span
                  className={`block ${i === 2 ? 'text-race' : 'text-gradient'}`}
                  initial={{ y: '110%', skewY: 8 }}
                  animate={{ y: '0%', skewY: 0 }}
                  transition={{ delay: 0.15 + i * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  {w}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-6 max-w-md text-lg text-zinc-300 sm:text-xl">
            Tudo sobre velocidade, estratégia e a paixão pela Fórmula 1.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }} className="mt-8 flex flex-wrap gap-3">
            <Link to="/calendario" className="btn-primary"><FlagIcon className="h-4 w-4" aria-hidden />Explorar temporada</Link>
            <Link to={nextRace ? `/calendario/${nextRace.id}` : '/calendario'} className="btn-ghost"><Timer className="h-4 w-4" aria-hidden />Ver próxima corrida</Link>
            <Link to="/pilotos" className="btn-ghost"><Users className="h-4 w-4" aria-hidden />Conhecer os pilotos<ArrowRight className="h-4 w-4" aria-hidden /></Link>
          </motion.div>
        </motion.div>

        {/* painel de estúdio com o carro */}
        <motion.div style={{ y: panelY, rotateY: panelRotY, rotateX: panelRotX, scale: panelScale, transformPerspective: 1400 }} className="relative">
          <motion.div
            initial={reduce ? false : { clipPath: 'inset(0 0 0 100% round 24px)' }}
            animate={{ clipPath: 'inset(0 0 0 0% round 24px)' }}
            transition={{ duration: 1.1, delay: 0.25, ease: [0.76, 0, 0.24, 1] }}
          >
            <StudioCar team={featured} className="aspect-square w-full shadow-[0_40px_120px_-30px_rgba(225,6,0,0.45)] sm:aspect-[5/4]" tilt={12} priority />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }} className="glass absolute -bottom-6 -left-2 rounded-2xl border border-white/10 p-4 sm:-left-8">
            <p className="label text-[10px]">Velocidade máxima típica</p>
            <p className="font-display text-3xl font-black tabular-nums text-white sm:text-4xl" aria-hidden>{speed}<span className="ml-1 text-sm text-race">km/h</span></p>
            <div className="mt-2 flex gap-1" aria-hidden>
              {Array.from({ length: 16 }).map((_, i) => (
                <span key={i} className="h-3 w-1.5 rounded-sm" style={{ background: i / 16 < speed / 360 ? (i > 12 ? '#e10600' : i > 9 ? '#facc15' : '#22c55e') : 'rgba(255,255,255,0.08)' }} />
              ))}
            </div>
          </motion.div>
          {nextRace && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.35 }} className="absolute -top-5 right-3 sm:-right-4">
              <Link to={`/calendario/${nextRace.id}`} className="glass flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 transition hover:border-race/60">
                <span className="flex h-2.5 w-2.5 rounded-full bg-race shadow-[0_0_12px_#e10600]" aria-hidden />
                <span>
                  <span className="label block text-[10px]">Próximo GP</span>
                  <span className="font-display text-sm font-bold text-white">{nextRace.name} · {formatWeekend(nextRace.weekendStart, nextRace.weekendEnd)}</span>
                </span>
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
