import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw, Timer, Trophy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ShareButton } from '../components/ShareButton';
import { teams } from '../data/teams';
import { useLocalStorage } from '../hooks/useLocalStorage';

type Wheel = 'fl' | 'fr' | 'rl' | 'rr';
type Phase = 'idle' | 'countdown' | 'working' | 'release' | 'done';

const WHEELS: { id: Wheel; label: string; x: number; y: number }[] = [
  { id: 'fl', label: 'Dianteira esquerda', x: 22, y: 26 },
  { id: 'fr', label: 'Dianteira direita', x: 78, y: 26 },
  { id: 'rl', label: 'Traseira esquerda', x: 22, y: 74 },
  { id: 'rr', label: 'Traseira direita', x: 78, y: 74 },
];
const PENALTY = 400;
const TYRES = [
  { name: 'Macio', color: '#e10600' },
  { name: 'Médio', color: '#facc15' },
  { name: 'Duro', color: '#f4f4f5' },
];

const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

/** Pit stop: toque nos pneus na ordem em que acendem e libere o carro. */
export function PitStopGame() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [count, setCount] = useState(3);
  const [order, setOrder] = useState<Wheel[]>([]);
  const [step, setStep] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [final, setFinal] = useState<number | null>(null);
  const [shake, setShake] = useState<Wheel | null>(null);
  const [teamIdx, setTeamIdx] = useState(0);
  const [tyre, setTyre] = useState(0);
  const [run, setRun] = useState(0);
  const countdown = useRef(0);
  const [best, setBest] = useLocalStorage<number | null>('gridf1:game:pitstop', null);
  const t0 = useRef(0);
  const raf = useRef(0);
  const team = teams[teamIdx];

  useEffect(() => () => { cancelAnimationFrame(raf.current); clearInterval(countdown.current); }, []);

  const tick = () => {
    setElapsed(performance.now() - t0.current);
    raf.current = requestAnimationFrame(tick);
  };

  const start = () => {
    cancelAnimationFrame(raf.current);
    clearInterval(countdown.current);
    setRun((r) => r + 1);
    setOrder(shuffle(WHEELS.map((w) => w.id)));
    setStep(0); setPenalty(0); setElapsed(0); setFinal(null);
    setPhase('countdown'); setCount(3);
    let n = 3;
    const id = window.setInterval(() => {
      n -= 1;
      setCount(n);
      if (n === 0) {
        clearInterval(id);
        setPhase('working');
        t0.current = performance.now();
        raf.current = requestAnimationFrame(tick);
      }
    }, 600);
    countdown.current = id;
  };

  const hit = (w: Wheel) => {
    if (phase !== 'working') return;
    if (order[step] !== w) {
      setPenalty((p) => p + PENALTY);
      setShake(w);
      setTimeout(() => setShake(null), 300);
      navigator.vibrate?.(60);
      return;
    }
    navigator.vibrate?.(15);
    if (step === 3) setPhase('release');
    setStep((s) => s + 1);
  };

  const release = () => {
    if (phase !== 'release') return;
    cancelAnimationFrame(raf.current);
    const total = Math.round(performance.now() - t0.current + penalty);
    setFinal(total);
    setBest((b) => (b === null || total < b ? total : b));
    setPhase('done');
  };

  const shown = (final ?? elapsed + penalty) / 1000;
  const done = (w: Wheel) => order.indexOf(w) < step;
  const target = phase === 'working' ? order[step] : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="panel relative overflow-hidden p-4 sm:p-6">
        <div className="grid-bg absolute inset-0 opacity-30" aria-hidden />
        <div className="relative mb-4 flex items-center justify-between">
          <p className="label flex items-center gap-2"><Timer className="h-3.5 w-3.5 text-gold" aria-hidden />Tempo parado</p>
          <p className="font-display text-4xl font-semibold tabular-nums text-white" aria-live="off">{shown.toFixed(2)}<span className="ml-1 text-lg text-gold">s</span></p>
        </div>
        {penalty > 0 && <p className="relative -mt-3 mb-2 text-right text-xs text-gold">+{(penalty / 1000).toFixed(1)} s de penalidade (pneu errado)</p>}

        {/* box visto de cima */}
        <div className="relative mx-auto aspect-[3/4] w-full max-w-sm select-none" style={{ touchAction: 'manipulation' }}>
          <div className="absolute inset-x-[30%] inset-y-0 rounded-xl border-x-2 border-dashed border-white/10" aria-hidden />
          <motion.svg
            viewBox="0 0 100 133" className="absolute inset-0 h-full w-full drop-shadow-[0_20px_30px_rgba(0,0,0,0.6)]" aria-hidden
            key={`${teamIdx}-${run}`}
            initial={{ y: run === 0 ? 0 : -260 }} animate={{ y: phase === 'done' ? 300 : 0 }}
            transition={{ duration: phase === 'done' ? 0.6 : 0.55, ease: phase === 'done' ? [0.7, 0, 0.84, 0] : [0.16, 1, 0.3, 1] }}
          >
            {/* asa dianteira */}
            <rect x="18" y="6" width="64" height="7" rx="2" fill={team.color} />
            <rect x="18" y="12" width="64" height="2" fill={team.accent} />
            {/* bico e chassi */}
            <path d="M46 8 L54 8 L56 40 L64 52 L66 92 L60 112 L40 112 L34 92 L36 52 L44 40 Z" fill={team.color} />
            <path d="M48 10 L52 10 L53 40 L47 40 Z" fill={team.accent} opacity="0.8" />
            {/* cockpit + halo */}
            <ellipse cx="50" cy="66" rx="6" ry="9" fill="#0a0a0a" />
            <path d="M43 60 Q50 52 57 60" stroke="#27272a" strokeWidth="2.5" fill="none" />
            <circle cx="50" cy="64" r="3.4" fill={team.accent} />
            {/* laterais */}
            <path d="M36 54 L28 60 L28 88 L36 94 Z M64 54 L72 60 L72 88 L64 94 Z" fill={team.color} opacity="0.85" />
            {/* asa traseira */}
            <rect x="26" y="114" width="48" height="10" rx="2" fill="#18181b" />
            <rect x="26" y="114" width="48" height="3" fill={team.color} />
          </motion.svg>

          {WHEELS.map((w) => {
            const isTarget = target === w.id;
            const isDone = done(w.id) || phase === 'release' || phase === 'done';
            return (
              <motion.button
                key={w.id}
                type="button"
                onPointerDown={(e) => { e.preventDefault(); hit(w.id); }}
                onClick={(e) => { if (e.detail === 0) hit(w.id); }}
                disabled={phase !== 'working'}
                animate={shake === w.id ? { x: [0, -6, 6, -4, 0] } : { x: 0 }}
                transition={{ duration: 0.3 }}
                className={`absolute flex h-[22%] w-[17%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg border-2 transition-[box-shadow,border-color] ${isTarget ? 'border-telemetry-yellow shadow-[0_0_30px_rgba(250,204,21,0.8)]' : 'border-transparent'}`}
                style={{ left: `${w.x}%`, top: `${w.y}%`, background: '#111' }}
                aria-label={`${w.label}${isTarget ? ' — trocar agora' : isDone ? ' — trocado' : ''}`}
              >
                <span className="absolute inset-[18%] rounded-md border-[3px]" style={{ borderColor: isDone ? TYRES[tyre].color : '#3f3f46' }} aria-hidden />
                {isTarget && <span className="absolute inset-0 animate-ping rounded-lg border-2 border-telemetry-yellow" aria-hidden />}
              </motion.button>
            );
          })}

          {/* overlays */}
          <AnimatePresence>
            {phase === 'countdown' && (
              <motion.p key={count} initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center font-display text-8xl font-semibold text-white drop-shadow-[0_0_20px_rgba(237,180,11,0.9)]">
                {count || 'GO'}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="relative mt-5 flex flex-wrap items-center justify-center gap-3">
          {(phase === 'idle' || phase === 'done') && (
            <button type="button" className="btn-primary" onClick={start}>{phase === 'done' ? 'Novo pit stop' : 'Chamar para o box'}</button>
          )}
          {phase === 'working' && <p className="font-condensed text-telemetry-yellow">Toque no pneu que está piscando</p>}
          {phase === 'release' && (
            <motion.button initial={{ scale: 0.8 }} animate={{ scale: 1 }} type="button" className="btn-primary bg-telemetry-green text-black hover:bg-telemetry-green" onClick={release} autoFocus>
              Liberar o carro!
            </motion.button>
          )}
          {phase === 'done' && final !== null && (
            <p className="w-full text-center font-condensed text-zinc-300" aria-live="polite">
              Pit stop de {(final / 1000).toFixed(2)} s {best === final ? '· novo recorde!' : ''}
            </p>
          )}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="panel p-5">
          <p className="label flex items-center gap-2"><Trophy className="h-3.5 w-3.5 text-telemetry-yellow" aria-hidden />Seu recorde</p>
          <p className="mt-1 font-display text-4xl font-semibold text-white">{best !== null ? <>{(best / 1000).toFixed(2)}<span className="ml-1 text-lg text-gold">s</span></> : '—'}</p>
          {best !== null && (
            <div className="mt-4 flex flex-wrap gap-2">
              <ShareButton title="Desafio do pit stop · GRID F1" text={`Fiz um pit stop de ${(best / 1000).toFixed(2)} s no GRID F1. Consegue bater?`} path="/jogos/pit-stop" />
              <button type="button" className="btn-ghost" onClick={() => setBest(null)}><RotateCcw className="h-4 w-4" aria-hidden />Zerar</button>
            </div>
          )}
        </div>
        <div className="panel p-5">
          <p className="label mb-3">Sua equipe</p>
          <div className="flex flex-wrap gap-2">
            {teams.map((t, i) => (
              <button key={t.id} type="button" disabled={phase !== 'idle' && phase !== 'done'} onClick={() => setTeamIdx(i)} className={`h-8 w-8 rounded-full border-2 transition disabled:opacity-40 ${i === teamIdx ? 'scale-110 border-white' : 'border-transparent'}`} style={{ background: t.color }} aria-label={t.name} aria-pressed={i === teamIdx} title={t.name} />
            ))}
          </div>
          <p className="label mb-3 mt-5">Composto</p>
          <div className="flex gap-2">
            {TYRES.map((t, i) => (
              <button key={t.name} type="button" onClick={() => setTyre(i)} className={`chip ${i === tyre ? 'border-white text-white' : ''}`} aria-pressed={i === tyre}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} aria-hidden />{t.name}
              </button>
            ))}
          </div>
        </div>
        <div className="panel p-5 text-sm text-zinc-400">
          <p className="label mb-2">Como funciona</p>
          Os pneus acendem um de cada vez, em ordem sorteada. Toque no que está piscando; errar o pneu custa <strong className="text-gold">+0,4 s</strong>. Depois dos quatro, libere o carro. Nas corridas, os melhores pit stops ficam perto de 2 segundos.
        </div>
      </aside>
    </div>
  );
}
