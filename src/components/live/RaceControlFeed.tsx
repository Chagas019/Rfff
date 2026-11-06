import { Flag, Radio, ShieldAlert, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAsync } from '../../hooks/useAsync';
import { LIVE_REFRESH_MS } from '../../services/f1Api';
import { OPENF1_SOURCE, fetchRaceControl, type OF1RaceControl } from '../../services/openf1';
import { clock } from '../../utils/time';
import { ErrorState } from '../States';

const FLAG_STYLE: Record<string, { label: string; cls: string }> = {
  GREEN: { label: 'Bandeira verde', cls: 'bg-telemetry-green text-black' },
  CLEAR: { label: 'Pista livre', cls: 'bg-telemetry-green/80 text-black' },
  YELLOW: { label: 'Amarela', cls: 'bg-telemetry-yellow text-black' },
  'DOUBLE YELLOW': { label: 'Amarela dupla', cls: 'bg-telemetry-yellow text-black' },
  RED: { label: 'Bandeira vermelha', cls: 'bg-race text-white' },
  CHEQUERED: { label: 'Bandeirada', cls: 'bg-white text-black' },
  BLUE: { label: 'Azul', cls: 'bg-sky-500 text-white' },
  'BLACK AND WHITE': { label: 'Preta e branca', cls: 'bg-zinc-200 text-black' },
};

/** Mensagens que realmente mudam a corrida (sem a enxurrada de bandeiras azuis). */
export function isImportant(m: OF1RaceControl): boolean {
  if (m.flag === 'BLUE') return false;
  if (m.category === 'SafetyCar' || m.flag === 'RED' || m.flag === 'CHEQUERED') return true;
  return /INVESTIGAT|PENALTY|DELETED|NOTED|SAFETY CAR|VIRTUAL|RED FLAG|DRS|STEWARDS|RETIRED|STOPPED|INCIDENT/.test(m.message) || (m.category === 'Flag' && m.scope === 'Track');
}

function Icon({ m }: { m: OF1RaceControl }) {
  if (m.category === 'SafetyCar') return <ShieldAlert className="h-4 w-4 text-telemetry-yellow" aria-hidden />;
  if (m.flag) return <Flag className="h-4 w-4 text-zinc-300" aria-hidden />;
  if (/INVESTIGAT|PENALTY|STEWARDS/.test(m.message)) return <TriangleAlert className="h-4 w-4 text-gold" aria-hidden />;
  return <Radio className="h-4 w-4 text-zinc-500" aria-hidden />;
}

/** Comunicados oficiais da direção de prova (FIA), na ordem em que saíram. */
export function RaceControlFeed({ sessionKey, live, limit = 30 }: { sessionKey: number | null; live: boolean; limit?: number }) {
  const { state, retry } = useAsync((s) => (sessionKey ? fetchRaceControl(sessionKey, s) : Promise.resolve([])), [sessionKey], { refreshMs: live ? 60_000 : LIVE_REFRESH_MS });
  const [onlyKey, setOnlyKey] = useState(true);
  const list = useMemo(() => {
    if (state.status !== 'success') return [];
    return [...state.data].filter((m) => !onlyKey || isImportant(m)).reverse().slice(0, limit);
  }, [state, onlyKey, limit]);

  if (!sessionKey) return null;
  if (state.status === 'loading' || state.status === 'idle') return <div className="h-40 animate-pulse rounded-xl bg-white/[0.04]" role="status" aria-label="Carregando direção de prova" />;
  if (state.status === 'error') return <ErrorState message={state.error} onRetry={retry} />;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="kicker text-zinc-400">Direção de prova · mensagens oficiais (em inglês)</p>
        <div className="flex gap-1" role="group" aria-label="Filtrar mensagens">
          <button type="button" aria-pressed={onlyKey} onClick={() => setOnlyKey(true)} className={`chip px-2.5 py-0.5 text-[10px] ${onlyKey ? 'border-white bg-white text-black' : ''}`}>Principais</button>
          <button type="button" aria-pressed={!onlyKey} onClick={() => setOnlyKey(false)} className={`chip px-2.5 py-0.5 text-[10px] ${!onlyKey ? 'border-white bg-white text-black' : ''}`}>Todas</button>
        </div>
      </div>
      {list.length === 0 ? (
        <p className="surface p-5 text-sm text-zinc-400">Nenhuma mensagem {onlyKey ? 'importante ' : ''}publicada nesta sessão.</p>
      ) : (
        <ol className="surface max-h-[460px] divide-y divide-white/[0.05] overflow-y-auto" aria-live="polite">
          {list.map((m, i) => {
            const flag = m.flag ? FLAG_STYLE[m.flag] : undefined;
            return (
              <li key={`${m.date}-${i}`} className="flex gap-3 px-4 py-3">
                <span className="mt-0.5"><Icon m={m} /></span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-zinc-500">
                    <time dateTime={m.date}>{clock(m.date)}</time>
                    {m.lap_number ? <span>· Volta {m.lap_number}</span> : null}
                    {flag && <span className={`rounded px-1.5 py-0.5 font-condensed text-[10px] font-semibold uppercase tracking-wider ${flag.cls}`}>{flag.label}</span>}
                  </p>
                  <p className="mt-1 text-sm text-zinc-200">{m.message}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <p className="mt-2 text-[11px] text-zinc-500">Horários no seu fuso. Fonte: <a href={OPENF1_SOURCE.url} target="_blank" rel="noreferrer" className="hover:underline">{OPENF1_SOURCE.label}</a>.</p>
    </div>
  );
}
