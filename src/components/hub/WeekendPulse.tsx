import { ArrowRight, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { OPENF1_MEETING } from '../../data/openf1';
import { teamById } from '../../data/teams';
import { resultTiming } from '../../services/openf1';
import type { Race } from '../../types';
import { SESSION_LABELS } from '../../utils/race';
import { clock, dayShort } from '../../utils/time';
import { DriverPhoto } from '../DriverPhoto';
import { Flag } from '../Flag';
import { resolveDriver, useSessionData } from '../live/SessionResults';
import { useWeekendSessions, type WeekendSession } from '../live/useWeekend';

function SessionRow({ s, meetingKey }: { s: WeekendSession; meetingKey?: number }) {
  const { state } = useSessionData(s.state === 'upcoming' ? null : s.key, s.state === 'live', meetingKey);
  const top = state.status === 'success' ? state.data.results.slice(0, 3) : [];
  const leader = top[0] ? resolveDriver(top[0].driver_number, state.status === 'success' ? state.data.drivers : []) : null;
  const team = leader?.local ? teamById(leader.local.teamId) : undefined;
  const timing = top[0] ? resultTiming(top[0], s.type) : null;
  const label = s.type === 'race' || s.type === 'sprint' ? 'Vencedor' : s.type === 'quali' || s.type === 'sprintQuali' ? 'Pole' : 'Mais rápido';

  return (
    <li className="flex items-center gap-3 py-3">
      <div className="w-28 shrink-0 sm:w-36">
        <p className="font-condensed text-sm font-semibold uppercase tracking-wider text-white">{SESSION_LABELS[s.type]}</p>
        <p className="font-mono text-[11px] text-zinc-500">{dayShort(s.start)} · {clock(s.start)}</p>
      </div>
      {s.state === 'upcoming' ? (
        <p className="text-sm text-zinc-500">A seguir</p>
      ) : leader ? (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {leader.local && team ? <DriverPhoto driver={leader.local} team={team} width={96} className="h-9 w-9 shrink-0 rounded-full bg-white/5" /> : <span className="h-9 w-1 rounded" style={{ background: leader.color }} aria-hidden />}
          <div className="min-w-0">
            <p className="kicker text-[10px] text-zinc-500">{s.state === 'live' ? 'Liderando' : label}</p>
            <p className="truncate text-sm font-semibold text-white">{leader.name}</p>
            {timing?.time && <p className="font-mono text-[11px] text-zinc-400 tabular">{timing.time}</p>}
          </div>
          <p className="ml-auto hidden shrink-0 font-mono text-[11px] text-zinc-500 sm:block">{top.slice(1).map((r) => resolveDriver(r.driver_number, state.status === 'success' ? state.data.drivers : []).acronym).join(' · ')}</p>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">{s.state === 'live' ? <span className="inline-flex items-center gap-2 text-gold"><Radio className="h-3.5 w-3.5" aria-hidden />Em andamento</span> : state.status === 'loading' || state.status === 'idle' ? 'Carregando…' : state.status === 'error' ? 'Indisponível agora — tentamos de novo em instantes' : 'Resultado ainda não publicado'}</p>
      )}
    </li>
  );
}

/** Resumo do fim de semana (atual ou o último), sessão por sessão. */
export function WeekendPulse({ race, mode, now }: { race: Race; mode: 'live' | 'recent'; now: Date }) {
  const { sessions } = useWeekendSessions(race, now);
  return (
    <article className="panel flex h-full flex-col p-5 sm:p-6" aria-labelledby="pulse-title">
      <p className="kicker flex items-center gap-2 text-gold">
        {mode === 'live' ? <><span className="h-2 w-2 animate-pulse rounded-full bg-race" aria-hidden />GP em andamento</> : 'Última etapa'} · Rodada {race.round}
      </p>
      <h2 id="pulse-title" className="mt-2 text-3xl leading-none sm:text-4xl"><Flag code={race.countryCode} country={race.country} className="mr-2 align-middle" />{race.name}</h2>
      <ol className="mt-4 divide-y divide-white/[0.06]">{sessions.map((s) => <SessionRow key={s.type} s={s} meetingKey={OPENF1_MEETING[race.id]} />)}</ol>
      <div className="mt-auto pt-5">
        <Link to="/live" className="btn-primary">{mode === 'live' ? 'Acompanhar no F1 LIVE' : 'Ver resultados e direção de prova'} <ArrowRight className="h-4 w-4" aria-hidden /></Link>
      </div>
    </article>
  );
}
