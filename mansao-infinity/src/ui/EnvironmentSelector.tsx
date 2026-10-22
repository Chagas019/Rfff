import { LIGHTING, TIME_ORDER, type TimeOfDay } from '../config/lighting';
import { useExperience } from '../store/useExperience';
import { IconMoon, IconSun, IconSunset } from './icons';

const ICON: Record<TimeOfDay, typeof IconSun> = { day: IconSun, sunset: IconSunset, night: IconMoon };

/** Alterna dia, pôr do sol e noite (a transição de luz é suave na cena). */
export function EnvironmentSelector() {
  const time = useExperience((s) => s.time);
  const setTime = useExperience((s) => s.setTime);
  return (
    <div className="glass flex items-center gap-1 px-2 sm:gap-4 sm:px-5" role="radiogroup" aria-label="Horário">
      {TIME_ORDER.map((t) => {
        const Icon = ICON[t];
        const active = t === time;
        return (
          <button key={t} role="radio" aria-checked={active} aria-label={LIGHTING[t].label} title={LIGHTING[t].label} onClick={() => setTime(t)} className="tab flex items-center gap-2 px-2">
            <Icon size={15} className={active ? 'text-gold' : ''} />
            <span className="hidden xl:inline">{LIGHTING[t].label}</span>
          </button>
        );
      })}
    </div>
  );
}
