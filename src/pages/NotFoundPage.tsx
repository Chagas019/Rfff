import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, CalendarDays, RotateCcw, Search, Trophy, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { circuits } from '../data/circuits';
import { trackPath } from '../utils/track';

const EASE = [0.16, 1, 0.3, 1] as const;
const LAP_MS = 3800;
const START_DELAY_MS = 1500; // o carro entra quando o traçado termina de ser desenhado
const OFF_MS = 1300;
const OFF_DIST = 15;

const SHORTCUTS = [
  { to: '/calendario', label: 'Calendário', icon: CalendarDays },
  { to: '/classificacao', label: 'Classificação', icon: Trophy },
  { to: '/pilotos', label: 'Pilotos', icon: Users },
];

type Phase = 'lap' | 'off' | 'parked' | 'rejoined';
type Pt = { x: number; y: number };

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Escolhe o ponto da pista onde o carro escapa: seguindo reto, ele vai mais longe do centro sem sair da tela. */
function pickExit(path: SVGPathElement, total: number) {
  const pts: Pt[] = [];
  for (let i = 0; i < 40; i++) pts.push(path.getPointAtLength((total * i) / 40));
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  let best = { at: total * 0.3, score: -Infinity };
  for (let f = 0.15; f <= 0.9; f += 0.025) {
    const at = total * f;
    const a = path.getPointAtLength(at);
    const b = path.getPointAtLength(at + 0.6);
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const end = { x: a.x + ((b.x - a.x) / len) * OFF_DIST, y: a.y + ((b.y - a.y) / len) * OFF_DIST };
    if (end.x < -4 || end.x > 104 || end.y < -4 || end.y > 104) continue;
    const score = Math.hypot(end.x - cx, end.y - cy);
    if (score > best.score) best = { at, score };
  }
  return best.at;
}

/**
 * Página 404 "Saiu da pista": um carro entra no traçado de Silverstone, escapa numa curva
 * (marca de pneu, cascalho e rodada) e para na caixa de brita. "Recolocar o carro" devolve ele à pista.
 * Tudo feito no próprio site (SVG + requestAnimationFrame), sem imagens ou vídeos externos.
 */
