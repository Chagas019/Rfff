import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useShallow } from 'zustand/react/shallow';
import { TIME_ORDER } from '../config/lighting';
import { ROOMS, builtArea, LEVEL_NAMES, type Level } from '../data/plan';
import { useExperience, type ViewMode } from '../store/useExperience';
import { fmtArea } from '../utils/plan2d';
import { EnvironmentSelector } from './EnvironmentSelector';
import { RoomNavigation } from './RoomNavigation';
import { RoomInfoPanel } from './RoomInfoPanel';
import { HelpPanel, PlanPanel, SettingsPanel, TourPanel } from './Panels';
import { WalkHUD } from './WalkHUD';
import { PresentationHUD } from './PresentationHUD';
import { Monogram, Wordmark } from './brand';
import { IconArrowRight, IconBulb, IconDoor, IconHelp, IconLayers, IconList, IconPlan, IconPlay, IconSettings } from './icons';

const MODES: { id: ViewMode; label: string; key: string }[] = [
  { id: 'exterior', label: 'Externa', key: '1' },
  { id: 'interior', label: 'Interna', key: '2' },
  { id: 'top', label: 'Superior', key: '3' },
  { id: 'walk', label: 'Caminhar', key: '4' },
  { id: 'explode', label: 'Apresentação', key: '5' },
];

const ease = [0.22, 1, 0.36, 1] as const;
const rise = (delay: number) => ({ initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0, transition: { delay, duration: 1.1, ease } } });

