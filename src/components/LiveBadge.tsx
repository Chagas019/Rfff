import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNow } from '../hooks/useNow';
import { clock } from '../utils/time';

function ago(from: Date, now: Date) {
  const s = Math.max(0, Math.round((now.getTime() - from.getTime()) / 1000));
  if (s < 45) return 'agora mesmo';
  const m = Math.round(s / 60);
  if (m < 60) return `há ${m} min`;
  return `há ${Math.round(m / 60)} h`;
}

/** Dados com mais de 15 minutos sem conseguir atualizar são marcados como desatualizados. */
export const STALE_MS = 15 * 60 * 1000;

export type Connection = 'ok' | 'updating' | 'stale' | 'error' | 'offline';

/** Estado da conexão de um bloco de dados ao vivo. Puro: fácil de testar. */
export function connectionState({ updatedAt, refreshing, error, online, now }: { updatedAt: Date | null; refreshing?: boolean; error?: string | null; online: boolean; now: Date }): Connection {
  if (!online) return 'offline';
  if (error) return 'error';
  if (refreshing) return 'updating';
  if (updatedAt && now.getTime() - updatedAt.getTime() > STALE_MS) return 'stale';
  return 'ok';
}

const STYLE: Record<Connection, { dot: string; ring: string; label: string }> = {
  ok: { dot: 'bg-telemetry-green', ring: 'border-telemetry-green/30 bg-telemetry-green/5', label: 'Conectado' },
  updating: { dot: 'bg-telemetry-green', ring: 'border-telemetry-green/30 bg-telemetry-green/5', label: 'Atualizando' },
  stale: { dot: 'bg-telemetry-yellow', ring: 'border-telemetry-yellow/40 bg-telemetry-yellow/5', label: 'Desatualizado' },
  error: { dot: 'bg-race', ring: 'border-race/40 bg-race/5', label: 'Fonte indisponível' },
  offline: { dot: 'bg-zinc-400', ring: 'border-white/20 bg-white/5', label: 'Sem internet' },
};

/**
 * Selo de conexão: mostra se os dados estão ao vivo, desatualizados ou se a fonte caiu —
 * sempre com o horário dos dados exibidos, para nunca passar dado antigo por atual.
 */
export function LiveBadge({ updatedAt, refreshing, error, onRefresh, className = '' }: { updatedAt: Date | null; refreshing?: boolean; error?: string | null; onRefresh?: () => void; className?: string }) {
  const now = useNow(15_000);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  const st = connectionState({ updatedAt, refreshing, error, online, now });
  const s = STYLE[st];
  const when = updatedAt ? (st === 'ok' || st === 'updating' ? ago(updatedAt, now) : `dados de ${clock(updatedAt)}`) : null;
  return (
    <div className={`inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border py-1 pl-3 pr-1 text-xs text-zinc-300 ${s.ring} ${className}`} title={error ?? undefined}>
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
        {st === 'ok' || st === 'updating' ? <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${s.dot}`} /> : null}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${s.dot}`} />
      </span>
      <span className="truncate" aria-live="polite">
        <span className="font-semibold">{s.label}</span>
        {st === 'ok' && <span className="hidden sm:inline"> · atualiza sozinho</span>}
        {when && <span className="text-zinc-500"> · {when}</span>}
      </span>
      {onRefresh && (
        <button type="button" onClick={onRefresh} className="ml-1 shrink-0 rounded-full p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white" aria-label="Atualizar agora">
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} aria-hidden />
        </button>
      )}
    </div>
  );
}
