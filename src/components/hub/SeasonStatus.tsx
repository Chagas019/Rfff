import { ArrowRight, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { races } from '../../data/calendar2026';
import { teamById } from '../../data/teams';
import { useChampionship } from '../../hooks/useChampionship';
import { useDriverStandings } from '../../hooks/useStandings';
import { findDriver, teamFor } from '../../utils/season';
import { DriverPhoto } from '../DriverPhoto';
import { LiveBadge } from '../LiveBadge';

/**
 * Situação da temporada: líder, vantagem, pontos ainda em jogo e quem ainda pode ser campeão.
 * "Decidido" só aparece quando ninguém mais consegue alcançar o líder pelos resultados publicados.
 */
export function SeasonStatus() {
  const champ = useChampionship();
  const standings = useDriverStandings();
  const active = races.filter((r) => !r.cancelled && r.round);

  if (champ.state.status !== 'success' || standings.state.status !== 'success' || !champ.state.data.drivers.leader) {
    return (
      <article className="panel flex h-full flex-col gap-5 p-5 sm:p-6" aria-label="Situação da temporada">
        <p className="kicker text-zinc-400">Temporada 2026</p>
        {champ.state.status === 'error'
          ? <p className="text-sm text-zinc-400">Classificação indisponível agora ({champ.state.error}). Não mostramos números antigos: tentamos de novo sozinhos em alguns minutos.</p>
          : <div className="h-40 animate-pulse rounded-xl bg-white/[0.04]" role="status" aria-label="Carregando classificação" />}
        <LiveBadge updatedAt={champ.updatedAt} refreshing={champ.refreshing} error={champ.lastError} onRefresh={champ.refreshNow} />
      </article>
    );
  }

  const { drivers: dc, teams: tc, round } = champ.state.data;
  const p1 = standings.state.data.items[0];
  const p2 = standings.state.data.items[1];
  const local = findDriver({ driverId: p1.driverId, code: p1.code });
  const team = local ? teamById(local.teamId) : teamFor(p1.constructorId, p1.constructorName);
  const done = active.length - dc.racesLeft;
  const c1 = tc.leader;
  const cTeam = c1 ? teamFor(c1.id, c1.name) : undefined;
  const rivals = dc.contenders.filter((c) => c.id !== dc.leader!.id);

  return (
    <article className="panel flex h-full min-w-0 flex-col gap-5 p-5 sm:p-6" aria-labelledby="season-title">
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
          <span className="kicker text-zinc-400">Temporada 2026</span>
          <span className="font-mono text-xs text-zinc-400"><strong className="text-white">{done}</strong> de {active.length} corridas com resultado</span>
        </div>
        <div className="mt-2 flex gap-[3px]" aria-hidden>
          {active.map((r, i) => <span key={r.id} className={`h-1.5 flex-1 rounded-full ${i < done ? 'bg-race' : 'bg-white/10'}`} />)}
        </div>
      </div>

      <div className="relative flex min-w-0 items-center gap-4 overflow-hidden rounded-xl border border-white/[0.07] bg-black/30 p-4">
        <span className="absolute inset-y-0 left-0 w-1" style={{ background: team?.color }} aria-hidden />
        {local && team && <DriverPhoto driver={local} team={team} width={200} className="h-16 w-16 shrink-0 rounded-full bg-white/[0.04] sm:h-20 sm:w-20" />}
        <div className="min-w-0">
          <p className="kicker flex items-center gap-1.5 text-telemetry-yellow"><Trophy className="h-3.5 w-3.5 shrink-0" aria-hidden /><span className="truncate">{dc.decided ? 'Campeão mundial de 2026' : 'Líder do campeonato'}</span></p>
          <h2 id="season-title" className="mt-1 truncate text-xl leading-tight sm:text-2xl">{p1.givenName} {p1.familyName}</h2>
          <p className="mt-1 truncate text-sm text-zinc-400">{p1.constructorName} · <strong className="text-white">{p1.points} pts</strong> · {p1.wins} vitórias</p>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center sm:gap-3">
        <div className="min-w-0 rounded-lg bg-white/[0.03] p-2.5 sm:p-3"><dt className="kicker truncate text-[10px] text-zinc-500">Vantagem</dt><dd className="font-display text-xl font-semibold text-white sm:text-2xl">+{dc.gap}</dd><dd className="truncate text-[11px] text-zinc-500">sobre {p2?.familyName ?? '—'}</dd></div>
        <div className="min-w-0 rounded-lg bg-white/[0.03] p-2.5 sm:p-3"><dt className="kicker truncate text-[10px] text-zinc-500">Em jogo</dt><dd className="font-display text-xl font-semibold text-white sm:text-2xl">{dc.maxLeft}</dd><dd className="truncate text-[11px] text-zinc-500">{dc.racesLeft} GPs{dc.sprintsLeft ? ` + ${dc.sprintsLeft} Sprint` : ''}</dd></div>
        <div className="min-w-0 rounded-lg bg-white/[0.03] p-2.5 sm:p-3"><dt className="kicker truncate text-[10px] text-zinc-500">Título</dt><dd className={`truncate font-display text-xl font-semibold sm:text-2xl ${dc.decided ? 'text-telemetry-yellow' : 'text-telemetry-green'}`}>{dc.decided ? 'Decidido' : 'Aberto'}</dd><dd className="truncate text-[11px] text-zinc-500">{dc.decided ? 'ninguém alcança' : `${dc.contenders.length} na disputa`}</dd></div>
      </dl>

      {!dc.decided && rivals.length > 0 && (
        <p className="text-sm text-zinc-400"><span className="text-zinc-300">Ainda podem ser campeões:</span> {rivals.slice(0, 4).map((r) => `${r.name.split(' ').slice(-1)[0]} (−${r.behind})`).join(', ')}{rivals.length > 4 ? ` e mais ${rivals.length - 4}` : ''}.</p>
      )}

      {c1 && (
        <div className="flex min-w-0 items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2.5 text-sm">
          <span className="h-8 w-1 shrink-0 rounded" style={{ background: cTeam?.color }} aria-hidden />
          <div className="min-w-0">
            <p className="kicker truncate text-[10px] text-zinc-500">Construtores · {tc.decided ? 'título decidido' : `${tc.contenders.length} na disputa`}</p>
            <p className="truncate text-zinc-300"><strong className="text-white">{c1.name}</strong> · {c1.points} pts<span className="text-zinc-500"> · +{tc.gap} · {tc.maxLeft} em jogo</span></p>
          </div>
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
        <LiveBadge updatedAt={champ.updatedAt} refreshing={champ.refreshing} error={champ.lastError} onRefresh={champ.refreshNow} />
        <Link to="/classificacao" className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-300 hover:text-white">Classificação completa <ArrowRight className="h-4 w-4" aria-hidden /></Link>
      </div>
      <p className="-mt-2 text-[11px] text-zinc-500">Após a rodada {round}. Pontos em jogo pelos resultados ainda não publicados: até 25 por GP e 8 por Sprint (construtores: 43 e 15).</p>
    </article>
  );
}
