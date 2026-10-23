import { ROOMS, LEVEL_NAMES, rectArea, type Room } from '../data/plan';
import { useExperience } from '../store/useExperience';
import { fmtArea } from '../utils/plan2d';
import { IconClose } from './icons';

const GROUPS: { title: string; filter: (r: Room) => boolean }[] = [
  { title: LEVEL_NAMES[0], filter: (r) => r.level === 0 && !r.outdoor },
  { title: LEVEL_NAMES[1], filter: (r) => r.level === 1 && !r.outdoor },
  { title: 'Áreas externas', filter: (r) => !!r.outdoor },
];

/** Índice dos ambientes, numerado como um caderno de projeto — clique leva a câmera ao cômodo. */
export function RoomNavigation({ onClose }: { onClose: () => void }) {
  const selected = useExperience((s) => s.selectedRoom);
  const focusRoom = useExperience((s) => s.focusRoom);
  const hoverRoom = useExperience((s) => s.hoverRoom);
  let n = 0;
  return (
    <nav className="glass-strong flex max-h-full w-full flex-col overflow-hidden sm:w-80" aria-label="Índice de ambientes">
      <div className="flex items-center justify-between border-b border-white/10 py-2 pl-6 pr-2">
        <p className="eyebrow">Índice</p>
        <button className="btn-icon" onClick={onClose} aria-label="Fechar índice de ambientes">
          <IconClose size={16} />
        </button>
      </div>
      <div className="scroll-thin overflow-y-auto pb-4">
        {GROUPS.map((g) => (
          <section key={g.title}>
            <h3 className="px-6 pb-2 pt-5 font-display text-lg font-light italic text-gold">{g.title}</h3>
            <ul>
              {ROOMS.filter(g.filter).map((rm) => {
                n += 1;
                const active = selected === rm.id;
                return (
                  <li key={rm.id}>
                    <button
                      onClick={() => focusRoom(rm.id)}
                      onMouseEnter={() => hoverRoom(rm.id)}
                      onMouseLeave={() => hoverRoom(null)}
                      aria-current={active ? 'true' : undefined}
                      className={`group grid min-h-[42px] w-full grid-cols-[2rem_1fr_auto] items-center border-l px-6 text-left text-[13px] transition-colors duration-300 ${active ? 'border-gold bg-white/[0.06] text-bone' : 'border-transparent text-bone/75 hover:bg-white/[0.04] hover:text-bone'}`}
                    >
                      <span className="numeral text-[13px] text-bone/40">{String(n).padStart(2, '0')}</span>
                      <span className="tracking-wide">{rm.name}</span>
                      <span className="numeral text-[13px] text-bone/50">{fmtArea(rectArea(rm.rect))}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  );
}
