import { AnimatePresence, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, ChevronDown, ChevronUp, Pause, Play, Trophy } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEASON, races } from '../../data/calendar2026';
import { helmetImages } from '../../data/carImages';
import { PHOTO_CREDIT, driverNumberLogoUrl, driverPortraitUrl, teamCarUrl } from '../../data/driverPhotos';
import { drivers } from '../../data/drivers';
import { teamById } from '../../data/teams';
import { useAsync } from '../../hooks/useAsync';
import { useDriverStandings } from '../../hooks/useStandings';
import { useEventTheme } from '../../hooks/useEventTheme';
import { LIVE_REFRESH_MS, fetchRaceResults } from '../../services/f1Api';
import type { Driver, DriverStanding, RaceResultRow, Team } from '../../types';
import { lastCompleted, findDriver, standingFor } from '../../utils/season';
import { Flag } from '../Flag';

const AUTOPLAY_MS = 7000;
const EASE = [0.16, 1, 0.3, 1] as const;

/** Mistura uma cor hex com preto (amt < 0) ou branco (amt > 0). */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const ch = (s: number) => {
    const c = (n >> s) & 255;
    return Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt);
  };
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

/** Tamanho do nome gigante: ocupa a largura sem estourar, qualquer que seja o sobrenome. */
export const nameSize = (name: string) => `clamp(64px, ${Math.min(19, 132 / Math.max(name.length, 4))}vw, 300px)`;

interface Slide { driver: Driver; team: Team; standing?: DriverStanding; last?: RaceResultRow }

