import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TIME_ORDER } from '../config/lighting';
import { ROOMS, builtArea, type Level } from '../data/plan';
import { useShallow } from 'zustand/react/shallow';
import { useExperience, type ViewMode } from '../store/useExperience';
import { fmtArea } from '../utils/plan2d';
import { EnvironmentSelector } from './EnvironmentSelector';
import { RoomNavigation } from './RoomNavigation';
import { RoomInfoPanel } from './RoomInfoPanel';
import { HelpPanel, PlanPanel, SettingsPanel, TourPanel } from './Panels';
import { WalkHUD } from './WalkHUD';
import { IconArrowRight, IconBulb, IconCube, IconDoor, IconHelp, IconList, IconOrbit, IconPlan, IconPlay, IconSettings, IconTop, IconWalk } from './icons';

const MODES: { id: ViewMode; label: string; Icon: typeof IconOrbit; key: string }[] = [
  { id: 'exterior', label: 'Externa', Icon: IconOrbit, key: '1' },
  { id: 'interior', label: 'Interna', Icon: IconCube, key: '2' },
  { id: 'top', label: 'Superior', Icon: IconTop, key: '3' },
  { id: 'walk', label: 'Caminhar', Icon: IconWalk, key: '4' },
];

const ease = [0.22, 1, 0.36, 1] as const;

/** Tela inicial sobre a fachada em 3D. */
function IntroScreen() {
  const start = useExperience((s) => s.start);
  const setPlanOpen = useExperience((s) => s.setPlanOpen);
  const suites = ROOMS.filter((r) => /bed|master/.test(r.id) && !r.id.includes('Closet') && !r.id.includes('Bath')).length;
  return (
    <motion.section
      className="pointer-events-auto fixed inset-0 z-30 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/25 to-black/10 px-6 pb-10 sm:justify-center sm:px-14 sm:pb-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 1.2, delay: 0.3 } }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease } }}
      aria-labelledby="intro-title"
    >
      <motion.p className="eyebrow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.6, duration: 0.8, ease } }}>
        Residência contemporânea · vista para o mar
      </motion.p>
      <motion.h1
        id="intro-title"
        className="mt-3 font-display text-5xl font-light leading-[0.95] tracking-[0.14em] text-bone sm:text-7xl lg:text-8xl"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.75, duration: 1.1, ease } }}
      >
        MANSÃO
        <br />
        INFINITY
      </motion.h1>
      <motion.p className="mt-5 max-w-md font-display text-xl italic text-bone/90 sm:text-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 1.1, duration: 1 } }}>
        Uma nova dimensão de arquitetura e luxo.
      </motion.p>
      <motion.div className="mt-8 flex flex-col gap-3 sm:flex-row" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { delay: 1.3, duration: 0.8, ease } }}>
        <button onClick={() => start('exterior')} className="group flex min-h-[52px] items-center justify-center gap-3 rounded-full bg-bone px-7 text-sm font-semibold tracking-wide text-ink transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]">
          Explorar mansão <IconArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>
        <button
          onClick={() => {
            start('exterior');
            setPlanOpen(true);
          }}
          className="glass flex min-h-[52px] items-center justify-center gap-2 rounded-full px-7 text-sm font-medium text-bone transition-colors hover:bg-white/15"
        >
          <IconPlan size={18} /> Ver planta
        </button>
        <button onClick={() => start('tour')} className="glass flex min-h-[52px] items-center justify-center gap-2 rounded-full px-7 text-sm font-medium text-bone transition-colors hover:bg-white/15">
          <IconPlay size={16} /> Iniciar visita guiada
        </button>
      </motion.div>
      <motion.dl className="mt-8 grid max-w-xl grid-cols-2 gap-4 border-t border-white/15 pt-5 text-bone sm:mt-10 sm:grid-cols-4" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 1.6, duration: 1 } }}>
        {[
          [fmtArea(builtArea()).replace(' m²', ''), 'm² construídos'],
          [String(suites), 'suítes e quartos'],
          ['4', 'vagas cobertas'],
          ['20 m', 'borda infinita'],
        ].map(([v, k]) => (
          <div key={k}>
            <dd className="font-display text-2xl sm:text-3xl">{v}</dd>
            <dt className="text-[10px] uppercase tracking-[0.16em] text-bone/70">{k}</dt>
          </div>
        ))}
      </motion.dl>
    </motion.section>
  );
}

