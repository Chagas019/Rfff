import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { ArrowRight, BatteryCharging, Camera, Cpu, Fuel, Wind } from 'lucide-react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { helmetImages, studioImages } from '../data/carImages';

/**
 * Vitrine guiada pela rolagem (3 atos), no estilo "objeto que muda de ângulo":
 *  1. Audi em 3/4 gira no espaço, com selos flutuando em profundidade;
 *  2. Ferrari passa da vista rasante (deitada na pista) para a vista aérea;
 *  3. O capacete de Leclerc vem do fundo e gira.
 * Imagens: PNG com fundo transparente (src/data/carImages.ts).
 */

const ACTS = [
  { kicker: '01 · Ângulo 3/4', title: 'Nova era. Novo carro.', text: 'Mais curto, mais leve e com aerodinâmica ativa: o regulamento de 2026 redesenhou o carro de Fórmula 1.', range: [0, 0.33] },
  { kicker: '02 · Vista aérea', title: 'Do chão ao céu.', text: 'Do ângulo rasante à vista de cima: asa dianteira, assoalho e difusor desenhados para a nova era.', range: [0.33, 0.66] },
  { kicker: '03 · O piloto', title: 'Por trás da viseira.', text: 'Charles Leclerc, número 16 da Ferrari, chega a 2026 em sua oitava temporada pela Scuderia.', range: [0.66, 1] },
] as const;

const CHIPS = [
  { icon: Cpu, label: 'V6 1.6 turbo híbrido', left: '2%', top: '8%', z: 160 },
  { icon: BatteryCharging, label: '~50% elétrico', left: '70%', top: '2%', z: 220 },
  { icon: Wind, label: 'Aerodinâmica ativa', left: '74%', top: '78%', z: 120 },
  { icon: Fuel, label: 'Combustível sustentável', left: '0%', top: '80%', z: 190 },
];

function ActText({ p, i }: { p: MotionValue<number>; i: number }) {
  const [a, b] = ACTS[i].range;
  const pad = 0.04;
  const first = i === 0;
  const last = i === ACTS.length - 1;
  const opacity = useTransform(p, [a - pad, a + pad, b - pad, b + pad], [first ? 1 : 0, 1, 1, last ? 1 : 0]);
  const y = useTransform(p, [a - pad, a + pad, b - pad, b + pad], [first ? 0 : 50, 0, 0, last ? 0 : -50]);
  const filter = useTransform(opacity, [0, 1], ['blur(12px)', 'blur(0px)']);
  const pointerEvents = useTransform(opacity, (o) => (o > 0.5 ? 'auto' : 'none'));
  const act = ACTS[i];
  return (
    <motion.div style={{ opacity, y, filter, pointerEvents }} className="absolute inset-x-0 top-0">
      <p className="label text-race-400">{act.kicker}</p>
      <h3 className="mt-3 text-3xl font-black uppercase leading-none sm:text-5xl">{act.title}</h3>
      <p className="mt-4 max-w-md text-zinc-400">{act.text}</p>
      {i === 1 && <Link to="/equipes/ferrari" className="btn-ghost mt-5">Conhecer a Ferrari <ArrowRight className="h-4 w-4" aria-hidden /></Link>}
      {i === 2 && (
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/pilotos/leclerc" className="btn-primary">Perfil de Leclerc <ArrowRight className="h-4 w-4" aria-hidden /></Link>
          <Link to="/pilotos" className="btn-ghost">Todos os pilotos</Link>
        </div>
      )}
    </motion.div>
  );
}

function Chip({ chip, p, i }: { chip: (typeof CHIPS)[number]; p: MotionValue<number>; i: number }) {
  const opacity = useTransform(p, [0.02 + i * 0.03, 0.08 + i * 0.03, 0.26, 0.31], [0, 1, 1, 0]);
  const y = useTransform(p, [0, 0.31], [0, (i % 2 ? -1 : 1) * 50]);
  return (
    <motion.div
      className="glass absolute flex items-center gap-2 whitespace-nowrap rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-white shadow-2xl"
      style={{ left: chip.left, top: chip.top, opacity, y, translateZ: chip.z }}
    >
      <chip.icon className="h-4 w-4 text-race" aria-hidden /> {chip.label}
    </motion.div>
  );
}

