import { useEffect, useRef, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { LEVEL_NAMES, builtArea, usefulArea, type Level } from '../data/plan';
import { QUALITY, QUALITY_ORDER } from '../config/quality';
import { TOUR } from '../data/tour';
import { useExperience } from '../store/useExperience';
import { FloorPlan } from './FloorPlan';
import { IconClose, IconNext, IconPause, IconPlay, IconPrev } from './icons';
import { fmtArea } from '../utils/plan2d';

/** Diálogo modal com foco preso, Esc para fechar e devolução do foco. */
export function Dialog({ title, onClose, children, wide = false, labelId }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; labelId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    el?.querySelector<HTMLElement>('button, [tabindex="0"]')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
      if (e.key === 'Tab' && el) {
        const f = [...el.querySelectorAll<HTMLElement>('button, [href], [tabindex="0"]')].filter((x) => !x.hasAttribute('disabled'));
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <motion.div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-3 backdrop-blur-[2px] sm:p-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        initial={{ opacity: 0, y: 16, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-full w-full flex-col overflow-hidden border border-white/10 bg-[#0e0e0f]/[0.97] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] ${wide ? 'max-w-6xl' : 'max-w-lg'}`}
      >
        <div className="flex items-center justify-between border-b border-white/10 py-2 pl-7 pr-2">
          <h2 id={labelId} className="font-display text-[1.7rem] font-light tracking-wide text-bone">
            {title}
          </h2>
          <button className="btn-icon" onClick={onClose} aria-label="Fechar">
            <IconClose size={18} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

/** Planta baixa interativa em tela cheia, com abas por pavimento e legenda. */
export function PlanPanel() {
  const setPlanOpen = useExperience((s) => s.setPlanOpen);
  const level = useExperience((s) => s.planLevel);
  const setPlanLevel = useExperience((s) => s.setPlanLevel);
  return (
    <Dialog title="Planta baixa" onClose={() => setPlanOpen(false)} wide labelId="plan-title">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 px-7 pt-3">
        <div className="flex gap-6" role="tablist" aria-label="Pavimento">
          {([0, 1] as Level[]).map((lv) => (
            <button
              key={lv}
              role="tab"
              aria-selected={level === lv}
              onClick={() => setPlanLevel(lv)}
              className="tab"
            >
              {LEVEL_NAMES[lv]}
            </button>
          ))}
        </div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-bone/55">
          Área construída {fmtArea(builtArea())} · útil {fmtArea(usefulArea())} (descontadas as paredes) · clique num ambiente para ir até ele
        </p>
      </div>
      <div className="relative min-h-0 flex-1 p-3">
        <div className="h-[min(68vh,780px)] w-full">
          <FloorPlan level={level} onPick={() => setPlanOpen(false)} />
        </div>
      </div>
      <ul className="flex flex-wrap gap-x-7 gap-y-1 border-t border-white/10 px-7 py-3.5 text-[10.5px] uppercase tracking-[0.18em] text-bone/60" aria-label="Legenda">
        <li className="flex items-center gap-2"><span className="h-2 w-5 bg-[#ece6da]" /> Parede</li>
        <li className="flex items-center gap-2"><span className="h-2 w-5 border border-[#9fd8e2] bg-[#9fd8e2]/30" /> Vidro / janela</li>
        <li className="flex items-center gap-2"><span className="h-2 w-5 border-b-2 border-dashed border-gold" /> Abertura de porta</li>
        <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-gold" /> Você está aqui</li>
      </ul>
    </Dialog>
  );
}

/** Qualidade gráfica e preferências. */
export function SettingsPanel() {
  const setOpen = useExperience((s) => s.setSettingsOpen);
  const quality = useExperience((s) => s.quality);
  const auto = useExperience((s) => s.qualityAuto);
  const setQuality = useExperience((s) => s.setQuality);
  const ext = useExperience((s) => s.exteriorLights);
  const toggleExt = useExperience((s) => s.toggleExteriorLights);
  return (
    <Dialog title="Ajustes" onClose={() => setOpen(false)} labelId="settings-title">
      <div className="space-y-7 px-7 py-6">
        <fieldset>
          <legend className="eyebrow mb-3">Qualidade gráfica</legend>
          <div className="grid grid-cols-5 gap-2">
            <button aria-pressed={auto} onClick={() => setQuality(quality, true)} className={`min-h-[44px] border text-[11px] uppercase tracking-[0.16em] transition-colors ${auto ? 'border-gold text-bone' : 'border-white/10 text-bone/65 hover:text-bone'}`}>
              Auto
            </button>
            {QUALITY_ORDER.map((q) => (
              <button key={q} aria-pressed={!auto && quality === q} onClick={() => setQuality(q, false)} className={`min-h-[44px] border text-[11px] uppercase tracking-[0.16em] transition-colors ${!auto && quality === q ? 'border-gold text-bone' : 'border-white/10 text-bone/65 hover:text-bone'}`}>
                {QUALITY[q].label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs font-light leading-relaxed text-bone/60">
            Atual: {QUALITY[quality].label}. No modo automático a resolução e os efeitos sobem ou descem conforme o desempenho do aparelho.
          </p>
        </fieldset>
        <label className="flex min-h-[44px] items-center justify-between gap-3 border-t border-white/10 pt-5 text-sm font-light text-bone/85">
          Iluminação externa (jardim, fachada, piscina)
          <input type="checkbox" checked={ext} onChange={toggleExt} className="h-5 w-5 accent-[#c8b08a]" />
        </label>
      </div>
    </Dialog>
  );
}

/** Ajuda: controles de cada modo e atalhos de teclado. */
export function HelpPanel() {
  const setOpen = useExperience((s) => s.setHelpOpen);
  const rows: [string, string][] = [
    ['Arrastar', 'Girar a câmera 360°'],
    ['Roda / pinça', 'Aproximar e afastar'],
    ['Botão direito / dois dedos', 'Deslocar a câmera'],
    ['Clique no piso (corte)', 'Abrir o ambiente'],
    ['Clique numa porta', 'Abrir / fechar'],
    ['W A S D / setas', 'Caminhar (modo caminhada)'],
    ['Shift', 'Andar mais rápido'],
    ['E', 'Porta ou elevador mais próximo'],
    ['1 · 2 · 3 · 4', 'Externa · Interna · Superior · Caminhar'],
    ['P · T · L · O · N', 'Planta · Visita · Luzes · Portas · Horário'],
    ['Esc', 'Fechar painéis / soltar o mouse'],
  ];
  return (
    <Dialog title="Como explorar" onClose={() => setOpen(false)} labelId="help-title">
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 px-7 py-5 text-[13px]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="border-b border-white/[0.07] py-2.5 text-[11px] uppercase tracking-[0.16em] text-gold">{k}</dt>
            <dd className="border-b border-white/[0.07] py-2.5 font-light text-bone/85">{v}</dd>
          </div>
        ))}
      </dl>
    </Dialog>
  );
}

/** Legenda e controles da visita guiada. */
export function TourPanel() {
  const step = useExperience((s) => s.tourStep);
  const playing = useExperience((s) => s.tourPlaying);
  const setStep = useExperience((s) => s.setTourStep);
  const setPlaying = useExperience((s) => s.setTourPlaying);
  const setMode = useExperience((s) => s.setMode);
  const s = TOUR[step];
  if (!s) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-auto relative mx-auto w-full max-w-5xl px-5 pb-[calc(7vh+1rem)] pt-16 sm:px-10"
      role="region"
      aria-label="Visita guiada"
    >
      <div className="pointer-events-none absolute inset-x-[-50vw] bottom-0 top-0 -z-10 bg-gradient-to-t from-black/80 via-black/45 to-transparent" aria-hidden="true" />
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end" aria-live="polite">
        <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
          <p className="eyebrow flex items-center gap-4">
            <span className="numeral text-[15px] tracking-normal text-gold">
              {String(step + 1).padStart(2, '0')} <span className="text-bone/40">/ {String(TOUR.length).padStart(2, '0')}</span>
            </span>
            Visita guiada
          </p>
          <h2 className="mt-2 font-display text-3xl font-light leading-tight text-bone drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] sm:text-5xl">{s.title}</h2>
          <p className="mt-2 max-w-2xl text-sm font-light leading-relaxed text-bone/85 drop-shadow-[0_1px_8px_rgba(0,0,0,0.7)]">{s.text}</p>
        </motion.div>
        <div className="glass flex items-center divide-x divide-white/10 self-start sm:self-end">
          <button className="btn-icon" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} aria-label="Plano anterior">
            <IconPrev size={16} />
          </button>
          <button className="btn-icon" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pausar visita' : 'Continuar visita'}>
            {playing ? <IconPause size={16} /> : <IconPlay size={16} />}
          </button>
          <button className="btn-icon" onClick={() => setStep(Math.min(TOUR.length - 1, step + 1))} disabled={step === TOUR.length - 1} aria-label="Próximo plano">
            <IconNext size={16} />
          </button>
          <button onClick={() => setMode('exterior')} className="min-h-[44px] px-5 text-[11px] uppercase tracking-[0.2em] text-bone/80 hover:text-bone">
            Sair
          </button>
        </div>
      </div>
      <div className="mt-5 flex gap-1.5" aria-hidden="true">
        {TOUR.map((_, i) => (
          <span key={i} className={`h-px flex-1 transition-colors duration-700 ${i <= step ? 'bg-gold' : 'bg-white/20'}`} />
        ))}
      </div>
    </motion.div>
  );
}
