import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { drivers } from '../data/drivers';
import { teams } from '../data/teams';
import { studioImageFor } from '../data/carImages';
import { FavoriteButton } from './FavoriteButton';
import { StudioCar } from './StudioCar';

const AUTOPLAY_MS = 7000;

/** Showroom em carrossel: setas, teclado (← →), arrastar e troca automática. */
export function Garage({ initialTeam }: { initialTeam?: string }) {
  const reduce = useReducedMotion();
  // Carros com render de estúdio aparecem primeiro.
  const ordered = [...teams].sort((a, b) => Number(!!studioImageFor(b.id)) - Number(!!studioImageFor(a.id)));
  const startIndex = Math.max(0, ordered.findIndex((t) => t.id === initialTeam));
  const [[index, dir], setState] = useState<[number, number]>([startIndex, 0]);
  const [playing, setPlaying] = useState(!reduce);
  const [hovering, setHovering] = useState(false);
  const team = ordered[index];
  const lineup = drivers.filter((d) => d.teamId === team.id);

  const go = useCallback((delta: number) => setState(([i]) => [(i + delta + ordered.length) % ordered.length, delta]), [ordered.length]);
  const goTo = (i: number) => setState(([cur]) => [i, i > cur ? 1 : -1]);

  useEffect(() => {
    if (!playing || hovering) return;
    const id = setTimeout(() => go(1), AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [playing, hovering, index, go]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -80 || info.velocity.x < -400) go(1);
    else if (info.offset.x > 80 || info.velocity.x > 400) go(-1);
  };

  const variants = {
    enter: (d: number) => ({ x: d >= 0 ? '60%' : '-60%', opacity: 0, filter: 'blur(16px)', skewX: d >= 0 ? -8 : 8 }),
    center: { x: '0%', opacity: 1, filter: 'blur(0px)', skewX: 0 },
    exit: (d: number) => ({ x: d >= 0 ? '-60%' : '60%', opacity: 0, filter: 'blur(16px)', skewX: d >= 0 ? 8 : -8 }),
  };

  return (
    <section
      className="relative"
      aria-roledescription="carrossel"
      aria-label="Garagem 2026"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      }}
    >
      {/* brilho com a cor da equipe */}
      <motion.div aria-hidden className="pointer-events-none absolute -inset-10 -z-10 rounded-[3rem] blur-3xl" animate={{ background: `radial-gradient(60% 60% at 60% 50%, ${team.color}40, transparent 70%)` }} transition={{ duration: 0.8 }} />

      <div className="grid items-center gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="order-2 lg:order-1">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={team.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35 }}>
              <p className="label" style={{ color: team.color }}>{String(index + 1).padStart(2, '0')} / {String(ordered.length).padStart(2, '0')} · {team.powerUnit}</p>
              <h3 className="mt-2 text-4xl font-black uppercase leading-none sm:text-5xl">{team.name}</h3>
              <p className="mt-1 font-display text-xl font-bold text-zinc-500">{team.car}</p>
              <p className="mt-4 text-sm text-zinc-400">{team.history}</p>
              <ul className="mt-5 space-y-2">
                {lineup.map((d) => (
                  <li key={d.id}>
                    <Link to={`/pilotos/${d.id}`} className="group flex items-center gap-3 text-sm text-zinc-300 hover:text-white">
                      <span className="w-9 font-display font-black " style={{ color: team.color }}>#{d.number}</span>
                      {d.firstName} <strong className="uppercase">{d.lastName}</strong>
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link to={`/equipes/${team.id}`} className="btn-primary">Ver equipe</Link>
                <FavoriteButton kind="team" id={team.id} label={team.name} variant="full" />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="order-1 lg:order-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl sm:aspect-[16/10]" aria-live="polite">
            <AnimatePresence initial={false} custom={dir} mode="popLayout">
              <motion.div
                key={team.id}
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.25}
                onDragEnd={onDragEnd}
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
                aria-label={`${index + 1} de ${ordered.length}: ${team.name} ${team.car}`}
                role="group"
                aria-roledescription="slide"
              >
                <StudioCar team={team} className="h-full w-full" priority />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button type="button" className="btn-icon" onClick={() => go(-1)} aria-label="Carro anterior"><ChevronLeft className="h-5 w-5" aria-hidden /></button>
            <button type="button" className="btn-icon" onClick={() => go(1)} aria-label="Próximo carro"><ChevronRight className="h-5 w-5" aria-hidden /></button>
            <button type="button" className="btn-icon" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pausar troca automática' : 'Iniciar troca automática'} aria-pressed={playing}>
              {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
            </button>
            <div className="flex flex-1 flex-wrap justify-end gap-1.5" role="tablist" aria-label="Escolher equipe">
              {ordered.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={t.name}
                  title={t.name}
                  onClick={() => goTo(i)}
                  className="relative h-2.5 overflow-hidden rounded-full bg-white/10 transition-all"
                  style={{ width: i === index ? 40 : 14 }}
                >
                  {i === index && (
                    <motion.span
                      key={`${t.id}-${playing && !hovering}`}
                      className="absolute inset-y-0 left-0"
                      style={{ background: t.color }}
                      initial={{ width: playing && !hovering ? '0%' : '100%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: playing && !hovering ? AUTOPLAY_MS / 1000 : 0, ease: 'linear' }}
                    />
                  )}
                  {i !== index && <span className="absolute inset-0 opacity-60" style={{ background: t.color }} />}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-2 text-right text-[11px] text-zinc-500">Arraste o carro, use as setas ← → ou clique nas cores das equipes.</p>
        </div>
      </div>
    </section>
  );
}
