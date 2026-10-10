import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { Camera, Move3d } from 'lucide-react';
import { useState } from 'react';
import { studioImageFor } from '../data/carImages';
import { teamPhotoQuery } from '../services/carPhotos';
import type { Team } from '../types';
import { CarPhoto } from './CarPhoto';

interface Props {
  team: Team;
  className?: string;
  /** Intensidade da inclinação 3D (graus). */
  tilt?: number;
  showCredit?: boolean;
  priority?: boolean;
}

/**
 * Carro em "estúdio": painel claro com spot de luz, chão refletivo e
 * inclinação 3D que segue o ponteiro. Sem render de estúdio, usa a foto real
 * do Wikimedia Commons.
 */
export function StudioCar({ team, className = '', tilt = 10, showCredit = true, priority = false }: Props) {
  const studio = studioImageFor(team.id);
  const reduce = useReducedMotion();
  const [loaded, setLoaded] = useState(false);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 140, damping: 16 };
  const ry = useSpring(useTransform(px, [0, 1], [-tilt, tilt]), spring);
  const rx = useSpring(useTransform(py, [0, 1], [tilt * 0.5, -tilt * 0.5]), spring);
  const carX = useSpring(useTransform(px, [0, 1], [-18, 18]), spring);
  const shadowX = useSpring(useTransform(px, [0, 1], [14, -14]), spring);
  const lightX = useTransform(px, [0, 1], ['30%', '70%']);

  if (!studio) {
    return (
      <div className={`relative overflow-hidden rounded-3xl border border-white/10 ${className}`}>
        <CarPhoto photoKey={team.id} query={teamPhotoQuery(team.id)} alt={`Foto do carro ${team.name} ${team.car}`} searchTerm={`${team.name} ${team.car}`} color={team.color} className="h-full w-full" imgClassName="transition duration-700 hover:scale-105" />
      </div>
    );
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl ${className}`}
      style={{ background: 'linear-gradient(180deg, #f4f0ef 0%, #ece8e7 55%, #e2dedd 100%)', perspective: 1200 }}
      onPointerMove={(e) => {
        if (reduce) return;
        const r = e.currentTarget.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => { px.set(0.5); py.set(0.5); }}
    >
      {/* luz de estúdio que acompanha o ponteiro */}
      <motion.div aria-hidden className="pointer-events-none absolute -top-1/3 h-[90%] w-[70%] -translate-x-1/2 rounded-full bg-white opacity-40 blur-3xl" style={{ left: lightX }} />
      {/* faixa de cor da equipe */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1.5" style={{ background: `linear-gradient(90deg, ${team.color}, ${team.accent})` }} />
      <div aria-hidden className="absolute bottom-6 left-6 font-display text-[18vw] font-black italic leading-none text-black/[0.04] sm:text-[9rem]">{team.car}</div>

      {/* sombra no chão */}
      <motion.div aria-hidden className="pointer-events-none absolute bottom-[12%] left-1/2 h-[10%] w-[70%] -translate-x-1/2 rounded-[50%] bg-black/25 blur-2xl" style={{ x: shadowX }} />

      <div className="absolute inset-0 flex items-center justify-center p-[6%] transition-transform duration-700 ease-out group-hover:scale-[1.04]">
      <motion.img
        src={studio.src}
        alt={`${team.name} ${team.car} — ${studio.caption}`}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        draggable={false}
        initial={{ opacity: 0, x: 80, filter: 'blur(12px)' }}
        animate={loaded ? { opacity: 1, x: 0, filter: 'blur(0px)' } : {}}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{ rotateX: rx, rotateY: ry, translateX: carX }}
        className="max-h-full max-w-full select-none object-contain drop-shadow-[0_25px_25px_rgba(0,0,0,0.25)]"
      />
      </div>

      <span className="chip absolute left-4 top-4 border-black/10 bg-white/70 text-zinc-700 backdrop-blur">{team.car}</span>
      {!reduce && (
        <span className="absolute right-4 top-4 hidden items-center gap-1 rounded-full bg-black/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 transition group-hover:opacity-0 sm:flex">
          <Move3d className="h-3 w-3" aria-hidden /> Mova o mouse
        </span>
      )}
      {showCredit && (
        <p className="absolute bottom-3 right-4 flex items-center gap-1 text-[10px] text-zinc-500">
          <Camera className="h-3 w-3" aria-hidden />
          {studio.kind === 'render' ? 'Render' : 'Foto'} · {studio.sourceUrl ? <a href={studio.sourceUrl} target="_blank" rel="noreferrer" className="underline">{studio.credit}</a> : studio.credit}
        </p>
      )}
    </div>
  );
}
