import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Flag as FlagIcon, Timer, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CarPhoto as Photo } from '../services/carPhotos';
import { Link } from 'react-router-dom';
import type { Race } from '../types';
import { HERO_QUERY } from '../services/carPhotos';
import { CarPhoto, PhotoCredit } from './CarPhoto';

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
  const photoScale = useTransform(scrollY, [0, 700], [1, reduce ? 1 : 1.12]);
  const titleY = useTransform(scrollY, [0, 600], [0, reduce ? 0 : -80]);
  const speed = useSpeedometer(!reduce);
  const [photo, setPhoto] = useState<Photo | null>(null);

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col justify-center overflow-hidden pb-16 pt-24" aria-labelledby="hero-title">
      {/* foto real em tela cheia */}
      <motion.div style={{ scale: photoScale }} className="absolute inset-0 -z-20" aria-hidden={false}>
        <CarPhoto
          photoKey="hero"
          query={HERO_QUERY}
          alt="Carro de Fórmula 1 da temporada 2026 em pista"
          searchTerm="Formula 1 2026"
          className="h-full w-full !bg-transparent"
          imgClassName="object-[70%_50%]"
          credit="none"
          onLoaded={setPhoto}
        />
      </motion.div>
      {/* cenário */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-carbon-950 via-carbon-950/75 to-carbon-950/10" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-carbon-950 via-transparent to-carbon-950/60" aria-hidden />
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

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="glass mt-12 inline-block rounded-2xl border border-white/10 p-4">
          <p className="label text-[10px]">Velocidade máxima típica · km/h</p>
          <p className="font-display text-4xl font-black tabular-nums text-white" aria-hidden>{speed}<span className="ml-1 text-sm text-race">km/h</span></p>
          <div className="mt-2 flex gap-1" aria-hidden>
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className="h-3 w-1.5 rounded-sm" style={{ background: i / 16 < speed / 360 ? (i > 12 ? '#e10600' : i > 9 ? '#facc15' : '#22c55e') : 'rgba(255,255,255,0.08)' }} />
            ))}
          </div>
        </motion.div>
      </div>
      {photo && (
        <div className="absolute bottom-3 right-4 max-w-[80vw] rounded-md bg-black/50 px-2 py-1 backdrop-blur">
          <PhotoCredit photo={photo} />
        </div>
      )}
    </section>
  );
}