/** Partículas e linhas de velocidade: puro CSS, nenhum custo de JavaScript por quadro. */
function Atmosphere() {
  const dots = useMemo(() => Array.from({ length: 16 }, (_, i) => ({ left: (i * 37) % 100, top: (i * 53) % 100, size: 2 + (i % 3), delay: (i * 0.7) % 6, dur: 7 + (i % 5) })), []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {dots.map((d, i) => (
        <span key={i} className="hero-particle absolute rounded-full bg-white/50" style={{ left: `${d.left}%`, top: `${d.top}%`, width: d.size, height: d.size, animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s` }} />
      ))}
      {[18, 34, 66, 82].map((top, i) => (
        <span key={top} className="hero-speedline absolute h-px w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent" style={{ top: `${top}%`, animationDelay: `${i * 0.9}s` }} />
      ))}
      {/* grade de telemetria */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.07]" preserveAspectRatio="none">
        <defs><pattern id="hero-grid" width="64" height="64" patternUnits="userSpaceOnUse"><path d="M64 0H0V64" fill="none" stroke="#fff" strokeWidth="1" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>
    </div>
  );
}

/** Indicador circular: pontos do piloto em relação ao líder (dado real). */
function PointsGauge({ points, leader, color }: { points: number; leader: number; color: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const pct = leader ? Math.min(1, points / leader) : 0;
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14 -rotate-90" aria-hidden>
      <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
      <motion.circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct) }} transition={{ duration: 1.2, ease: EASE, delay: 0.3 }} />
    </svg>
  );
}

/**
 * Hero cinematográfico: carrossel vertical dos pilotos, inspirado na referência —
 * fundo na cor da equipe, sobrenome gigante atrás do retrato oficial, elementos flutuantes
 * (número oficial, carro 2026, capacete real quando existe) e transições com zoom.
 */
export function CinematicHero() {
  const reduce = useReducedMotion();
  const ev = useEventTheme();
  const { state } = useDriverStandings();
  const last = lastCompleted(races, new Date());
  const lastRes = useAsync((s) => (last?.round ? fetchRaceResults(SEASON, last.round, s) : Promise.resolve([] as RaceResultRow[])), [last?.round], { refreshMs: LIVE_REFRESH_MS });

  const items = state.status === 'success' ? state.data.items : [];
  const leaderPts = items[0]?.points ?? 0;
  const slides: Slide[] = useMemo(() => {
    const list = drivers.map((driver) => ({
      driver,
      team: teamById(driver.teamId)!,
      standing: standingFor(driver, items),
      last: lastRes.state.status === 'success' ? lastRes.state.data.find((r) => findDriver({ driverId: r.driverId, code: r.code })?.id === driver.id) : undefined,
    }));
    // ordem do campeonato; sem dados, a ordem do grid
    return list.sort((a, b) => (a.standing?.position ?? 99) - (b.standing?.position ?? 99));
  }, [items, lastRes.state]);

  const [[index, dir], setPage] = useState<[number, number]>([0, 1]);
  const [paused, setPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const slide = slides[index % slides.length];
  const go = useCallback((delta: number) => setPage(([i]) => [(i + delta + slides.length) % slides.length, delta]), [slides.length]);
  const goTo = (i: number) => setPage(([cur]) => [i, i >= cur ? 1 : -1]);

  // troca automática (desligada com movimento reduzido, mouse em cima, foco ou aba oculta)
  useEffect(() => {
    if (reduce || paused || userPaused) return;
    const id = setInterval(() => { if (document.visibilityState === 'visible') go(1); }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [reduce, paused, userPaused, go, index]);

  // pré-carrega o próximo e o anterior
  useEffect(() => {
    [1, -1].forEach((d) => {
      const s = slides[(index + d + slides.length) % slides.length];
      if (!s) return;
      [driverPortraitUrl(s.driver.id, s.team.id, 900), teamCarUrl(s.team.id, 1200)].forEach((u) => { if (u) { const img = new Image(); img.src = u; } });
    });
  }, [index, slides]);

  // parallax: ponteiro (desktop) e rolagem da página
  const ref = useRef<HTMLElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 50, damping: 18 });
  const sy = useSpring(py, { stiffness: 50, damping: 18 });
  const near = { x: useTransform(sx, (v) => v * 26), y: useTransform(sy, (v) => v * 18) };
  const far = { x: useTransform(sx, (v) => v * -12), y: useTransform(sy, (v) => v * -8) };
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const scrollY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 140]);
  const scrollFade = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0.35]);

  if (!slide) return null;
  const { driver, team, standing } = slide;
  const bgA = shade(team.color, -0.15);
  const bgB = shade(team.color, -0.72);
  const portrait = driverPortraitUrl(driver.id, team.id, 900);
  const portraitSm = driverPortraitUrl(driver.id, team.id, 560);
  const numberLogo = driverNumberLogoUrl(driver.id, team.id);
  const car = teamCarUrl(team.id, 1200);
  const helmet = helmetImages[driver.id];
  const name = driver.lastName.toUpperCase();
  const y = (d: number) => (reduce ? 0 : d);

  return (
    <section
      ref={ref}
      className="relative isolate h-[92svh] min-h-[620px] overflow-hidden sm:h-[100svh] sm:min-h-[680px]"
      aria-roledescription="carrossel"
      aria-label="Pilotos da temporada 2026"
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse' || reduce) return;
        const r = e.currentTarget.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width - 0.5);
        py.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); px.set(0); py.set(0); }}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (['ArrowDown', 'ArrowRight'].includes(e.key)) { e.preventDefault(); go(1); }
        if (['ArrowUp', 'ArrowLeft'].includes(e.key)) { e.preventDefault(); go(-1); }
      }}
    >
      {/* fundo nas cores da equipe (troca com fade) */}
      <AnimatePresence initial={false}>
        <motion.div
          key={team.id + driver.id}
          className="absolute inset-0 -z-20"
          style={{ background: `radial-gradient(120% 90% at 50% 42%, ${bgA} 0%, ${bgB} 62%, #05070f 100%)` }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.2 : 0.9, ease: 'easeInOut' }}
          aria-hidden
        />
      </AnimatePresence>
      <Atmosphere />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-carbon-950 to-transparent" aria-hidden />

      {/* palco */}
      <motion.div className="absolute inset-0" style={{ y: scrollY, opacity: scrollFade }}>
        <AnimatePresence initial={false} custom={dir}>
          <motion.div key={driver.id} className="absolute inset-0" custom={dir}>
            {/* sobrenome gigante (atrás do retrato) */}
            <motion.h2
              className="hero-name pointer-events-none absolute inset-x-0 top-[24%] flex select-none justify-center whitespace-nowrap font-display font-extrabold leading-none text-white sm:top-[34%]"
              style={{ fontSize: nameSize(name), x: far.x, y: far.y }}
              aria-label={`${driver.firstName} ${driver.lastName}`}
            >
              {name.split('').map((ch, i) => (
                <motion.span
                  key={i}
                  className="inline-block"
                  initial={{ y: y(dir > 0 ? 120 : -120), opacity: 0 }}
                  animate={{ y: 0, opacity: 1, transition: { duration: 0.8, ease: EASE, delay: (reduce ? 0 : 0.28) + i * 0.035 } }}
                  exit={{ y: y(dir > 0 ? -140 : 140), opacity: 0, transition: { duration: 0.45, ease: [0.7, 0, 0.84, 0], delay: i * 0.015 } }}
                  aria-hidden
                >{ch}</motion.span>
              ))}
            </motion.h2>

            {/* carro 2026 atravessando a cena */}
            {car && (
              <motion.div className="pointer-events-none absolute bottom-[6%] right-[-12%] hidden w-[min(62vw,980px)] sm:block" style={{ x: far.x }}>
              <motion.img
                src={car}
                alt=""
                className="w-full max-w-none drop-shadow-[0_30px_30px_rgba(0,0,0,0.55)]"
                initial={{ x: reduce ? 0 : '55%', opacity: 0 }}
                animate={{ x: 0, opacity: 0.9, transition: { duration: 1.1, ease: EASE, delay: 0.15 } }}
                exit={{ x: reduce ? 0 : '-60%', opacity: 0, transition: { duration: 0.55, ease: [0.7, 0, 0.84, 0] } }}
                decoding="async"
                aria-hidden
              />
              </motion.div>
            )}

            {/* retrato oficial com zoom cinematográfico */}
            {portrait && (
              <motion.div className="pointer-events-none absolute inset-x-0 bottom-[33%] mx-auto aspect-[4/5] h-[46%] sm:bottom-0 sm:h-[86%]" style={{ x: near.x, y: near.y }}>
                <motion.img
                  src={portrait}
                  srcSet={`${portraitSm} 560w, ${portrait} 900w`}
                  sizes="(max-width: 640px) 90vw, 60vh"
                  alt={`${driver.firstName} ${driver.lastName}`}
                  title={PHOTO_CREDIT}
                  className="h-full w-full object-contain object-bottom drop-shadow-[0_40px_50px_rgba(0,0,0,0.55)]"
                  initial={{ y: y(dir > 0 ? 90 : -90), scale: reduce ? 1 : 1.14, opacity: 0 }}
                  animate={{ y: 0, scale: 1, opacity: 1, transition: { duration: 1, ease: EASE, delay: 0.02 } }}
                  exit={{ y: y(dir > 0 ? -110 : 110), scale: reduce ? 1 : 0.94, opacity: 0, transition: { duration: 0.5, ease: [0.7, 0, 0.84, 0] } }}
                  decoding="async"
                />
              </motion.div>
            )}

            {/* número oficial flutuando */}
            {numberLogo && (
              <motion.div className="pointer-events-none absolute right-[5%] top-[17%] w-[20vw] max-w-[220px] sm:left-[9%] sm:right-auto sm:top-[max(23%,190px)] sm:w-[min(11vw,170px)]" style={{ x: near.x, y: near.y }}>
                <motion.img src={numberLogo} alt="" className="hero-float w-full drop-shadow-[0_18px_24px_rgba(0,0,0,0.45)]" aria-hidden
                  initial={{ opacity: 0, y: y(60), rotate: -14 }} animate={{ opacity: 0.95, y: 0, rotate: -8, transition: { duration: 1, ease: EASE, delay: 0.35 } }} exit={{ opacity: 0, y: y(-80), transition: { duration: 0.4 } }} />
              </motion.div>
            )}

            {/* capacete real (só quando existe imagem dele) */}
            {helmet && (
              <motion.div className="pointer-events-none absolute right-[6%] top-[20%] w-[26vw] max-w-[240px] sm:right-[14%] sm:w-[14vw]" style={{ x: near.x, y: near.y }}>
                <motion.img src={helmet.src} alt={helmet.caption} title={helmet.credit} className="hero-float-slow w-full drop-shadow-[0_24px_30px_rgba(0,0,0,0.5)]"
                  initial={{ opacity: 0, scale: 0.7, rotate: 12 }} animate={{ opacity: 1, scale: 1, rotate: 4, transition: { duration: 1, ease: EASE, delay: 0.45 } }} exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.4 } }} />
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* camada de informações */}
      <div className="container-grid pointer-events-none relative flex h-full flex-col justify-between pb-6 pt-24 sm:pb-10 sm:pt-28">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="kicker text-white/70">GRID F1 · Temporada {SEASON}</p>
            <h1 className="mt-1 text-xl text-white sm:text-2xl">The race never stops.</h1>
          </div>
          <div className="flex flex-col items-end gap-3">
            {ev.race && (
              <Link to={ev.phase === 'live' ? '/live' : `/calendario/${ev.race.id}`} className="pointer-events-auto group relative flex items-center gap-3 overflow-hidden rounded-full border border-white/20 bg-black/30 py-1.5 pl-2 pr-4 backdrop-blur-md transition hover:border-gold" aria-label={`${ev.phase === 'live' ? 'Ao vivo' : 'Próxima etapa'}: ${ev.race.name}`}>
                <span className="event-stripe absolute inset-x-0 bottom-0 h-0.5" aria-hidden />
                <Flag code={ev.race.countryCode} country={ev.race.country} className="text-2xl" />
                <span className="text-left leading-tight">
                  <span className="kicker block text-[9px] text-gold">{ev.phase === 'live' ? 'Ao vivo' : 'Próxima etapa'}</span>
                  <span className="block text-sm font-semibold text-white">{ev.race.name}</span>
                </span>
              </Link>
            )}
            <p className="kicker hidden items-center gap-2 text-white/70 sm:flex" aria-live="polite">
              <span className="font-mono text-white">{String(index + 1).padStart(2, '0')}</span>
              <span className="h-px w-10 bg-white/40" aria-hidden />
              <span>{String(slides.length).padStart(2, '0')}</span>
            </p>
          </div>
        </div>

        <div className="flex items-end justify-between gap-4">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={driver.id} className="pointer-events-auto max-w-md"
              initial={{ opacity: 0, y: y(24) }} animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE, delay: 0.35 } }} exit={{ opacity: 0, y: y(-16), transition: { duration: 0.3 } }}>
              <p className="flex flex-wrap items-center gap-2 text-sm text-white/80">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: team.color, boxShadow: `0 0 12px ${team.color}` }} aria-hidden />
                {team.name} · <Flag code={driver.countryCode} country={driver.nationality} /> {driver.nationality} · #{driver.number}
              </p>
              {/* painel de corrida: posição, pontos e última corrida (dados reais) */}
              <div className="mt-3 flex items-center gap-4 rounded-2xl border border-white/15 bg-black/35 p-3 pr-5 backdrop-blur-md">
                {standing ? (
                  <>
                    <div className="relative">
                      <PointsGauge points={standing.points} leader={leaderPts} color={team.color} />
                      <span className="absolute inset-0 flex items-center justify-center font-display text-sm font-bold text-white">P{standing.position}</span>
                    </div>
                    <dl className="grid grid-cols-3 gap-3 text-white sm:gap-4">
                      <div><dt className="kicker text-[9px] text-white/60">Pontos</dt><dd className="font-display text-xl font-semibold tabular">{standing.points}</dd></div>
                      <div><dt className="kicker text-[9px] text-white/60">Vitórias</dt><dd className="font-display text-xl font-semibold tabular">{standing.wins}</dd></div>
                      <div><dt className="kicker whitespace-nowrap text-[9px] text-white/60">Último GP</dt><dd className="font-display text-xl font-semibold tabular">{slide.last ? (/Finished|Lap/.test(slide.last.status) ? `P${slide.last.position}` : 'Aband.') : '—'}</dd></div>
                    </dl>
                  </>
                ) : (
                  <p className="text-sm text-white/70">{state.status === 'error' ? 'Classificação indisponível agora.' : 'Carregando classificação…'}</p>
                )}
              </div>
              {standing?.position === 1 && <p className="mt-2 flex items-center gap-1.5 text-xs text-gold"><Trophy className="h-3.5 w-3.5" aria-hidden />Líder do campeonato</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to={`/pilotos/${driver.id}`} className="btn-primary py-2.5">Ver perfil <ArrowRight className="h-4 w-4" aria-hidden /></Link>
                <Link to="/live" className="btn-ghost py-2.5">F1 Live</Link>
              </div>
              {last && <p className="mt-3 text-[11px] text-white/50">Último GP: {last.name} · Imagens oficiais: Formula 1</p>}
            </motion.div>
          </AnimatePresence>

          {/* navegação: setas, indicadores de posição e pausa */}
          <div className="pointer-events-auto flex flex-col items-center gap-3">
            <button type="button" onClick={() => go(-1)} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur transition hover:bg-white hover:text-black" aria-label="Piloto anterior"><ChevronUp className="h-5 w-5" aria-hidden /></button>
            <ol className="hidden flex-col items-center gap-1.5 sm:flex" aria-label="Pilotos">
              {slides.slice(0, 10).map((s, i) => (
                <li key={s.driver.id}>
                  <button type="button" onClick={() => goTo(i)} aria-label={`${s.driver.firstName} ${s.driver.lastName}${s.standing ? `, ${s.standing.position}º` : ''}`} aria-current={i === index} className="group flex items-center gap-2">
                    <span className={`font-mono text-[10px] transition ${i === index ? 'text-white' : 'text-white/0 group-hover:text-white/70'}`}>{s.driver.code}</span>
                    <span className={`block rounded-full transition-all ${i === index ? 'h-6 w-1.5 bg-white' : 'h-1.5 w-1.5 bg-white/40 group-hover:bg-white/80'}`} />
                  </button>
                </li>
              ))}
            </ol>
            <button type="button" onClick={() => go(1)} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur transition hover:bg-white hover:text-black" aria-label="Próximo piloto"><ChevronDown className="h-5 w-5" aria-hidden /></button>
            {!reduce && (
              <button type="button" onClick={() => setUserPaused((p) => !p)} className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:text-white" aria-label={userPaused ? 'Retomar troca automática' : 'Pausar troca automática'} aria-pressed={userPaused}>
                {userPaused ? <Play className="h-3.5 w-3.5" aria-hidden /> : <Pause className="h-3.5 w-3.5" aria-hidden />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* barra de progresso da troca automática */}
      {!reduce && !paused && !userPaused && (
        <motion.div key={`p${index}`} className="absolute bottom-0 left-0 h-0.5 origin-left" style={{ background: team.color }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: AUTOPLAY_MS / 1000, ease: 'linear' }} aria-hidden />
      )}

      {/* arrastar para os lados no celular (a rolagem vertical continua livre) */}
      <motion.div
        className="absolute inset-x-0 top-[18%] bottom-[38%] sm:hidden"
        style={{ touchAction: 'pan-y' }}
        onPanEnd={(_, info) => { if (Math.abs(info.offset.x) > 50 && Math.abs(info.offset.x) > Math.abs(info.offset.y)) go(info.offset.x < 0 ? 1 : -1); }}
        aria-hidden
      />
    </section>
  );
}
