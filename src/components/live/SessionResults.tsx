import { useState } from 'react';
import { Link } from 'react-router-dom';
import { drivers, formerDrivers } from '../../data/drivers';
import { teamById } from '../../data/teams';
import { useAsync } from '../../hooks/useAsync';
import { LIVE_REFRESH_MS } from '../../services/f1Api';
import { OPENF1_SOURCE, fetchMeetingDrivers, fetchSessionResult, resultTiming, type OF1Driver, type OF1Result } from '../../services/openf1';
import type { Driver, SessionType } from '../../types';
import { SESSION_LABELS } from '../../utils/race';
import { hexColor } from '../../utils/season';
import { DriverPhoto } from '../DriverPhoto';
import { LiveBadge } from '../LiveBadge';
import { ErrorState } from '../States';

export interface ResolvedDriver { local?: Driver; number: number; name: string; acronym: string; team: string; color: string }

/** Nome, equipe e cor de um número de carro — dados locais primeiro, OpenF1 como reserva. */
export function resolveDriver(number: number, of1: OF1Driver[]): ResolvedDriver {
  const local = drivers.find((d) => d.number === number) ?? formerDrivers.find((d) => d.number === number);
  const o = of1.find((d) => d.driver_number === number);
  const team = local ? teamById(local.teamId) : undefined;
  return {
    local,
    number,
    name: local ? `${local.firstName} ${local.lastName}` : o?.full_name ?? `Carro #${number}`,
    acronym: local?.code ?? o?.name_acronym ?? String(number),
    team: team?.name ?? o?.team_name ?? '',
    color: team?.color ?? hexColor(o?.team_colour),
  };
}

export function useSessionData(sessionKey: number | null, live: boolean, meetingKey?: number) {
  return useAsync(
    async (signal) => {
      if (!sessionKey) return { results: [] as OF1Result[], drivers: [] as OF1Driver[] };
      const results = await fetchSessionResult(sessionKey, signal);
      // só pergunta à OpenF1 pelos pilotos quando aparece um número que não conhecemos
      const unknown = results.some((r) => !drivers.some((d) => d.number === r.driver_number));
      const of1Drivers = unknown && meetingKey ? await fetchMeetingDrivers(meetingKey, signal).catch(() => []) : [];
      return { results: [...results].sort((a, b) => (a.position ?? 99) - (b.position ?? 99)), drivers: of1Drivers };
    },
    [sessionKey],
    { refreshMs: live ? 60_000 : LIVE_REFRESH_MS },
  );
}

/** Classificação de uma sessão (treino, classificação, sprint ou corrida) com tempos e diferenças oficiais. */
export function SessionResults({ sessionKey, type, live, meetingKey }: { sessionKey: number | null; type: SessionType; live: boolean; meetingKey?: number }) {
  const { state, retry, refreshNow, updatedAt, refreshing } = useSessionData(sessionKey, live, meetingKey);
  const [all, setAll] = useState(false);

  if (!sessionKey) return <p className="surface p-6 text-sm text-zinc-400">A OpenF1 ainda não publicou esta sessão.</p>;
  if (state.status === 'loading' || state.status === 'idle') {
    return <div className="space-y-2" role="status" aria-label="Carregando resultados">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-white/[0.04]" />)}</div>;
  }
  if (state.status === 'error') return <ErrorState message={state.error} onRetry={retry} />;
  const { results, drivers: of1 } = state.data;
  if (!results.length) {
    return (
      <div className="surface p-6 text-sm text-zinc-400">
        {live ? 'Sessão em andamento. ' : ''}Os tempos oficiais desta sessão ainda não foram publicados pela OpenF1 — esta área se atualiza sozinha assim que eles saírem.
        <div className="mt-3"><LiveBadge updatedAt={updatedAt} refreshing={refreshing} onRefresh={refreshNow} /></div>
      </div>
    );
  }
  const rows = all ? results : results.slice(0, 10);
  const isRace = type === 'race' || type === 'sprint';
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="kicker text-zinc-400">{SESSION_LABELS[type]} · resultado {live ? 'parcial' : 'oficial'}</p>
        <LiveBadge updatedAt={updatedAt} refreshing={refreshing} onRefresh={refreshNow} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{SESSION_LABELS[type]}: classificação</caption>
          <thead className="kicker bg-white/[0.03] text-zinc-500">
            <tr><th className="w-12 px-3 py-2.5">Pos</th><th>Piloto</th><th className="hidden sm:table-cell">Equipe</th><th className="hidden text-right sm:table-cell">{isRace ? 'Tempo' : 'Melhor volta'}</th><th className="px-2 text-right">Dif.</th><th className="hidden px-3 text-right sm:table-cell">Voltas</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const d = resolveDriver(r.driver_number, of1);
              const t = resultTiming(r, type);
              const team = d.local ? teamById(d.local.teamId) : undefined;
              return (
                <tr key={r.driver_number} className="border-t border-white/[0.05] hover:bg-white/[0.02]">
                  <td className="px-3 py-2 font-display text-lg font-semibold text-white tabular">{r.position ?? <span className="font-condensed text-xs text-zinc-500">{r.dsq ? 'DSQ' : r.dns ? 'NL' : 'AB'}</span>}</td>
                  <td>
                    <span className="flex items-center gap-3">
                      <span className="h-7 w-1 rounded" style={{ background: d.color }} aria-hidden />
                      {d.local && team && <DriverPhoto driver={d.local} team={team} width={96} className="hidden h-9 w-9 rounded-full bg-white/5 sm:block" />}
                      {d.local ? (
                        <Link to={`/pilotos/${d.local.id}`} className="font-semibold text-white hover:text-gold"><span className="sm:hidden">{d.local.lastName}</span><span className="hidden sm:inline">{d.name}</span></Link>
                      ) : <span className="font-semibold text-white">{d.name}</span>}
                      <span className="hidden font-mono text-[11px] text-zinc-500 sm:inline">{d.acronym}</span>
                    </span>
                  </td>
                  <td className="hidden text-zinc-400 sm:table-cell">{d.team}</td>
                  <td className="hidden text-right font-mono text-zinc-200 tabular sm:table-cell">{r.position === 1 || !isRace ? t.time ?? '—' : ''}</td>
                  <td className="px-2 text-right font-mono text-xs text-zinc-400 tabular sm:text-sm">{r.position === 1 ? <><span className="text-zinc-200 sm:hidden">{t.time ?? '—'}</span><span className="hidden sm:inline">—</span></> : t.gap ?? t.time ?? '—'}</td>
                  <td className="hidden px-3 text-right font-mono text-zinc-500 tabular sm:table-cell">{r.number_of_laps}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {results.length > 10 && (
        <button type="button" className="btn-ghost mt-3 w-full py-2 text-xs" onClick={() => setAll((a) => !a)}>{all ? 'Mostrar top 10' : `Ver todos os ${results.length} pilotos`}</button>
      )}
      <p className="mt-2 text-[11px] text-zinc-500">Fonte: <a href={OPENF1_SOURCE.url} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">{OPENF1_SOURCE.label}</a>.</p>
    </div>
  );
}