export function NotFoundPage() {
  const reduce = useReducedMotion();
  const circuit = useMemo(() => circuits.find((c) => c.id === 'silverstone') ?? circuits[0], []);
  const d = useMemo(() => trackPath(circuit.layout), [circuit]);

  const pathRef = useRef<SVGPathElement>(null);
  const carRef = useRef<SVGGElement>(null);
  const skidRef = useRef<SVGPolylineElement>(null);
  const gravelRef = useRef<SVGGElement>(null);
  const [phase, setPhase] = useState<Phase>('lap');
  const [parkedAt, setParkedAt] = useState<Pt | null>(null);
  const phaseRef = useRef<Phase>('lap');
  const runId = useRef(0);

  const setCar = (p: Pt, heading: number) => {
    carRef.current?.setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${heading.toFixed(1)})`);
  };
  const headingAt = (path: SVGPathElement, at: number, total: number) => {
    const a = path.getPointAtLength(((at % total) + total) % total);
    const b = path.getPointAtLength(((at + 0.6) % total + total) % total);
    return { a, deg: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI, dx: b.x - a.x, dy: b.y - a.y };
  };

  /** Entra na pista, escapa numa curva e para. Com `keepLapping`, só fica dando voltas. */
  const run = useCallback((keepLapping: boolean) => {
    const path = pathRef.current;
    if (!path) return () => {};
    const id = ++runId.current;
    const total = path.getTotalLength();
    const exitAt = pickExit(path, total);
    let raf = 0;
    const t0 = performance.now() + (keepLapping ? 0 : START_DELAY_MS);
    carRef.current?.setAttribute('opacity', keepLapping ? '1' : '0');
    skidRef.current?.setAttribute('points', '');
    gravelRef.current?.setAttribute('opacity', '0');

    const parkFinal = () => {
      const { a, deg, dx, dy } = headingAt(path, exitAt, total);
      const len = Math.hypot(dx, dy) || 1;
      const end = { x: a.x + (dx / len) * OFF_DIST, y: a.y + (dy / len) * OFF_DIST };
      return { start: a, end, deg };
    };

    if (reduce && !keepLapping) {
      // sem animação: o carro já aparece parado na brita
      const { start, end, deg } = parkFinal();
      setCar(end, deg + 200);
      carRef.current?.setAttribute('opacity', '1');
      skidRef.current?.setAttribute('points', `${start.x},${start.y} ${end.x},${end.y}`);
      gravelRef.current?.setAttribute('transform', `translate(${end.x} ${end.y})`);
      gravelRef.current?.setAttribute('opacity', '1');
      phaseRef.current = 'parked'; setPhase('parked'); setParkedAt(end);
      return () => {};
    }

    const tick = (now: number) => {
      if (id !== runId.current) return;
      const elapsed = now - t0;
      if (elapsed < 0) { raf = requestAnimationFrame(tick); return; }
      carRef.current?.setAttribute('opacity', '1');
      const dist = (elapsed / LAP_MS) * total;
      if (keepLapping || dist < exitAt) {
        const { a, deg } = headingAt(path, dist, total);
        setCar(a, deg);
        raf = requestAnimationFrame(tick);
        return;
      }
      // escapou: segue reto freando, rodando, deixando marca de pneu
      if (phaseRef.current === 'lap') { phaseRef.current = 'off'; setPhase('off'); }
      const { start, end, deg } = parkFinal();
      const tOff = Math.min(1, (elapsed - (exitAt / total) * LAP_MS) / OFF_MS);
      const k = easeOut(tOff);
      const pos = { x: start.x + (end.x - start.x) * k, y: start.y + (end.y - start.y) * k };
      setCar(pos, deg + 200 * easeOut(Math.min(1, tOff * 1.3)));
      skidRef.current?.setAttribute('points', `${start.x.toFixed(2)},${start.y.toFixed(2)} ${pos.x.toFixed(2)},${pos.y.toFixed(2)}`);
      gravelRef.current?.setAttribute('transform', `translate(${pos.x.toFixed(2)} ${pos.y.toFixed(2)})`);
      gravelRef.current?.setAttribute('opacity', String(Math.min(1, tOff * 2)));
      if (tOff < 1) { raf = requestAnimationFrame(tick); return; }
      phaseRef.current = 'parked'; setPhase('parked'); setParkedAt(end);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  useEffect(() => {
    const stop = run(false);
    return () => { runId.current++; stop(); }; // para qualquer volta em andamento ao sair da página
  }, [run]);

  const rejoin = () => {
    phaseRef.current = 'rejoined';
    setPhase('rejoined');
    setParkedAt(null);
    run(true);
  };
  const openSearch = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));

  const status = {
    lap: { dot: 'bg-telemetry-green', text: 'Bandeira verde · volta em andamento' },
    off: { dot: 'bg-gold', text: 'Bandeira amarela · carro fora da pista' },
    parked: { dot: 'bg-gold', text: 'Erro 404 · parado na caixa de brita' },
    rejoined: { dot: 'bg-telemetry-green', text: 'De volta à pista · escolha um destino' },
  }[phase];

  return (
    <section className="relative flex h-[100svh] w-full flex-col overflow-hidden" aria-labelledby="nf-title">
      {/* "404" gigante vazado ao fundo */}
      <motion.div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        initial={reduce ? false : { opacity: 0, scale: 1.15, filter: 'blur(20px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1.4, ease: EASE }}
        aria-hidden
      >
        <span
          className="select-none whitespace-nowrap font-albert font-black leading-none tracking-tighter text-transparent"
          style={{ fontSize: 'clamp(220px, 46vw, 760px)', WebkitTextStroke: '2px rgba(237,180,11,0.16)' }}
        >
          404
        </span>
      </motion.div>
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" aria-hidden />

      {/* pista */}
      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4 pt-20">
        <motion.svg
          viewBox="-8 -8 116 116"
          className="h-full max-h-[56vh] w-full max-w-[640px]"
          role="img"
          aria-label={`Traçado esquemático de ${circuit.name} com um carro que saiu da pista`}
          initial={reduce ? false : { opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.25, duration: 1, ease: EASE }}
        >
          <defs>
            <filter id="nf-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.1" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* asfalto, zebra e linha dourada */}
          <path d={d} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" strokeLinejoin="round" />
          <path d={d} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="7.4" strokeDasharray="1.2 1.2" strokeLinejoin="round" opacity="0.35" />
          <motion.path
            ref={pathRef}
            d={d}
            fill="none"
            stroke="#EDB40B"
            strokeWidth="1.2"
            strokeLinejoin="round"
            filter="url(#nf-glow)"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.3, duration: 1.6, ease: 'easeInOut' }}
          />
          {/* largada */}
          <circle cx={circuit.layout[0][0]} cy={circuit.layout[0][1]} r="1.8" fill="#fff" />
          {/* marca de pneu e cascalho */}
          <polyline ref={skidRef} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="0.8 0.5" />
          <g ref={gravelRef} opacity="0">
            {[[-2.5, -1.5], [2.2, -2.4], [3, 1.8], [-1.8, 2.6], [0.6, 3.4], [-3.4, 0.8], [1.6, -3.6]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={0.45 + (i % 3) * 0.15} fill="#c9b48a" opacity="0.7" />
            ))}
          </g>
          {/* carro */}
          <g ref={carRef} filter="url(#nf-glow)">
            <rect x="-2.6" y="-1.25" width="5.2" height="2.5" rx="1.1" fill="#E10600" />
            <rect x="0.6" y="-0.75" width="1.6" height="1.5" rx="0.5" fill="#fff" opacity="0.9" />
          </g>
          {/* "você está aqui" */}
          {parkedAt && (
            <g transform={`translate(${parkedAt.x} ${parkedAt.y})`}>
              <circle r="4" fill="none" stroke="#EDB40B" strokeWidth="0.5">
                <animate attributeName="r" values="3;7;3" dur="1.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0;1" dur="1.8s" repeatCount="indefinite" />
              </circle>
              <g transform={`translate(${parkedAt.x > 70 ? -4 : 4} -6)`}>
                <text textAnchor={parkedAt.x > 70 ? 'end' : 'start'} fontSize="4" fontWeight="600" fill="#fff" fontFamily="Albert Sans, sans-serif">Você está aqui</text>
              </g>
            </g>
          )}
        </motion.svg>
      </div>

      {/* texto e ações */}
      <div className="relative z-30 flex flex-col items-center px-4 pb-8 text-center sm:pb-12">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-[13px] text-white/80" role="status" aria-live="polite">
          <span className={`h-2 w-2 rounded-full ${status.dot} ${phase === 'off' ? 'animate-pulse' : ''}`} aria-hidden />
          {status.text}
        </p>
        <div className="overflow-hidden pb-1">
          <h1 id="nf-title" className="text-[clamp(36px,6vw,72px)] font-semibold leading-[0.9] tracking-[-0.05em] text-white animate-speed-reveal anim-delay-300">
            Saiu da <span className="text-gold">pista.</span>
          </h1>
        </div>
        <motion.p
          className="mt-3 max-w-md text-[15px] text-white/60 sm:text-[17px]"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.9, ease: EASE }}
        >
          Esta página não existe ou mudou de endereço. Volte para o início ou escolha outro trecho do circuito.
        </motion.p>
        <motion.div
          className="mt-6 flex flex-col items-center gap-4"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.9, ease: EASE }}
        >
          <div className="flex flex-wrap justify-center gap-2">
            <Link to="/" className="btn-primary group">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden /> Voltar ao início
            </Link>
            {phase === 'parked' && (
              <button type="button" onClick={rejoin} className="btn-ghost">
                <RotateCcw className="h-4 w-4" aria-hidden /> Recolocar o carro
              </button>
            )}
            <button type="button" onClick={openSearch} className="btn-ghost">
              <Search className="h-4 w-4" aria-hidden /> Pesquisar
            </button>
          </div>
          <nav className="flex flex-wrap justify-center gap-2" aria-label="Atalhos">
            {SHORTCUTS.map((s) => (
              <Link key={s.to} to={s.to} className="chip transition hover:border-gold/50 hover:text-white">
                <s.icon className="h-3.5 w-3.5" aria-hidden /> {s.label}
              </Link>
            ))}
          </nav>
        </motion.div>
      </div>
    </section>
  );
}
