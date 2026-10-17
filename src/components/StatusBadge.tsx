import type { RaceStatus } from '../types';
import { STATUS_LABELS } from '../utils/race';

const STYLES: Record<RaceStatus, string> = {
  upcoming: 'border-white/15 text-zinc-300',
  next: 'border-gold/60 bg-gold/15 text-gold',
  live: 'border-telemetry-green/50 bg-telemetry-green/10 text-telemetry-green',
  completed: 'border-white/10 bg-white/[0.03] text-zinc-500',
  cancelled: 'border-zinc-600 text-zinc-500 line-through',
};

export function StatusBadge({ status }: { status: RaceStatus }) {
  return (
    <span className={`chip ${STYLES[status]}`}>
      {(status === 'live' || status === 'next') && (
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${status === 'live' ? 'bg-telemetry-green' : 'bg-gold'}`} />
          <span className={`relative inline-flex h-2 w-2 rounded-full ${status === 'live' ? 'bg-telemetry-green' : 'bg-gold'}`} />
        </span>
      )}
      {STATUS_LABELS[status]}
    </span>
  );
}
