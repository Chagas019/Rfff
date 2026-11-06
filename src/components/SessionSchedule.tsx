import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { SEASON } from '../data/calendar2026';
import { useAsync } from '../hooks/useAsync';
import { useNow } from '../hooks/useNow';
import { LIVE_REFRESH_MS } from '../services/f1Api';
import { JOLPICA_TYPES, fetchJolpicaSession } from '../services/jolpicaSessions';
import type { Race, SessionType } from '../types';
import { userTimeZone } from '../utils/format';
import { SESSION_LABELS, getCountdown, pad2 } from '../utils/race';
import { sessionState } from '../utils/season';
import { STATUS_LABEL, circuitTime, nextInWeekend, sessionStatus, type SessionStatus } from '../utils/sessionStatus';
import { LiveBadge } from './LiveBadge';
import { SessionResults } from './live/SessionResults';

const CHIP: Record<SessionStatus, string> = {
  scheduled: 'border-white/15 text-zinc-300',
  live: 'border-telemetry-green/50 bg-telemetry-green/10 text-telemetry-green',
  finished: 'border-white/10 text-zinc-500',
  results: 'border-gold/40 bg-gold/10 text-gold',
};

const userClock = (iso: string) => new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)).replace('.', '');

/** Quais sessões deste GP já têm classificação oficial publicada (Jolpica-F1). */
function usePublished(race: Race, now: Date) {
  const done = race.sessions.filter((s) => JOLPICA_TYPES.includes(s.type) && sessionState(s, now) === 'done').map((s) => s.type);
  const key = done.join(',');
  return useAsync<Set<SessionType>>(
    async (signal) => {
      const out = new Set<SessionType>();
      if (!race.round) return out;
      for (const t of done) {
        const j = await fetchJolpicaSession(SEASON, race.round, t, signal);
        if (j.results.length) out.add(t);
      }
      return out;
    },
    [race.id, key],
    { refreshMs: LIVE_REFRESH_MS },
  );
}

function NextCountdown({ race, now }: { race: Race; now: Date }) {
  const next = nextInWeekend(race.sessions, now);
  if (!next) return <p className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-zinc-400">Fim de semana encerrado.</p>;
  if (sessionState(next, now) === 'live') {
    return (
      <p className="flex items-center gap-3 rounded-xl border border-telemetry-green/30 bg-telemetry-green/10 px-4 py-3 font-display text-sm font-bold text-telemetry-green" role="status">
        <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-telemetry-green" aria-hidden />{SESSION_LABELS[next.type]} em andamento
      </p>
    );
  }
  const cd = getCountdown(new Date(next.start), now);
  const units = [['dias', cd.days], ['h', cd.hours], ['min', cd.minutes], ['s', cd.seconds]] as const;
  return (
    <div>
      <p className="label mb-2">Próxima sessão: <span className="text-white">{SESSION_LABELS[next.type]}</span></p>
      <div className="grid grid-cols-4 gap-2" role="timer" aria-label={`Faltam ${cd.days} dias, ${cd.hours} horas e ${cd.minutes} minutos para ${SESSION_LABELS[next.type]}`}>
        {units.map(([l, v]) => (
          <div key={l} className="min-w-0 rounded-lg bg-white/[0.04] py-2 text-center">
            <span className="block font-display text-2xl font-semibold text-white tabular sm:text-3xl">{pad2(v)}</span>
            <span className="kicker text-[10px] text-zinc-500">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Programação do GP com status de cada sessão (Agendado · Ao vivo · Finalizado · Resultado disponível),
 * horário do circuito e do visitante, contagem para a próxima sessão e resultados oficiais.
 */
export function SessionSchedule({ race }: { race: Race }) {
  const now = useNow(1000);
  const pub = usePublished(race, now);
  const published = pub.state.status === 'success' ? pub.state.data : new Set<SessionType>();
  const [open, setOpen] = useState<SessionType | null>(null);
  const tz = userTimeZone();
  const sample = circuitTime(race.sessions[0]?.start ?? '');

  return (
    <div className="min-w-0">
      <p className="text-xs text-zinc-500">
        <strong className="text-zinc-300">Horário do circuito</strong>{sample ? ` (${race.city}, ${sample.offset})` : ''} e, abaixo, <strong className="text-zinc-300">no seu fuso</strong> ({tz}).
        {!race.timesConfirmed && ' Horários estimados — confirme em formula1.com.'}
      </p>
      <ol className="mt-4 space-y-2">
        {race.sessions.map((s) => {
          const st = sessionStatus(s, now, published);
          const ct = circuitTime(s.start);
          const canOpen = st === 'results' && !!race.round;
          const isOpen = open === s.type && canOpen;
          return (
            <li key={s.type} className={`min-w-0 rounded-xl border ${s.type === 'race' ? 'border-gold/40 bg-gold/[0.07]' : 'border-white/5 bg-white/[0.02]'}`}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-3 sm:px-4">
                <span className="flex min-w-0 flex-1 items-center gap-2.5">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${st === 'live' ? 'animate-pulse bg-telemetry-green' : st === 'scheduled' ? 'bg-gold' : 'bg-zinc-600'}`} aria-hidden />
                  <span className="truncate font-semibold text-white">{SESSION_LABELS[s.type]}</span>
                </span>
                <span className={`chip shrink-0 text-[10px] ${CHIP[st]}`}>{STATUS_LABEL[st]}</span>
                <span className="w-full text-right font-mono text-xs leading-tight sm:w-auto">
                  {ct && <time dateTime={s.start} className="block text-zinc-200"><span className="text-zinc-500">{ct.day}</span> {ct.time} <span className="text-[10px] text-zinc-500">circuito</span></time>}
                  <span className="block text-zinc-500">{userClock(s.start)} <span className="text-[10px]">seu fuso</span></span>
                </span>
                {canOpen && (
                  <button type="button" onClick={() => setOpen(isOpen ? null : s.type)} aria-expanded={isOpen} className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-white/[0.04] py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.08] hover:text-white">
                    {isOpen ? 'Fechar resultado' : 'Ver resultado'}<ChevronDown className={`h-3.5 w-3.5 transition ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
                  </button>
                )}
              </div>
              {isOpen && <div className="border-t border-white/5 p-3 sm:p-4"><SessionResults sessionKey={null} type={s.type} live={false} round={race.round} /></div>}
            </li>
          );
        })}
      </ol>
      <div className="mt-5"><NextCountdown race={race} now={now} /></div>
      <div className="mt-4"><LiveBadge updatedAt={pub.updatedAt} refreshing={pub.refreshing} error={pub.lastError} onRefresh={pub.refreshNow} /></div>
    </div>
  );
}
