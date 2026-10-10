import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { ArrowRight, BatteryCharging, Box, Camera, Cpu, Fuel, Wind } from 'lucide-react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Car3DCanvas } from './Car3DCanvas';
import { HelmetHolo } from './HelmetHolo';
import { helmetImages } from '../data/carImages';

/**
 * Vitrine guiada pela rolagem:
 *  1–2. carro de F1 2026 em 3D real (WebGL): a câmera gira ao redor dele,
 *       sobe até a vista aérea e as asas móveis abrem;
 *  3.   o capacete de Leclerc surge como holograma e se materializa (HelmetHolo).
 */

const ACTS = [
  { kicker: '01 · Modelo 3D', title: 'Gire o carro.', text: 'Role a página e a câmera dá a volta no carro de 2026: mais curto, mais leve e com aerodinâmica ativa.', range: [0, 0.33] },
  { kicker: '02 · Vista aérea', title: 'Asas móveis abertas.', text: 'Do alto, veja as asas dianteira e traseira abrindo no "modo reta", que substituiu o DRS em 2026.', range: [0.33, 0.66] },
  { kicker: '03 · O piloto', title: 'Por trás da viseira.', text: 'O capacete de Charles Leclerc se materializa: casco de fibra de carbono, viseira com faixa de Zylon e homologação FIA 8860.', range: [0.66, 1] },
] as const;

const CHIPS = [
  { icon: Cpu, label: 'V6 1.6 turbo híbrido', left: '58%', top: '20%' },
  { icon: BatteryCharging, label: '~50% elétrico', left: '78%', top: '32%' },
  { icon: Wind, label: 'Aerodinâmica ativa', left: '74%', top: '70%' },
  { icon: Fuel, label: 'Combustível sustentável', left: '52%', top: '78%' },
];

function ActText({ p, i }: { p: MotionValue<number>; i: number }) {
  const [a, b] = ACTS[i].range;
  const pad = 0.04;
  const first = i === 0;
  const last = i === ACTS.length - 1;
  const opacity = useTransform(p, [a - pad, a + pad, b - pad, b + pad], [first ? 1 : 0, 1, 1, last ? 1 : 0]);
  const y = useTransform(p, [a - pad, a + pad, b - pad, b + pad], [first ? 0 : 50, 0, 0, last ? 0 : -50]);
  const pointerEvents = useTransform(opacity, (o) => (o > 0.5 ? 'auto' : 'none'));
  const act = ACTS[i];
  return (
    <motion.div style={{ opacity, y, pointerEvents }} className="absolute inset-x-0 bottom-0 lg:bottom-auto lg:top-0">
      <p className="label text-race-400">{act.kicker}</p>
      <h3 className="mt-3 text-3xl font-black uppercase leading-none sm:text-5xl">{act.title}</h3>
      <p className="mt-4 max-w-md text-zinc-300">{act.text}</p>
      {i === 2 && (
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/pilotos/leclerc" className="btn-primary">Perfil de Leclerc <ArrowRight className="h-4 w-4" aria-hidden /></Link>
          <Link to="/equipes" className="btn-ghost">Ver as equipes</Link>
        </div>
      )}
    </motion.div>
  );
}

function Chip({ chip, p, i }: { chip: (typeof CHIPS)[number]; p: MotionValue<number>; i: number }) {
  const opacity = useTransform(p, [0.03 + i * 0.03, 0.09 + i * 0.03, 0.26, 0.31], [0, 1, 1, 0]);
  const y = useTransform(p, [0, 0.31], [20, (i % 2 ? -1 : 1) * 30]);
  return (
    <motion.div
      className="solid-glass absolute hidden items-center gap-2 whitespace-nowrap rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-white shadow-2xl lg:flex"
      style={{ left: chip.left, top: chip.top, opacity, y }}
    >
      <chip.icon className="h-4 w-4 text-race" aria-hidden /> {chip.label}
    </motion.div>
  );
}

