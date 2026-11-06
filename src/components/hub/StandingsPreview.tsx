import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { teamById } from '../../data/teams';
import { useConstructorStandings, useDriverStandings } from '../../hooks/useStandings';
import { findDriver, teamFor } from '../../utils/season';
import { DriverPhoto } from '../DriverPhoto';
import { HubHeader } from '../HubHeader';
import { LiveBadge } from '../LiveBadge';

const Skeleton = () => <div className="space-y-2" role="status" aria-label="Carregando">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-white/[0.04]" />)}</div>;

/** Top 5 de pilotos e de construtores, lado a lado. */
export function StandingsPreview() {
  const d = useDriverStandings();
  const c = useConstructorStandings();
  return (
    <section aria-labelledby="rank-title">
      <HubHeader kicker="Campeonato" title={<span id="rank-title">Ranking atualizado</span>} action={<><LiveBadge updatedAt={d.updatedAt} refreshing={d.refreshing} onRefresh={() => { d.refreshNow(); c.refreshNow(); }} /><Link to="/classificacao" className="btn-ghost py-2 text-xs">Tabela completa <ArrowRight className="h-4 w-4" aria-hidden /></Link></>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-4 sm:p-5">
          <p className="kicker mb-3 text-zinc-400">Pilotos</p>
          {d.state.status !== 'success' ? (d.state.status === 'error' ? <p className="text-sm text-zinc-400">{d.state.error}</p> : <Skeleton />) : (
            <ol className="divide-y divide-white/[0.05]">
              {d.state.data.items.slice(0, 5).map((s) => {
                const local = findDriver({ driverId: s.driverId, code: s.code });
                const team = local ? teamById(local.teamId) : teamFor(s.constructorId, s.constructorName);
                const max = d.state.status === 'success' ? d.state.data.items[0].points : 1;
                return (
                  <li key={s.driverId} className="flex items-center gap-3 py-2.5">
                    <span className="w-6 font-display text-xl font-black text-white tabular">{s.position}</span>
                    {local && team ? <DriverPhoto driver={local} team={team} width={96} className="h-10 w-10 shrink-0 rounded-full bg-white/5" /> : <span className="h-10 w-10 rounded-full bg-white/5" />}
                    <div className="min-w-0 flex-1">
                      {local ? <Link to={`/pilotos/${local.id}`} className="block truncate font-semibold text-white hover:text-race-400">{s.givenName} <span className="uppercase">{s.familyName}</span></Link> : <p className="truncate font-semibold text-white">{s.givenName} {s.familyName}</p>}
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/5" aria-hidden><div className="h-full rounded-full" style={{ width: `${(s.points / max) * 100}%`, background: team?.color }} /></div>
                    </div>
                    <span className="w-16 text-right font-display text-lg font-black text-white tabular">{s.points}<span className="ml-0.5 text-[10px] text-zinc-500">pts</span></span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
        <div className="panel p-4 sm:p-5">
          <p className="kicker mb-3 text-zinc-400">Construtores</p>
          {c.state.status !== 'success' ? (c.state.status === 'error' ? <p className="text-sm text-zinc-400">{c.state.error}</p> : <Skeleton />) : (
            <ol className="divide-y divide-white/[0.05]">
              {c.state.data.items.slice(0, 5).map((s) => {
                const team = teamFor(s.constructorId, s.name);
                const max = c.state.status === 'success' ? c.state.data.items[0].points : 1;
                return (
                  <li key={s.constructorId} className="flex items-center gap-3 py-2.5">
                    <span className="w-6 font-display text-xl font-black text-white tabular">{s.position}</span>
                    <span className="h-10 w-1.5 rounded" style={{ background: team?.color }} aria-hidden />
                    <div className="min-w-0 flex-1">
                      {team ? <Link to={`/equipes/${team.id}`} className="block truncate font-semibold text-white hover:text-race-400">{s.name}</Link> : <p className="truncate font-semibold text-white">{s.name}</p>}
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/5" aria-hidden><div className="h-full rounded-full" style={{ width: `${(s.points / max) * 100}%`, background: team?.color }} /></div>
                    </div>
                    <span className="text-right font-mono text-xs text-zinc-500">{s.wins} vit.</span>
                    <span className="w-16 text-right font-display text-lg font-black text-white tabular">{s.points}<span className="ml-0.5 text-[10px] text-zinc-500">pts</span></span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
