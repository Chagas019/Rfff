import { useProgress } from '@react-three/drei';
import { AREAS } from '../data/plan';
import { useStore, type Light, type View } from '../store';

const VIEWS: { v: View; label: string }[] = [
  { v: 'aerea', label: 'Aérea' },
  { v: 'corte', label: 'Corte' },
  { v: 'interior', label: 'Interior' },
];

const LIGHTS: { v: Light; label: string }[] = [
  { v: 'tarde', label: 'Tarde' },
  { v: 'noite', label: 'Noite' },
];

function Loader() {
  const { active, progress } = useProgress();
  if (!active && progress >= 100) return null;
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-ink" role="status" aria-live="polite">
      <p className="eyebrow">Carregando</p>
      <p className="mt-3 font-display text-4xl font-light tracking-[0.2em]">CASA OCTÓGONO</p>
      <div className="mt-6 h-px w-48 bg-white/15">
        <div className="h-px bg-sand transition-[width] duration-300" style={{ width: `${Math.round(progress)}%` }} />
      </div>
    </div>
  );
}

export function Overlay() {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const light = useStore((s) => s.light);
  const setLight = useStore((s) => s.setLight);
  const labels = useStore((s) => s.labels);
  const setLabels = useStore((s) => s.setLabels);
  const board = view === 'corte' && light === 'tarde';
  const ink = board ? 'text-ink' : 'text-bone';
  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      <Loader />
      <header className={`absolute left-4 top-4 sm:left-8 sm:top-7 ${ink}`}>
        <p className={`eyebrow ${board ? '!text-ink/70' : ''}`}>Refúgio em pedra · na mata</p>
        <h1 className="mt-1 font-display text-3xl font-light tracking-[0.18em] sm:text-4xl">CASA OCTÓGONO</h1>
        <p className={`mt-2 hidden text-xs tracking-[0.12em] sm:block ${board ? 'text-ink/70' : 'text-bone/70'}`}>
          {Math.round(AREAS.footprint)} m² · 3 suítes · claraboia · sala rebaixada com lareira
        </p>
      </header>

      <nav className="panel pointer-events-auto absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center" aria-label="Vistas">
        {VIEWS.map((o) => (
          <button key={o.v} className="seg" aria-pressed={view === o.v} onClick={() => setView(o.v)}>
            {o.label}
          </button>
        ))}
      </nav>

      <div className="panel pointer-events-auto absolute right-4 top-4 flex items-center sm:right-8 sm:top-7" role="group" aria-label="Iluminação">
        {LIGHTS.map((o) => (
          <button key={o.v} className="seg" aria-pressed={light === o.v} onClick={() => setLight(o.v)}>
            {o.label}
          </button>
        ))}
        {view === 'corte' && (
          <button className="seg border-l border-white/10" aria-pressed={labels} onClick={() => setLabels(!labels)}>
            Legendas
          </button>
        )}
      </div>

      <p className={`absolute bottom-[4.6rem] left-1/2 hidden -translate-x-1/2 text-[11px] tracking-[0.14em] sm:block ${board ? 'text-ink/60' : 'text-bone/60'}`}>
        Arraste para girar · role para aproximar · botão direito para mover
      </p>
    </div>
  );
}