export function ScrollShowcase() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.4 });

  // 0–0.66 da rolagem controla a câmera 3D (0–1)
  const carProgress = useTransform(p, [0, 0.64], [0, 1], { clamp: true });
  const carOpacity = useTransform(p, [0.6, 0.68], [1, 0]);
  const carScale = useTransform(p, [0.6, 0.68], [1, 0.9]);
  const carVisibility = useTransform(carOpacity, (o) => (o < 0.01 ? 'hidden' : 'visible'));
  const helmetVisibility = useTransform(p, (v) => (v < 0.6 ? 'hidden' : 'visible'));

  const hOpacity = useTransform(p, [0.64, 0.72], [0, 1]);
  const hScale = useTransform(p, [0.62, 0.72], [0.85, 1]);
  const helmetProgress = useTransform(p, [0.66, 0.98], [0, 1], { clamp: true });
  const hCredit = useTransform(p, [0.66, 0.72], [0, 1]);
  const carCredit = useTransform(p, [0.6, 0.66], [1, 0]);
  const barWidth = useTransform(p, [0, 1], ['0%', '100%']);

  if (reduce) {
    return (
      <section className="container-grid grid items-center gap-10 py-20 lg:grid-cols-2" aria-label="Vitrine: carro 3D e capacete">
        <Car3DCanvas progress={carProgress} className="aspect-[4/3] w-full overflow-hidden rounded-3xl" />
        <div>
          <p className="label text-race-400">{ACTS[0].kicker}</p>
          <h3 className="mt-2 text-3xl font-black uppercase">Carro de F1 2026 em 3D</h3>
          <p className="mt-2 text-zinc-400">{ACTS[1].text}</p>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative h-[420vh]" aria-label="Vitrine 3D: carro de F1 2026 e o capacete de Leclerc">
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-carbon-950">
        {/* carro 3D em tela cheia */}
        <motion.div className="absolute inset-0" style={{ opacity: carOpacity, scale: carScale, visibility: carVisibility }}>
          <Car3DCanvas progress={carProgress} className="h-full w-full" shiftRight />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_55%,rgba(0,0,0,0.45)_100%)]" aria-hidden />
        </motion.div>

        {/* capacete (ato 3) — holograma que se materializa */}
        <motion.div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-24 lg:items-center lg:justify-end lg:pr-[14%] lg:pt-0" style={{ opacity: hOpacity, scale: hScale, visibility: helmetVisibility, isolation: 'isolate' }}>
          <div className="relative flex h-full w-full max-w-[640px] items-start justify-center pt-4 lg:items-center lg:pt-0">
            <HelmetHolo progress={helmetProgress} />
          </div>
        </motion.div>

        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-carbon-950 to-transparent" aria-hidden />
        {CHIPS.map((c, i) => <Chip key={c.label} chip={c} p={p} i={i} />)}

        {/* textos */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-carbon-950 via-carbon-950/70 to-transparent lg:hidden" aria-hidden />
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/2 bg-gradient-to-r from-carbon-950/90 to-transparent lg:block" aria-hidden />
        <div className="container-grid relative flex h-full items-end pb-24 lg:items-center lg:pb-0">
          <div className="relative h-56 w-full sm:h-64 lg:h-80 lg:w-[42%]">
            {ACTS.map((_, i) => <ActText key={i} p={p} i={i} />)}
          </div>
        </div>

        <motion.p style={{ opacity: carCredit }} className="absolute right-4 top-20 flex items-center gap-1 text-[10px] text-zinc-500 sm:right-8">
          <Box className="h-3 w-3" aria-hidden /> Modelo 3D: <a href="https://github.com/MatthewDelong/formula1" target="_blank" rel="noreferrer" className="pointer-events-auto underline">F1 Rules Explorer</a> (ISC)
        </motion.p>
        <motion.p style={{ opacity: hCredit }} className="absolute right-4 top-20 flex items-center gap-1 text-[10px] text-zinc-500 sm:right-8">
          <Camera className="h-3 w-3" aria-hidden /> Capacete: {helmetImages.leclerc?.credit}
        </motion.p>

        <div className="absolute bottom-6 left-1/2 h-1 w-40 -translate-x-1/2 overflow-hidden rounded-full bg-white/10" aria-hidden>
          <motion.div className="h-full bg-race" style={{ width: barWidth }} />
        </div>
        <p className="label absolute bottom-10 left-1/2 -translate-x-1/2 text-[10px]">Role para girar</p>
      </div>
    </section>
  );
}
