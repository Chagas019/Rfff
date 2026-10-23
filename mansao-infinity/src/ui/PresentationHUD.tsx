import { motion } from 'motion/react';
import type { Level } from '../data/plan';
import { useExperience } from '../store/useExperience';
import { BoardLabels } from './BoardLabels';

/** Escala gráfica aproximada (câmera teleobjetiva quase ortogonal, fov 20°). */
function ScaleBar({ ink }: { ink: string }) {
  const pose = useExperience((s) => s.pose);
  const d = Math.hypot(pose.x + 2, pose.y - 6, pose.z);
  const visibleHeight = 2 * d * Math.tan((20 * Math.PI) / 360);
  const pxPerM = window.innerHeight / Math.max(visibleHeight, 1);
  const meters = [1, 2, 5, 10, 20].find((m) => m * pxPerM > 90) ?? 20;
  const w = meters * pxPerM;
  return (
    <div className="flex flex-col gap-1.5" style={{ color: ink }} aria-hidden="true">
      <div className="flex items-end text-[10px] tracking-[0.12em]">
        <span>0</span>
        <span style={{ marginLeft: w / 2 - 6 }}>{meters / 2}</span>
        <span style={{ marginLeft: w / 2 - 14 }}>{meters} m</span>
      </div>
      <div className="flex h-1.5 border" style={{ width: w, borderColor: ink }}>
        <span className="h-full w-1/4" style={{ background: ink }} />
        <span className="h-full w-1/4" />
        <span className="h-full w-1/2" style={{ background: ink }} />
      </div>
    </div>
  );
}

/** Norte da prancha, girando conforme a câmera. */
function NorthArrow({ ink }: { ink: string }) {
  const heading = useExperience((s) => s.pose.heading);
  const deg = (heading * 180) / Math.PI;
  return (
    <div className="flex flex-col items-center gap-1" style={{ color: ink }} aria-hidden="true">
      <span className="text-[10px] font-semibold tracking-[0.2em]">N</span>
      <svg width="34" height="34" viewBox="-17 -17 34 34" style={{ transform: `rotate(${deg}deg)` }}>
        <circle r="15" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M 0 -12 L 6 8 L 0 4 L -6 8 Z" fill="currentColor" />
      </svg>
    </div>
  );
}

/**
 * Interface da prancha de apresentação: título de prancha, escolha do layout
 * (explodida, só térreo, só superior), separação entre pavimentos, fundo
 * claro/escuro e legendas, além de escala gráfica e norte.
 */
export function PresentationHUD() {
  const cut = useExperience((s) => s.cutLevel);
  const setCut = useExperience((s) => s.setCutLevel);
  const amount = useExperience((s) => s.explodeAmount);
  const setAmount = useExperience((s) => s.setExplodeAmount);
  const theme = useExperience((s) => s.boardTheme);
  const setTheme = useExperience((s) => s.setBoardTheme);
  const labels = useExperience((s) => s.boardLabels);
  const setLabels = useExperience((s) => s.setBoardLabels);
  const ink = theme === 'light' ? '#1b1c1f' : '#f3efe7';
  const layouts: { v: Level | null; label: string }[] = [
    { v: null, label: 'Explodida' },
    { v: 0, label: 'Térreo' },
    { v: 1, label: 'Superior' },
  ];
  return (
    <>
      {/* moldura e título de prancha */}
      <div className="pointer-events-none absolute inset-3 border sm:inset-5" style={{ borderColor: theme === 'light' ? 'rgba(27,28,31,0.35)' : 'rgba(243,239,231,0.18)' }} aria-hidden="true" />
      <motion.div className="pointer-events-none absolute left-1/2 top-[4.6rem] -translate-x-1/2 text-center sm:top-8" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ color: ink }}>
        <p className="hidden text-[10px] uppercase tracking-[0.34em] opacity-70 sm:block">Apresentação arquitetônica</p>
        <h2 className="mt-1 hidden font-display text-2xl font-light tracking-[0.3em] sm:block">MANSÃO INFINITY</h2>
      </motion.div>

      <BoardLabels />

      {/* controles */}
      <motion.div className="glass pointer-events-auto absolute bottom-[8.2rem] left-1/2 flex w-[calc(100%-1.5rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-x-4 gap-y-0 px-3 sm:bottom-auto sm:top-[6.6rem] sm:w-auto sm:max-w-[calc(100%-1.5rem)] sm:gap-x-5 sm:px-4 xl:flex-nowrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-4" role="radiogroup" aria-label="Layout da prancha">
          {layouts.map((o) => (
            <button key={String(o.v)} role="radio" aria-checked={cut === o.v} onClick={() => setCut(o.v)} className="tab">
              {o.label}
            </button>
          ))}
        </div>
        <label className={`flex min-h-[44px] items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-bone/70 ${cut === null ? '' : 'opacity-40'}`}>
          Separação
          <input type="range" min={3} max={16} step={0.5} value={amount} disabled={cut !== null} onChange={(e) => setAmount(+e.target.value)} className="w-24 accent-[#c8b08a]" aria-label="Separação entre pavimentos (metros)" />
          <span className="numeral w-10 text-[13px] text-bone/90">{amount.toFixed(1).replace('.', ',')} m</span>
        </label>
        <div className="flex items-center gap-4" role="radiogroup" aria-label="Fundo">
          <button role="radio" aria-checked={theme === 'light'} onClick={() => setTheme('light')} className="tab">
            Prancha
          </button>
          <button role="radio" aria-checked={theme === 'dark'} onClick={() => setTheme('dark')} className="tab">
            Estúdio
          </button>
        </div>
        <button aria-pressed={labels} onClick={() => setLabels(!labels)} className="tab">
          Legendas
        </button>
      </motion.div>

      {/* escala e norte */}
      <div className="pointer-events-none absolute bottom-40 left-6 hidden sm:block sm:left-10">
        <ScaleBar ink={ink} />
      </div>
      <div className="pointer-events-none absolute right-6 top-[4.6rem] sm:bottom-40 sm:right-10 sm:top-auto">
        <NorthArrow ink={ink} />
      </div>
    </>
  );
}