function Credit({ p, range, text }: { p: MotionValue<number>; range: readonly [number, number]; text: string }) {
  const [a, b] = range;
  const opacity = useTransform(p, [a, a + 0.04, b - 0.04, b], [0, 1, 1, 0]);
  return (
    <motion.p style={{ opacity }} className="absolute bottom-24 right-4 flex items-center gap-1 text-[10px] text-zinc-500 sm:bottom-16 sm:right-8">
      <Camera className="h-3 w-3" aria-hidden /> {text}
    </motion.p>
  );
}

export function ScrollShowcase() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const audi = studioImages.audi;
  const ferrari = studioImages.ferrari;
  const helmet = helmetImages.leclerc;
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.4 });

  // Ato 1 — Audi gira em 3/4 e sai pela esquerda
  const aOpacity = useTransform(p, [0, 0.27, 0.33], [1, 1, 0]);
  const aRotY = useTransform(p, [0, 0.15, 0.27, 0.33], [-30, 0, 22, 55]);
  const aRotX = useTransform(p, [0, 0.27], [16, 4]);
  const aRotZ = useTransform(p, [0, 0.15, 0.27], [-5, 0, 3]);
  const aScale = useTransform(p, [0, 0.15, 0.27, 0.33], [0.78, 1, 1.08, 0.9]);
  const aX = useTransform(p, [0, 0.27, 0.33], ['8%', '-2%', '-45%']);
  const aBlur = useTransform(p, [0.27, 0.33], ['blur(0px)', 'blur(14px)']);

  // Ato 2 — Ferrari: deitada na pista (ângulo rasante) → vista aérea
  const fOpacity = useTransform(p, [0.28, 0.35, 0.6, 0.66], [0, 1, 1, 0]);
  const fRotX = useTransform(p, [0.3, 0.52], [68, 0]);
  const fRotZ = useTransform(p, [0.3, 0.52, 0.62], [-18, 0, 4]);
  const fScale = useTransform(p, [0.3, 0.52, 0.66], [0.7, 1, 0.6]);
  const fX = useTransform(p, [0.28, 0.36, 0.6, 0.66], ['60%', '0%', '0%', '-10%']);
  const fY = useTransform(p, [0.6, 0.66], ['0%', '-30%']);
  const fBlur = useTransform(p, [0.28, 0.35, 0.6, 0.66], ['blur(16px)', 'blur(0px)', 'blur(0px)', 'blur(14px)']);

  // Ato 3 — capacete vem da profundidade e gira
  const hOpacity = useTransform(p, [0.62, 0.7], [0, 1]);
  const hScale = useTransform(p, [0.62, 0.74, 1], [0.35, 1, 1.05]);
  const hRotY = useTransform(p, [0.62, 0.8, 1], [-40, 0, 22]);
  const hRotX = useTransform(p, [0.62, 0.8, 1], [20, 0, -6]);
  const hZ = useTransform(p, [0.62, 0.74], [-600, 0]);

  const glow = useTransform(p, [0, 0.33, 0.66, 1], ['#e1060018', '#e1060040', '#e1060030', '#e1060055']);
  const bg = useTransform(glow, (c) => `radial-gradient(55% 55% at 62% 50%, ${c}, transparent 70%)`);
  const shadowScale = useTransform(p, [0, 0.15, 0.3, 0.52, 0.66, 0.74], [0.7, 1, 0.9, 1.1, 0.6, 0.8]);
  const barWidth = useTransform(p, [0, 1], ['0%', '100%']);

  if (!audi || !ferrari || !helmet) return null;

  if (reduce) {
    return (
      <section className="container-grid grid gap-10 py-20 md:grid-cols-3" aria-label="Vitrine: carros e capacete">
        {[[audi.src, ACTS[0]], [ferrari.src, ACTS[1]], [helmet.src, ACTS[2]]].map(([src, act]) => {
          const a = act as (typeof ACTS)[number];
          return (
            <div key={a.title}>
              <img src={src as string} alt="" className="mx-auto max-h-64 object-contain" />
              <p className="label mt-4 text-race-400">{a.kicker}</p>
              <h3 className="mt-2 text-2xl font-black uppercase">{a.title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{a.text}</p>
            </div>
          );
        })}
      </section>
    );
  }

  return (
    <section ref={ref} className="relative h-[420vh]" aria-label="Vitrine 3D: Audi, Ferrari e o capacete de Leclerc">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <motion.div className="pointer-events-none absolute inset-0" style={{ background: bg }} aria-hidden />
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" aria-hidden />
        {/* linhas de velocidade do ato 2 */}
        <motion.div className="pointer-events-none absolute inset-0" style={{ opacity: fOpacity }} aria-hidden>
          {Array.from({ length: 7 }).map((_, i) => (
            <span key={i} className="absolute h-px w-1/2 animate-speedline bg-gradient-to-r from-transparent via-race/60 to-transparent" style={{ top: `${20 + i * 9}%`, animationDelay: `${i * 0.2}s` }} />
          ))}
        </motion.div>

        <div className="container-grid relative grid w-full items-center gap-4 pt-16 lg:grid-cols-[0.85fr_1.4fr]">
          <div className="relative order-2 h-56 sm:h-64 lg:order-1 lg:h-80">
            {ACTS.map((_, i) => <ActText key={i} p={p} i={i} />)}
          </div>

          {/* palco 3D */}
          <div className="relative order-1 aspect-[4/3] lg:order-2" style={{ perspective: 1300 }}>
            <motion.div aria-hidden className="absolute bottom-[8%] left-1/2 h-10 w-[65%] -translate-x-1/2 rounded-[50%] bg-black/80 blur-2xl" style={{ scaleX: shadowScale }} />

            {/* Ato 1 */}
            <motion.div className="absolute inset-0 flex items-center justify-center [transform-style:preserve-3d]" style={{ opacity: aOpacity, rotateY: aRotY, rotateX: aRotX, rotateZ: aRotZ, scale: aScale, x: aX, filter: aBlur }}>
              <img src={audi.src} alt="Carro da Audi visto em ângulo 3/4" className="w-[92%] select-none drop-shadow-[0_40px_50px_rgba(0,0,0,0.6)]" draggable={false} />
              <div className="pointer-events-none absolute inset-0 hidden sm:block [transform-style:preserve-3d]">
                {CHIPS.map((c, i) => <Chip key={c.label} chip={c} p={p} i={i} />)}
              </div>
            </motion.div>

            {/* Ato 2 */}
            <motion.div className="absolute inset-0 flex items-center justify-center" style={{ opacity: fOpacity, rotateX: fRotX, rotateZ: fRotZ, scale: fScale, x: fX, y: fY, filter: fBlur }}>
              <img src={ferrari.src} alt="Ferrari número 16 vista de cima" className="w-full select-none drop-shadow-[0_30px_40px_rgba(0,0,0,0.7)]" draggable={false} />
            </motion.div>

            {/* Ato 3 */}
            <motion.div className="absolute inset-0 flex items-center justify-center" style={{ opacity: hOpacity, scale: hScale, rotateY: hRotY, rotateX: hRotX, z: hZ }}>
              <div className="absolute h-[70%] w-[50%] rounded-full bg-race/30 blur-3xl" aria-hidden />
              <img src={helmet.src} alt={helmet.caption} className="relative h-[88%] select-none object-contain drop-shadow-[0_40px_50px_rgba(0,0,0,0.6)]" draggable={false} />
            </motion.div>
          </div>
        </div>

        <Credit p={p} range={[0, 0.33]} text={`Audi: ${audi.credit}`} />
        <Credit p={p} range={[0.33, 0.66]} text={`Ferrari: ${ferrari.credit}`} />
        <Credit p={p} range={[0.66, 1.01]} text={helmet.credit} />

        <div className="absolute bottom-6 left-1/2 h-1 w-40 -translate-x-1/2 overflow-hidden rounded-full bg-white/10" aria-hidden>
          <motion.div className="h-full bg-race" style={{ width: barWidth }} />
        </div>
        <p className="label absolute bottom-10 left-1/2 -translate-x-1/2 text-[10px]">Role para girar</p>
      </div>
    </section>
  );
}
