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
    <motion.div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-3 sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
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
        className={`flex max-h-full w-full flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#111113]/95 shadow-2xl ${wide ? 'max-w-6xl' : 'max-w-lg'}`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 id={labelId} className="font-display text-2xl text-bone">
            {title}
          </h2>
          <button className="btn-icon -mr-2" onClick={onClose} aria-label="Fechar">
            <IconClose />
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
      <div className="flex flex-wrap items-center gap-3 px-5 pt-3">
        <div className="glass flex rounded-full p-1" role="tablist" aria-label="Pavimento">
          {([0, 1] as Level[]).map((lv) => (
            <button
              key={lv}
              role="tab"
              aria-selected={level === lv}
              onClick={() => setPlanLevel(lv)}
              className={`min-h-[40px] rounded-full px-4 text-sm font-medium transition-colors ${level === lv ? 'bg-bone text-ink' : 'text-bone/80 hover:text-bone'}`}
            >
              {LEVEL_NAMES[lv]}
            </button>
          ))}
        </div>
        <p className="text-xs text-bone/70">
          Área construída {fmtArea(builtArea())} · útil {fmtArea(usefulArea())} (descontadas as paredes) · clique num ambiente para ir até ele
        </p>
      </div>
      <div className="relative min-h-0 flex-1 p-3">
        <div className="h-[min(68vh,780px)] w-full">
          <FloorPlan level={level} onPick={() => setPlanOpen(false)} />
        </div>
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1 border-t border-white/10 px-5 py-3 text-xs text-bone/75" aria-label="Legenda">
        <li className="flex items-center gap-2"><span className="h-2 w-5 bg-[#ece6da]" /> Parede</li>
        <li className="flex items-center gap-2"><span className="h-2 w-5 border border-[#9fd8e2] bg-[#9fd8e2]/30" /> Vidro / janela</li>
        <li className="flex items-center gap-2"><span className="h-2 w-5 border-b-2 border-dashed border-gold" /> Abertura de porta</li>
        <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-gold" /> Você está aqui</li>
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
      <div className="space-y-6 px-5 py-5">
        <fieldset>
          <legend className="eyebrow mb-3">Qualidade gráfica</legend>
          <div className="grid grid-cols-5 gap-1.5">
            <button aria-pressed={auto} onClick={() => setQuality(quality, true)} className={`min-h-[44px] rounded-lg text-sm ${auto ? 'bg-bone text-ink' : 'bg-white/5 text-bone/85 hover:bg-white/10'}`}>
              Auto
            </button>
            {QUALITY_ORDER.map((q) => (
              <button key={q} aria-pressed={!auto && quality === q} onClick={() => setQuality(q, false)} className={`min-h-[44px] rounded-lg text-sm ${!auto && quality === q ? 'bg-bone text-ink' : 'bg-white/5 text-bone/85 hover:bg-white/10'}`}>
                {QUALITY[q].label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-bone/65">
            Atual: {QUALITY[quality].label}. No modo automático a resolução e os efeitos sobem ou descem conforme o desempenho do aparelho.
          </p>
        </fieldset>
        <label className="flex min-h-[44px] items-center justify-between gap-3 text-sm">
          Iluminação externa (jardim, fachada, piscina)
          <input type="checkbox" checked={ext} onChange={toggleExt} className="h-5 w-5 accent-[#c9b48a]" />
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
      <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 px-5 py-5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="font-semibold text-gold">{k}</dt>
            <dd className="text-bone/85">{v}</dd>
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="glass-strong pointer-events-auto mx-auto w-full max-w-2xl rounded-2xl px-5 py-4"
      role="region"
      aria-label="Visita guiada"
    >
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1" aria-live="polite">
          <p className="eyebrow">
            Visita guiada · {step + 1} de {TOUR.length}
          </p>
          <h2 className="mt-1 font-display text-2xl leading-tight text-bone sm:text-3xl">{s.title}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-bone/85">{s.text}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1">
        <button className="btn-icon" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} aria-label="Plano anterior">
          <IconPrev size={18} />
        </button>
        <button className="btn-icon" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pausar visita' : 'Continuar visita'}>
          {playing ? <IconPause size={18} /> : <IconPlay size={18} />}
        </button>
        <button className="btn-icon" onClick={() => setStep(Math.min(TOUR.length - 1, step + 1))} disabled={step === TOUR.length - 1} aria-label="Próximo plano">
          <IconNext size={18} />
        </button>
        <div className="mx-3 flex flex-1 gap-1" aria-hidden="true">
          {TOUR.map((_, i) => (
            <span key={i} className={`h-0.5 flex-1 rounded-full transition-colors duration-500 ${i <= step ? 'bg-gold' : 'bg-white/20'}`} />
          ))}
        </div>
        <button onClick={() => setMode('exterior')} className="min-h-[44px] rounded-full px-4 text-sm text-bone/85 hover:bg-white/10">
          Sair
        </button>
      </div>
    </motion.div>
  );
}
