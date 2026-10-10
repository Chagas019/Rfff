import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { ArrowRight, BatteryCharging, Cpu, Fuel, Gauge, Users, Wind } from 'lucide-react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { studioImageFor } from '../data/carImages';
import { drivers } from '../data/drivers';
import type { Team } from '../types';

const STEPS = [
  { kicker: '01 · Ângulo frontal', title: 'Nova era. Novo carro.', text: 'Mais curto, mais estreito e mais leve: o regulamento de 2026 redesenhou o carro de Fórmula 1 do zero.' },
  { kicker: '02 · Vista lateral', title: 'Metade da força é elétrica.', text: 'O V6 1.6 turbo divide a potência quase meio a meio com o sistema elétrico, usando combustível 100% sustentável.' },
  { kicker: '03 · Ficha técnica', title: 'Cada detalhe conta.', text: 'Gire, compare e conheça as equipes que disputam a temporada.' },
];

const CHIPS = [
  { icon: Cpu, label: 'V6 1.6 turbo híbrido', x: '-8%', y: '12%', z: 140 },
  { icon: BatteryCharging, label: '~50% elétrico', x: '72%', y: '6%', z: 200 },
  { icon: Wind, label: 'Aerodinâmica ativa', x: '78%', y: '70%', z: 120 },
  { icon: Fuel, label: 'Combustível sustentável', x: '-4%', y: '78%', z: 180 },
];

function StepText({ progress, index }: { progress: MotionValue<number>; index: number }) {
  const start = index / STEPS.length;
  const end = (index + 1) / STEPS.length;
  const pad = 0.06;
  const first = index === 0;
  const last = index === STEPS.length - 1;
  const opacity = useTransform(progress, [start - pad, start + pad, end - pad, end + pad], [first ? 1 : 0, 1, 1, last ? 1 : 0]);
  const y = useTransform(progress, [start - pad, start + pad, end - pad, end + pad], [first ? 0 : 40, 0, 0, last ? 0 : -40]);
  const blur = useTransform(opacity, [0, 1], ['blur(10px)', 'blur(0px)']);
  const step = STEPS[index];
  return (
    <motion.div style={{ opacity, y, filter: blur }} className="absolute inset-x-0 top-0">
      <p className="label text-race-400">{step.kicker}</p>
      <h3 className="mt-3 text-3xl font-black uppercase leading-none sm:text-5xl">{step.title}</h3>
      <p className="mt-4 max-w-md text-zinc-400">{step.text}</p>
    </motion.div>
  );
}

function Chip({ chip, progress, i }: { chip: (typeof CHIPS)[number]; progress: MotionValue<number>; i: number }) {
  const opacity = useTransform(progress, [0.02 + i * 0.04, 0.12 + i * 0.04, 0.5, 0.58], [0, 1, 1, 0]);
  const drift = useTransform(progress, [0, 0.6], [0, (i % 2 ? -1 : 1) * 40]);
  return (
    <motion.div
      className="glass absolute flex items-center gap-2 whitespace-nowrap rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-white shadow-2xl"
      style={{ left: chip.x, top: chip.y, opacity, y: drift, translateZ: chip.z }}
    >
      <chip.icon className="h-4 w-4 text-race" aria-hidden /> {chip.label}
    </motion.div>
  );
}

/**
 * Vitrine com rolagem: o carro muda de ângulo em 3D conforme a página rola,
 * selos flutuam em profundidade e, no fim, o card vira para mostrar a ficha técnica.
 */