/** Corte por pavimento (vistas interna e superior). */
function LevelSwitch() {
  const cut = useExperience((s) => s.cutLevel);
  const setCut = useExperience((s) => s.setCutLevel);
  const opts: { v: Level | null; label: string }[] = [
    { v: 0, label: 'Térreo' },
    { v: 1, label: 'Superior' },
    { v: null, label: 'Completa' },
  ];
  return (
    <div className="glass flex rounded-full p-1" role="radiogroup" aria-label="Corte por pavimento">
      {opts.map((o) => (
        <button key={String(o.v)} role="radio" aria-checked={cut === o.v} onClick={() => setCut(o.v)} className={`min-h-[40px] rounded-full px-3 text-xs font-medium transition-colors ${cut === o.v ? 'bg-bone text-ink' : 'text-bone/80 hover:text-bone'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Véu escuro usado nos cortes de câmera da visita guiada. */
function FadeVeil() {
  const fade = useExperience((s) => s.fade);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!fade) return;
    setOn(true);
    const id = window.setTimeout(() => setOn(false), 520);
    return () => window.clearTimeout(id);
  }, [fade]);
  return <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-10 bg-black transition-opacity duration-300" style={{ opacity: on ? 1 : 0 }} />;
}

/** Camada de interface sobre o canvas 3D. */
export function UIOverlay({ ready }: { ready: boolean }) {
  // sem a pose da câmera: a interface não re-renderiza a cada movimento
  const st = useExperience(
    useShallow((s) => ({
      started: s.started,
      mode: s.mode,
      planOpen: s.planOpen,
      settingsOpen: s.settingsOpen,
      helpOpen: s.helpOpen,
      selectedRoom: s.selectedRoom,
      lights: s.lights,
      doors: s.doors,
      toast: s.toast,
      setMode: s.setMode,
      setPlanOpen: s.setPlanOpen,
      setAllLights: s.setAllLights,
      setAllDoors: s.setAllDoors,
      setSettingsOpen: s.setSettingsOpen,
      setHelpOpen: s.setHelpOpen,
    })),
  );
  const [listOpen, setListOpen] = useState(false);
  const anyLight = Object.values(st.lights).some(Boolean);
  const anyOpen = Object.values(st.doors).some(Boolean);

  // atalhos de teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useExperience.getState();
      if (!s.started || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement)?.closest('input, textarea, [role="dialog"]')) return;
      const k = e.key.toLowerCase();
      const mode = MODES.find((m) => m.key === k);
      if (mode) s.setMode(mode.id);
      else if (k === 'p') s.setPlanOpen(!s.planOpen);
      else if (k === 't') s.setMode(s.mode === 'tour' ? 'exterior' : 'tour');
      else if (k === 'l') s.setAllLights(!Object.values(s.lights).some(Boolean));
      else if (k === 'o' && s.mode !== 'walk') s.setAllDoors(!Object.values(s.doors).some(Boolean));
      else if (k === 'n') s.setTime(TIME_ORDER[(TIME_ORDER.indexOf(s.time) + 1) % TIME_ORDER.length]);
      else if (k === 'escape' && s.mode !== 'walk') s.selectRoom(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // toast
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!st.toast) return;
    setToast(st.toast.text);
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [st.toast]);

  if (!ready) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-20 select-none" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <FadeVeil />
      <AnimatePresence>{!st.started && <IntroScreen key="intro" />}</AnimatePresence>

      {st.started && (
        <>
          {/* barra superior */}
          <header className="pointer-events-auto flex items-start justify-between gap-2 p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setListOpen((v) => !v)}
                aria-expanded={listOpen}
                aria-label="Lista de ambientes"
                className="glass btn-icon"
              >
                <IconList />
              </button>
              <div className="hidden leading-tight md:block">
                <p className="font-display text-xl tracking-[0.2em] text-bone">MANSÃO INFINITY</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-bone/65">Experiência arquitetônica</p>
              </div>
            </div>

            <nav className="glass hidden rounded-full p-1 sm:flex" aria-label="Modo de visualização">
              {MODES.map(({ id, label, Icon, key }) => {
                const active = st.mode === id;
                return (
                  <button
                    key={id}
                    onClick={() => st.setMode(id)}
                    aria-pressed={active}
                    title={`${label} (${key})`}
                    className={`flex min-h-[40px] items-center gap-2 rounded-full px-3.5 text-sm font-medium transition-colors duration-200 ${active ? 'bg-bone text-ink' : 'text-bone/80 hover:text-bone'}`}
                  >
                    <Icon size={17} />
                    <span className="hidden md:inline">{label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <EnvironmentSelector />
              </div>
              <div className="glass flex flex-col rounded-full p-1 sm:flex-row">
                <button className="btn-icon" aria-label="Planta baixa (P)" title="Planta baixa (P)" aria-pressed={st.planOpen} onClick={() => st.setPlanOpen(true)}>
                  <IconPlan />
                </button>
                <button className="btn-icon" aria-label={anyLight ? 'Apagar todas as luzes (L)' : 'Acender todas as luzes (L)'} title="Luzes (L)" aria-pressed={anyLight} onClick={() => st.setAllLights(!anyLight)}>
                  <IconBulb />
                </button>
                <button className="btn-icon" aria-label={anyOpen ? 'Fechar portas e portões (O)' : 'Abrir portas e portões (O)'} title="Portas (O)" aria-pressed={anyOpen} onClick={() => st.setAllDoors(!anyOpen)}>
                  <IconDoor />
                </button>
                <button className="btn-icon" aria-label="Visita guiada (T)" title="Visita guiada (T)" aria-pressed={st.mode === 'tour'} onClick={() => st.setMode(st.mode === 'tour' ? 'exterior' : 'tour')}>
                  <IconPlay size={18} />
                </button>
                <button className="btn-icon" aria-label="Ajustes" title="Ajustes" onClick={() => st.setSettingsOpen(true)}>
                  <IconSettings />
                </button>
                <button className="btn-icon" aria-label="Ajuda" title="Ajuda" onClick={() => st.setHelpOpen(true)}>
                  <IconHelp />
                </button>
              </div>
            </div>
          </header>

          {(st.mode === 'interior' || st.mode === 'top') && (
            <div className="pointer-events-auto absolute left-1/2 top-[4.6rem] -translate-x-1/2 sm:top-20">
              <LevelSwitch />
            </div>
          )}

          {/* painéis laterais */}
          <div className="pointer-events-none absolute bottom-24 left-3 top-20 flex w-[calc(100%-1.5rem)] flex-col sm:bottom-6 sm:left-4 sm:w-auto">
            <AnimatePresence>
              {listOpen && (
                <motion.div className="pointer-events-auto max-h-full min-h-0" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3, ease }}>
                  <RoomNavigation onClose={() => setListOpen(false)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="pointer-events-none absolute bottom-20 right-3 top-auto flex max-h-[58vh] w-[calc(100%-1.5rem)] flex-col items-end justify-end sm:bottom-6 sm:right-4 sm:top-20 sm:max-h-none sm:w-auto sm:justify-start">
            <AnimatePresence>{st.selectedRoom && st.mode !== 'tour' && st.mode !== 'walk' && <RoomInfoPanel key="info" />}</AnimatePresence>
          </div>

          {/* barra inferior no celular: modos e horário */}
          <div className="pointer-events-auto absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 sm:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {st.mode !== 'walk' && st.mode !== 'tour' && (
              <>
                <nav className="glass flex rounded-full p-1" aria-label="Modo de visualização">
                  {MODES.map(({ id, label, Icon }) => (
                    <button key={id} onClick={() => st.setMode(id)} aria-pressed={st.mode === id} aria-label={label} className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full ${st.mode === id ? 'bg-bone text-ink' : 'text-bone/85'}`}>
                      <Icon size={19} />
                    </button>
                  ))}
                </nav>
                <EnvironmentSelector compact />
              </>
            )}
          </div>

          {st.mode === 'walk' && (
            <>
              <WalkHUD />
              <button onClick={() => st.setMode('exterior')} className="glass pointer-events-auto absolute left-3 top-[4.2rem] min-h-[44px] rounded-full px-4 text-sm text-bone sm:left-auto sm:right-4 sm:top-20">
                Sair da caminhada
              </button>
            </>
          )}

          <div className="pointer-events-none absolute inset-x-3 bottom-3 sm:bottom-6">
            <AnimatePresence>{st.mode === 'tour' && <TourPanel key="tour" />}</AnimatePresence>
          </div>

          <AnimatePresence>
            {toast && (
              <motion.div key="toast" role="status" className="glass absolute left-1/2 top-24 -translate-x-1/2 rounded-full px-4 py-2 text-sm text-bone" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {toast}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <AnimatePresence>
        {st.planOpen && <PlanPanel key="plan" />}
        {st.settingsOpen && <SettingsPanel key="settings" />}
        {st.helpOpen && <HelpPanel key="help" />}
      </AnimatePresence>
    </div>
  );
}
