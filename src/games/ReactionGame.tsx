import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw, Trophy } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ShareButton } from '../components/ShareButton';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { rateReaction } from './quiz';

type Phase = 'idle' | 'lighting' | 'armed' | 'result' | 'jump';

const LIGHT_STEP = 900; // ms entre cada par de luzes (como na largada real, ~1 s)

/** Luzes de largada: 5 luzes acendem, apagam num momento aleatório — reaja o mais rápido possível. */
export function ReactionGame() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [lit, setLit] = useState(0);
  const [time, setTime] = useState<number | null>(null);
  const [best, setBest] = useLocalStorage<number | null>('gridf1:game:reaction', null);
  const [history, setHistory] = useState<number[]>([]);
  const timers = useRef<number[]>([]);
  const outAt = useRef(0);
  const phaseRef = useRef<Phase>('idle');
  phaseRef.current = phase;

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => clear, []);

  const start = useCallback(() => {
    clear();
    setTime(null);
    setLit(0);
    setPhase('lighting');
    for (let i = 1; i <= 5; i++) timers.current.push(window.setTimeout(() => setLit(i), i * LIGHT_STEP));
    const hold = 5 * LIGHT_STEP + 400 + Math.random() * 2600; // apagam entre 0,4 s e 3 s depois da 5ª
    timers.current.push(window.setTimeout(() => {
      setLit(0);
      outAt.current = performance.now();
      setPhase('armed');
    }, hold));
  }, []);

  const press = useCallback(() => {
    const p = phaseRef.current;
    if (p === 'idle' || p === 'result' || p === 'jump') return start();
    if (p === 'lighting') { clear(); setLit(0); setPhase('jump'); return; }
    const ms = Math.round(performance.now() - outAt.current);
    setTime(ms);
    setHistory((h) => [ms, ...h].slice(0, 5));
    setBest((b) => (b === null || ms < b ? ms : b));
    setPhase('result');
  }, [start, setBest]);

  // espaço / Enter também larga
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== 'Enter') return;
      const el = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(el.tagName)) return;
      e.preventDefault();
      if (!e.repeat) press();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press]);

  const rating = time !== null ? rateReaction(time) : null;
  const message =
    phase === 'idle' ? 'Toque na área ou aperte espaço para começar'
    : phase === 'lighting' ? 'Espere as luzes apagarem…'
    : phase === 'armed' ? 'VAI!'
    : phase === 'jump' ? 'Queimou a largada! Toque para tentar de novo'
    : rating?.label;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <button
        type="button"
        onPointerDown={(e) => { e.preventDefault(); press(); }}
        onClick={(e) => { if (e.detail === 0) press(); /* leitores de tela */ }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!e.repeat) press(); } }}
        className={`panel relative flex min-h-[340px] select-none flex-col items-center justify-center gap-8 overflow-hidden p-6 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold sm:min-h-[400px] ${phase === 'jump' ? 'bg-gold/10' : phase === 'armed' ? 'bg-telemetry-green/[0.06]' : ''}`}
        style={{ touchAction: 'manipulation' }}
        aria-label="Área de largada. Toque quando as luzes apagarem."
      >
        <div className="grid-bg absolute inset-0 opacity-40" aria-hidden />
        {/* pórtico com 5 colunas de luzes */}
        <div className="relative flex gap-2 rounded-2xl border border-white/10 bg-black/80 p-3 shadow-2xl sm:gap-4 sm:p-4" aria-hidden>
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="flex flex-col gap-2 rounded-xl bg-zinc-900 p-2 sm:gap-3 sm:p-3">
              {[0, 1].map((row) => (
                <span
                  key={row}
                  className="block h-9 w-9 rounded-full border border-black transition-[background,box-shadow] duration-75 sm:h-14 sm:w-14"
                  style={lit >= n
                    ? { background: 'radial-gradient(circle at 35% 30%, #ff8a80, #e10600 45%, #7a0300)', boxShadow: '0 0 28px 6px rgba(237,180,11,0.75)' }
                    : { background: 'radial-gradient(circle at 35% 30%, #3f3f46, #18181b 60%)' }}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="relative text-center" aria-live="polite">
          <AnimatePresence mode="wait">
            {time !== null && phase === 'result' ? (
              <motion.p key="t" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-display text-6xl font-semibold tabular-nums text-white sm:text-7xl">
                {time}<span className="ml-1 text-2xl text-gold">ms</span>
              </motion.p>
            ) : null}
          </AnimatePresence>
          <p className={`mt-2 font-condensed text-lg ${phase === 'jump' ? 'text-gold' : phase === 'armed' ? 'text-telemetry-green' : rating?.tone === 'great' ? 'text-telemetry-purple' : 'text-zinc-300'}`}>
            {message}
          </p>
          {(phase === 'result' || phase === 'jump') && <p className="mt-1 text-xs text-zinc-500">Toque de novo para outra largada</p>}
        </div>
      </button>

      <aside className="space-y-4">
        <div className="panel p-5">
          <p className="label flex items-center gap-2"><Trophy className="h-3.5 w-3.5 text-telemetry-yellow" aria-hidden />Seu recorde</p>
          <p className="mt-1 font-display text-4xl font-semibold text-white">{best !== null ? <>{best}<span className="ml-1 text-lg text-gold">ms</span></> : '—'}</p>
          <p className="mt-1 text-xs text-zinc-500">Salvo só neste aparelho.</p>
          {best !== null && (
            <div className="mt-4 flex flex-wrap gap-2">
              <ShareButton title="Desafio das luzes · GRID F1" text={`Reagi às luzes de largada em ${best} ms no GRID F1. Consegue ser mais rápido?`} path="/jogos" />
              <button type="button" className="btn-ghost" onClick={() => { setBest(null); setHistory([]); }}><RotateCcw className="h-4 w-4" aria-hidden />Zerar</button>
            </div>
          )}
        </div>
        <div className="panel p-5">
          <p className="label">Últimas largadas</p>
          {history.length ? (
            <ol className="mt-3 space-y-2">
              {history.map((h, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-14 font-mono text-white">{h} ms</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5"><span className="block h-full rounded-full bg-gold" style={{ width: `${Math.max(8, 100 - (h - 150) / 4)}%` }} /></span>
                </li>
              ))}
            </ol>
          ) : <p className="mt-2 text-sm text-zinc-400">Nenhuma ainda.</p>}
        </div>
        <div className="panel p-5 text-sm text-zinc-400">
          <p className="label mb-2">Como funciona</p>
          As cinco luzes acendem uma a uma. Quando todas apagam, é largada — toque, clique ou aperte espaço. Antes disso é <strong className="text-gold">queima de largada</strong>. O momento em que as luzes apagam é sorteado a cada tentativa, como na F1.
        </div>
      </aside>
    </div>
  );
}
