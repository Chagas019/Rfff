import { RefreshCw } from 'lucide-react';
import { useNow } from '../hooks/useNow';

function ago(from: Date, now: Date) {
  const s = Math.max(0, Math.round((now.getTime() - from.getTime()) / 1000));
  if (s < 45) return 'agora mesmo';
  const m = Math.round(s / 60);
  if (m < 60) return `há ${m} min`;
  return `há ${Math.round(m / 60)} h`;
}

/** Selo "atualização automática" com o horário da última busca e um botão para atualizar na hora. */
export function LiveBadge({ updatedAt, refreshing, onRefresh, className = '' }: { updatedAt: Date | null; refreshing?: boolean; onRefresh?: () => void; className?: string }) {
  const now = useNow(15_000);
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border border-telemetry-green/30 bg-telemetry-green/5 py-1 pl-3 pr-1 text-xs text-zinc-300 ${className}`}>
      <span className="relative flex h-2 w-2" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-telemetry-green opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-telemetry-green" />
      </span>
      <span className="font-condensed uppercase tracking-wider">Atualiza sozinho</span>
      {updatedAt && <span className="text-zinc-500" aria-live="polite">· {refreshing ? 'buscando…' : ago(updatedAt, now)}</span>}
      {onRefresh && (
        <button type="button" onClick={onRefresh} className="ml-1 rounded-full p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white" aria-label="Atualizar agora">
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} aria-hidden />
        </button>
      )}
    </div>
  );
}