/** Tela inicial em formato cinematográfico sobre a fachada em 3D. */
function IntroScreen() {
  const start = useExperience((s) => s.start);
  const setPlanOpen = useExperience((s) => s.setPlanOpen);
  const suites = ROOMS.filter((r) => /bed|master/.test(r.id) && !r.id.includes('Closet') && !r.id.includes('Bath')).length;
  return (
    <motion.section
      className="pointer-events-auto fixed inset-0 z-30 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 1.4, delay: 0.2 } }}
      exit={{ opacity: 0, transition: { duration: 0.9, ease } }}
      aria-labelledby="intro-title"
    >
      {/* faixas de cinema e gradientes de leitura */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 to-transparent" />
      <motion.div className="absolute inset-x-0 top-0 h-[5vh] bg-black" initial={{ scaleY: 0 }} animate={{ scaleY: 1, transition: { duration: 1.2, ease } }} style={{ transformOrigin: 'top' }} />
      <motion.div className="absolute inset-x-0 bottom-0 h-[5vh] bg-black" initial={{ scaleY: 0 }} animate={{ scaleY: 1, transition: { duration: 1.2, ease } }} style={{ transformOrigin: 'bottom' }} />

      <header className="relative flex items-center justify-between px-6 pt-[calc(5vh+1.25rem)] sm:px-14">
        <motion.div {...rise(0.4)}>
          <Wordmark />
        </motion.div>
        <motion.p className="eyebrow hidden sm:block" {...rise(0.5)}>
          Experiência arquitetônica 3D
        </motion.p>
      </header>

      <div className="relative mt-auto px-6 pb-[calc(5vh+2rem)] sm:px-14 sm:pb-[calc(5vh+3.5rem)]">
        <motion.p className="eyebrow flex items-center gap-4" {...rise(0.7)}>
          <span className="h-px w-10 bg-gold" aria-hidden="true" />
          Residência contemporânea · vista para o mar
        </motion.p>
        <motion.h1 id="intro-title" className="mt-5 font-display text-[3.4rem] font-light leading-[0.92] tracking-[0.16em] text-bone sm:text-8xl lg:text-[8.5rem]" {...rise(0.85)}>
          MANSÃO
          <br />
          INFINITY
        </motion.h1>
        <motion.p className="mt-6 max-w-md font-display text-xl font-light italic text-bone/85 sm:text-2xl" {...rise(1.05)}>
          Uma nova dimensão de arquitetura e luxo.
        </motion.p>
        <motion.div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-9" {...rise(1.2)}>
          <button onClick={() => start('exterior')} className="btn-primary group">
            Explorar mansão <IconArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </button>
          <button
            onClick={() => {
              start('exterior');
              setPlanOpen(true);
            }}
            className="btn-line"
          >
            <IconPlan size={16} /> Ver planta
          </button>
          <button onClick={() => start('tour')} className="btn-line">
            <IconPlay size={14} /> Iniciar visita guiada
          </button>
          <button onClick={() => start('explode')} className="btn-line">
            <IconLayers size={15} /> Prancha de apresentação
          </button>
        </motion.div>
        <motion.dl className="mt-12 grid max-w-2xl grid-cols-2 border-t border-white/12 sm:grid-cols-4" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 1.5, duration: 1.2 } }}>
          {[
            [fmtArea(builtArea()).replace(' m²', ''), 'm² construídos'],
            [String(suites).padStart(2, '0'), 'suítes e quartos'],
            ['04', 'vagas cobertas'],
            ['20 m', 'borda infinita'],
          ].map(([v, k], i) => (
            <div key={k} className={`flex flex-col-reverse gap-1 pt-4 ${i % 2 ? 'pl-5' : 'pr-5'} ${i > 0 ? 'sm:border-l sm:border-white/12 sm:pl-5' : ''}`}>
              <dt className="text-[10px] uppercase tracking-[0.26em] text-bone/55">{k}</dt>
              <dd className="numeral text-3xl font-light text-bone sm:text-[2.1rem]">{v}</dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </motion.section>
  );
}

/** Corte por pavimento (vistas interna e superior), em abas tipográficas. */
function LevelSwitch() {
  const cut = useExperience((s) => s.cutLevel);
  const setCut = useExperience((s) => s.setCutLevel);
  const opts: { v: Level | null; label: string }[] = [
    { v: 0, label: 'Térreo' },
    { v: 1, label: 'Superior' },
    { v: null, label: 'Completa' },
  ];
  return (
    <div className="glass flex items-center gap-5 px-5" role="radiogroup" aria-label="Corte por pavimento">
      <span className="eyebrow hidden text-[10px] sm:inline">Corte</span>
      {opts.map((o) => (
        <button key={String(o.v)} role="radio" aria-checked={cut === o.v} onClick={() => setCut(o.v)} className="tab">
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Leitura discreta da posição: pavimento e rumo da câmera. */
function Readout() {
  const pose = useExperience((s) => s.pose);
  const deg = Math.round(((((-pose.heading * 180) / Math.PI) % 360) + 360) % 360);
  const dirs = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
  return (
    <p className="numeral hidden text-[13px] tracking-[0.18em] text-bone/60 lg:block" aria-hidden="true">
      {dirs[Math.round(deg / 45) % 8]} {String(deg).padStart(3, '0')}° · {LEVEL_NAMES[pose.level]}
    </p>
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
  const tour = st.mode === 'tour';

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

  // aviso temporário
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!st.toast) return;
    setToast(st.toast.text);
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [st.toast]);

  if (!ready) return null;

  const actions = [
    { label: 'Planta baixa (P)', Icon: IconPlan, pressed: st.planOpen, on: () => st.setPlanOpen(true) },
    { label: anyLight ? 'Apagar todas as luzes (L)' : 'Acender todas as luzes (L)', Icon: IconBulb, pressed: anyLight, on: () => st.setAllLights(!anyLight) },
    { label: anyOpen ? 'Fechar portas e portões (O)' : 'Abrir portas e portões (O)', Icon: IconDoor, pressed: anyOpen, on: () => st.setAllDoors(!anyOpen) },
    { label: 'Visita guiada (T)', Icon: IconPlay, pressed: tour, on: () => st.setMode(tour ? 'exterior' : 'tour') },
    { label: 'Ajustes', Icon: IconSettings, pressed: st.settingsOpen, on: () => st.setSettingsOpen(true) },
    { label: 'Ajuda', Icon: IconHelp, pressed: st.helpOpen, on: () => st.setHelpOpen(true) },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-20 select-none" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <FadeVeil />
      <AnimatePresence>{!st.started && <IntroScreen key="intro" />}</AnimatePresence>

      {st.started && (
        <>
          {/* gradientes de leitura no topo e na base */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/45 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/50 to-transparent" />

          {/* faixas de cinema durante a visita guiada */}
          <AnimatePresence>
            {tour && (
              <>
                <motion.div key="lb-t" className="absolute inset-x-0 top-0 z-0 h-[7vh] bg-black" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} exit={{ scaleY: 0 }} transition={{ duration: 0.8, ease }} style={{ transformOrigin: 'top' }} />
                <motion.div key="lb-b" className="absolute inset-x-0 bottom-0 z-0 h-[7vh] bg-black" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} exit={{ scaleY: 0 }} transition={{ duration: 0.8, ease }} style={{ transformOrigin: 'bottom' }} />
              </>
            )}
          </AnimatePresence>

          {/* barra superior */}
          <header className="pointer-events-auto relative flex items-start justify-between gap-2 p-3 sm:p-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setListOpen((v) => !v)} aria-expanded={listOpen} aria-label="Índice de ambientes" className="glass btn-icon">
                <IconList size={18} />
              </button>
              <div className="hidden sm:block">
                <Wordmark compact />
              </div>
              <div className="sm:hidden">
                <Monogram size={36} />
              </div>
            </div>

            <div className="glass flex divide-x divide-white/10">
              {actions.map(({ label, Icon, pressed, on }) => (
                <button key={label} className="btn-icon" aria-label={label} title={label} aria-pressed={pressed} onClick={on}>
                  <Icon size={18} />
                </button>
              ))}
            </div>
          </header>

          {(st.mode === 'interior' || st.mode === 'top') && (
            <div className="pointer-events-auto absolute left-1/2 top-[4.4rem] -translate-x-1/2 sm:top-24">
              <LevelSwitch />
            </div>
          )}

          {/* índice de ambientes */}
          <div className="pointer-events-none absolute bottom-28 left-3 top-[4.4rem] flex w-[calc(100%-1.5rem)] flex-col sm:bottom-28 sm:left-6 sm:top-24 sm:w-auto">
            <AnimatePresence>
              {listOpen && (
                <motion.div className="pointer-events-auto max-h-full min-h-0" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.4, ease }}>
                  <RoomNavigation onClose={() => setListOpen(false)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ficha do ambiente */}
          <div className="pointer-events-none absolute bottom-24 right-3 flex max-h-[58vh] w-[calc(100%-1.5rem)] flex-col items-end justify-end sm:bottom-28 sm:right-6 sm:top-24 sm:max-h-none sm:w-auto sm:justify-start">
            <AnimatePresence>{st.selectedRoom && !tour && st.mode !== 'walk' && <RoomInfoPanel key="info" />}</AnimatePresence>
          </div>

          {/* base: modos de visualização, leitura e horário */}
          {!tour && (
            <div className="pointer-events-auto absolute inset-x-3 bottom-3 flex flex-col gap-2 sm:inset-x-6 sm:bottom-6 sm:flex-row sm:items-end sm:justify-between" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
              {st.mode !== 'walk' ? (
                <nav className="glass scroll-thin flex justify-between overflow-x-auto px-3 sm:justify-start sm:gap-7 sm:px-6" aria-label="Modo de visualização">
                  {MODES.map(({ id, label, key }) => (
                    <button key={id} onClick={() => st.setMode(id)} aria-pressed={st.mode === id} title={`${label} (${key})`} className="tab flex items-center gap-2 px-1">
                      <span className="numeral text-[13px] tracking-normal text-gold">0{key}</span>
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </nav>
              ) : (
                <button onClick={() => st.setMode('exterior')} className="glass btn-line self-start px-5">
                  Sair da caminhada
                </button>
              )}
              <div className="flex items-center justify-between gap-6">
                {st.mode !== 'explode' && <Readout />}
                <EnvironmentSelector />
              </div>
            </div>
          )}

          {st.mode === 'walk' && <WalkHUD />}
          {st.mode === 'explode' && <PresentationHUD />}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1]">
            <AnimatePresence>{tour && <TourPanel key="tour" />}</AnimatePresence>
          </div>

          <AnimatePresence>
            {toast && (
              <motion.div key="toast" role="status" className="glass absolute left-1/2 top-24 -translate-x-1/2 px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-bone" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
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
