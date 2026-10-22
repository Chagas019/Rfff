import { LIGHTING, TIME_ORDER, type TimeOfDay } from '../config/lighting';
import { useExperience } from '../store/useExperience';
import { IconMoon, IconSun, IconSunset } from './icons';

const ICON: Record<TimeOfDay, typeof IconSun> = { day: IconSun, sunset: IconSunset, night: IconMoon };

/** Alterna dia, pôr do sol e noite (a transição de luz é suave na cena). */
export function EnvironmentSelector({ compact = false }: { compact?: boolean }) {
  const time = useExperience((s) => s.time);
  const setTime = useExperience((s) => s.setTime);
  return (
    <div className="glass flex items-center rounded-full p-1" role="radiogroup" aria-label="Horário">
      {TIME_ORDER.map((t) => {
        const Icon = ICON[t];
        const active = t === time;
        return (
          <button
            key={t}
            role="radio"
            aria-checked={active}
            aria-label={LIGHTING[t].label}
            title={LIGHTING[t].label}
            onClick={() => setTime(t)}
            className={`flex min-h-[40px] min-w-[40px] items-center gap-2 rounded-full px-3 text-xs font-medium transition-colors duration-200 ${active ? 'bg-bone text-ink' : 'text-bone/80 hover:text-bone'}`}
          >
            <Icon size={17} />
            {!compact && <span className="hidden lg:inline">{LIGHTING[t].label}</span>}
          </button>
        );
      })}
    </div>
  );
}