export function ScrollShowcase({ team }: { team: Team }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const studio = studioImageFor(team.id);
  const lineup = drivers.filter((d) => d.teamId === team.id);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.4 });

  // Trajetória 3D do card: frente → lateral → vira para a ficha técnica.
  const rotateY = useTransform(p, [0, 0.3, 0.5, 0.72, 1], [-32, 0, 26, 180, 180]);
  const rotateX = useTransform(p, [0, 0.3, 0.5, 0.72, 1], [14, 4, -6, 0, 0]);
  const rotateZ = useTransform(p, [0, 0.3, 0.5, 0.72], [-4, 0, 3, 0]);
  const scale = useTransform(p, [0, 0.3, 0.5, 0.72, 1], [0.82, 1, 1.06, 0.96, 0.96]);
  const x = useTransform(p, [0, 0.3, 0.5, 0.72], ['6%', '0%', '-4%', '0%']);
  const glow = useTransform(p, [0, 0.5, 1], [`${team.color}22`, `${team.color}55`, '#e1060033']);
  const bg = useTransform(glow, (c) => `radial-gradient(60% 55% at 65% 50%, ${c}, transparent 70%)`);
  const shadowScale = useTransform(p, [0, 0.3, 0.5, 0.72], [0.7, 1, 1.1, 0.8]);
  const barWidth = useTransform(p, [0, 1], ['0%', '100%']);

  if (!studio) return null;

  if (reduce) {
    return (
      <section className="container-grid grid items-center gap-8 py-20 lg:grid-cols-2">
        <div>
          <p className="label text-race-400">{STEPS[0].kicker}</p>
          <h3 className="mt-3 text-4xl font-black uppercase">{STEPS[0].title}</h3>
          <p className="mt-4 text-zinc-400">{STEPS[1].text}</p>
        </div>
        <img src={studio.src} alt={`${team.name} ${team.car}`} className="w-full rounded-3xl" style={{ background: '#f0ecea' }} />
      </section>
    );
  }

  return (
    <section ref={ref} className="relative h-[320vh]" aria-label={`Vitrine 3D do carro ${team.name} ${team.car}`}>
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <motion.div className="pointer-events-none absolute inset-0" style={{ background: bg }} aria-hidden />
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" aria-hidden />

        <div className="container-grid relative grid w-full items-center gap-6 pt-16 lg:grid-cols-[0.9fr_1.4fr]">
          {/* textos que trocam com a rolagem */}
          <div className="relative order-2 h-48 sm:h-56 lg:order-1 lg:h-72">
            {STEPS.map((_, i) => <StepText key={i} progress={p} index={i} />)}
          </div>

          {/* palco 3D */}
          <div className="relative order-1 lg:order-2" style={{ perspective: 1400 }}>
            <motion.div aria-hidden className="absolute bottom-[-6%] left-1/2 h-10 w-[70%] -translate-x-1/2 rounded-[50%] bg-black/70 blur-2xl" style={{ scaleX: shadowScale }} />
            <motion.div className="relative mx-auto aspect-square w-[82%] sm:aspect-[4/3] sm:w-[80%] [transform-style:preserve-3d]" style={{ rotateY, rotateX, rotateZ, scale, x }}>
              {/* frente: carro de estúdio */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl shadow-[0_50px_120px_-30px_rgba(0,0,0,0.9)] [backface-visibility:hidden]" style={{ background: 'linear-gradient(180deg,#f4f0ef,#e2dedd)' }}>
                <img src={studio.src} alt={`${team.name} ${team.car} — ${studio.caption}`} className="h-full w-full object-contain" draggable={false} />
                <span className="chip absolute left-4 top-4 border-black/10 bg-white/70 text-zinc-700">{team.car}</span>
                <div className="absolute inset-x-0 bottom-0 h-1.5" style={{ background: `linear-gradient(90deg, ${team.color}, ${team.accent})` }} />
              </div>

              {/* verso: ficha técnica */}
              <div className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 p-6 [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-8" style={{ background: `linear-gradient(150deg, ${team.color}55, #0d0d12 55%)` }}>
                <div>
                  <p className="label" style={{ color: team.color }}>Ficha técnica 2026</p>
                  <p className="mt-2 font-display text-4xl font-black text-white sm:text-6xl">{team.car}</p>
                  <p className="text-sm text-zinc-300">{team.fullName}</p>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  {[[Gauge, 'Motor', team.powerUnit], [Cpu, 'Sede', team.base.split(',')[0]], [Users, 'Chefe de equipe', team.teamPrincipal], [Fuel, 'Estreia da marca', team.firstEntry]].map(([Icon, k, v]) => {
                    const I = Icon as typeof Gauge;
                    return (
                      <div key={k as string} className="rounded-xl bg-white/[0.06] p-3">
                        <dt className="label flex items-center gap-1 text-[10px]"><I className="h-3 w-3" aria-hidden />{k as string}</dt>
                        <dd className="font-semibold text-white">{v as string}</dd>
                      </div>
                    );
                  })}
                </dl>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-zinc-300">{lineup.map((d) => `#${d.number} ${d.lastName}`).join(' · ')}</p>
                  <Link to={`/equipes/${team.id}`} className="btn-primary !py-2">Ver equipe <ArrowRight className="h-4 w-4" aria-hidden /></Link>
                </div>
              </div>

              {/* selos flutuando em profundidade */}
              <div className="pointer-events-none absolute inset-0 hidden sm:block [transform-style:preserve-3d]">
                {CHIPS.map((c, i) => <Chip key={c.label} chip={c} progress={p} i={i} />)}
              </div>
            </motion.div>
          </div>
        </div>

        {/* progresso */}
        <div className="absolute bottom-6 left-1/2 h-1 w-40 -translate-x-1/2 overflow-hidden rounded-full bg-white/10" aria-hidden>
          <motion.div className="h-full bg-race" style={{ width: barWidth }} />
        </div>
        <p className="label absolute bottom-10 left-1/2 -translate-x-1/2 text-[10px]">Role para girar</p>
      </div>
    </section>
  );
}
