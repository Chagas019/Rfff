import { ROOMS, LEVEL_NAMES, rectArea, type Room } from '../data/plan';
import { useExperience } from '../store/useExperience';
import { fmtArea } from '../utils/plan2d';
import { IconClose } from './icons';

const GROUPS: { title: string; filter: (r: Room) => boolean }[] = [
  { title: LEVEL_NAMES[0], filter: (r) => r.level === 0 && !r.outdoor },
  { title: LEVEL_NAMES[1], filter: (r) => r.level === 1 && !r.outdoor },
  { title: 'Áreas externas', filter: (r) => !!r.outdoor },
];

/** Lista de ambientes agrupada por pavimento — clique leva a câmera até o cômodo. */
export function RoomNavigation({ onClose }: { onClose: () => void }) {
  const selected = useExperience((s) => s.selectedRoom);
  const focusRoom = useExperience((s) => s.focusRoom);
  const hoverRoom = useExperience((s) => s.hoverRoom);
  return (
    <nav className="glass-strong flex max-h-full w-full flex-col overflow-hidden rounded-2xl sm:w-72" aria-label="Ambientes da mansão">
      <div className="flex items-center justify-between px-5 pb-2 pt-4">
        <p className="eyebrow">Ambientes</p>
        <button className="btn-icon -mr-2" onClick={onClose} aria-label="Fechar lista de ambientes">
          <IconClose size={18} />
        </button>
      </div>
      <div className="scroll-thin overflow-y-auto px-2 pb-3">
        {GROUPS.map((g) => (
          <section key={g.title} className="mb-2">
            <h3 className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">{g.title}</h3>
            <ul>
              {ROOMS.filter(g.filter).map((rm) => (
                <li key={rm.id}>
                  <button
                    onClick={() => focusRoom(rm.id)}
                    onMouseEnter={() => hoverRoom(rm.id)}
                    onMouseLeave={() => hoverRoom(null)}
                    aria-current={selected === rm.id ? 'true' : undefined}
                    className={`flex min-h-[40px] w-full items-center justify-between rounded-lg px-3 text-left text-sm transition-colors duration-200 ${selected === rm.id ? 'bg-bone text-ink' : 'text-bone/90 hover:bg-white/10'}`}
                  >
                    <span>{rm.name}</span>
                    <span className={`text-xs tabular-nums ${selected === rm.id ? 'text-ink/70' : 'text-bone/60'}`}>{fmtArea(rectArea(rm.rect))}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  );
}
