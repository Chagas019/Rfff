import { motion } from 'framer-motion';
import { useNow } from '../hooks/useNow';
import type { Race } from '../types';
import { RACE_DURATION_MS, getCountdown, getRaceStart, pad2 } from '../utils/race';

/** Contagem regressiva até a largada; nunca exibe valores negativos. */
export function RaceCountdown({ race, compact = false }: { race: Race; compact?: boolean }) {
  const now = useNow(1000);
  const start = getRaceStart(race);
  if (!start) return null;
  const cd = getCountdown(start, now);
  const running = cd.finished && now.getTime() < start.getTime() + RACE_DURATION_MS;

  if (cd.finished) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-telemetry-green/30 bg-telemetry-green/10 px-4 py-3" role="status">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-telemetry-green" aria-hidden />
        <span className="font-display text-sm font-bold uppercase tracking-wider text-telemetry-green">
          {running ? 'Corrida em andamento' : 'Corrida encerrada'}
        </span>
      </div>
    );
  }

  const units = [
    { label: 'Dias', value: cd.days },
    { label: 'Horas', value: cd.hours },
    { label: 'Min', value: cd.minutes },
    { label: 'Seg', value: cd.seconds },
  ];
  return (
    <div role="timer" aria-label={`Faltam ${cd.days} dias, ${cd.hours} horas, ${cd.minutes} minutos e ${cd.seconds} segundos para a largada`}>
      <div className={`grid grid-cols-4 ${compact ? 'gap-2' : 'gap-2 sm:gap-3'}`} aria-hidden>
        {units.map((u, i) => (
          <div key={u.label} className="relative overflow-hidden rounded-xl border border-white/10 bg-black/50 px-2 py-3 text-center">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-race to-transparent" />
            <motion.span
              key={u.value}
              initial={i === 3 ? { opacity: 0.4, y: -4 } : false}
              animate={{ opacity: 1, y: 0 }}
              className={`block font-display font-black tabular-nums text-white ${compact ? 'text-2xl' : 'text-3xl sm:text-5xl'}`}
            >
              {u.label === 'Dias' ? u.value : pad2(u.value)}
            </motion.span>
            <span className="label mt-1 block text-[10px]">{u.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
