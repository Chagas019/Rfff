import { ArrowRight, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { races } from '../../data/calendar2026';
import { teamById } from '../../data/teams';
import { useNow } from '../../hooks/useNow';
import { useConstructorStandings, useDriverStandings } from '../../hooks/useStandings';
import { findDriver, teamFor, titleMath } from '../../utils/season';
import { getBaseStatus } from '../../utils/race';
import { DriverPhoto } from '../DriverPhoto';
import { LiveBadge } from '../LiveBadge';

/** Situação da temporada: líder, vantagem, pontos em jogo e progresso do calendário. */
export function SeasonStatus() {
  const now = useNow(60_000);
  const { state, refreshNow, updatedAt, refreshing } = useDriverStandings();
  const cons = useConstructorStandings();
  const active = races.filter((r) => !r.cancelled);
  const done = active.filter((r) => getBaseStatus(r, now) === 'completed').length;

  const progress = (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="kicker text-zinc-400">Temporada 2026</span>
        <span className="font-mono text-xs text-zinc-400"><strong className="text-white">{done}</strong> de {active.length} etapas</span>
      </div>
      <div className="mt-2 flex gap-[3px]" aria-hidden>
        {active.map((r, i) => <span key={r.id} className={`h-1.5 flex-1 rounded-full ${i < done ? 'bg-race' : getBaseStatus(r, now) === 'live' ? 'animate-pulse bg-white' : 'bg-white/10'}`} />)}
      </div>
    </div>
  );

  if (state.status !== 'success' || state.data.items.length < 2) {
    return (
      <article className="panel flex h-full flex-col gap-5 p-5 sm:p-6" aria-label="Situação da temporada">
        {progress}
        {state.status === 'error'
          ? <p className="text-sm text-zinc-400">Classificação indisponível agora ({state.error}). Tentamos de novo sozinhos em alguns minutos.</p>
          : <div className="h-40 animate-pulse rounded-xl bg-white/[0.04]" role="status" aria-label="Carregando classificação" />}
      </article>
    );
  }

  const [p1, p2] = state.data.items;
  const tm = titleMath(races, now, p1.points, p2.points);
  const local = findDriver({ driverId: p1.driverId, code: p1.code });
  const team = local ? teamById(local.teamId) : teamFor(p1.constructorId, p1.constructorName);
  const c1 = cons.state.status === 'success' ? cons.state.data.items[0] : undefined;
  const c2 = cons.state.status === 'success' ? cons.state.data.items[1] : undefined;
  const cTeam = c1 ? teamFor(c1.constructorId, c1.name) : undefined;

  return (
    <article className="panel flex h-full flex-col gap-5 p-5 sm:p-6" aria-labelledby="season-title">
      {progress}
      <div className="relative flex items-center gap-4 overflow-hidden rounded-xl border border-white/[0.07] bg-black/30 p-4">
        <span className="absolute inset-y-0 left-0 w-1" style={{ background: team?.color }} aria-hidden />
        {local && team && <DriverPhoto driver={local} team={team} width={200} className="h-20 w-20 shrink-0 rounded-full bg-white/[0.04]" />}
        <div className="min-w-0">
          <p className="kicker flex items-center gap-1.5 text-telemetry-yellow"><Trophy className="h-3.5 w-3.5" aria-hidden />{tm.decided ? 'Campeão mundial de 2026' : 'Líder do campeonato'}</p>
          <h2 id="season-title" className="mt-1 truncate text-2xl leading-none">{p1.givenName} {p1.familyName}</h2>
          <p className="mt-1 text-sm text-zinc-400">{p1.constructorName} · <strong className="text-white">{p1.points} pts</strong> · {p1.wins} vitórias</p>
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-white/[0.03] p-3"><dt className="kicker text-[10px] text-zinc-500">Vantagem</dt><dd className="font-display text-2xl font-semibold text-white">+{tm.gap}</dd><dd className="truncate text-[11px] text-zinc-500">sobre {p2.familyName}</dd></div>
        <div className="rounded-lg bg-white/[0.03] p-3"><dt className="kicker text-[10px] text-zinc-500">Em jogo</dt><dd className="font-display text-2xl font-semibold text-white">{tm.pointsLeft}</dd><dd className="text-[11px] text-zinc-500">pts · {tm.racesLeft} GPs</dd></div>
        <div className="rounded-lg bg-white/[0.03] p-3"><dt className="kicker text-[10px] text-zinc-500">Título</dt><dd className={`font-display text-2xl font-semibold ${tm.decided ? 'text-telemetry-yellow' : 'text-telemetry-green'}`}>{tm.decided ? 'Decidido' : 'Aberto'}</dd><dd className="text-[11px] text-zinc-500">{tm.decided ? `${p1.familyName} garantido` : 'na matemática'}</dd></div>
      </dl>
      {c1 && (
        <div className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2.5 text-sm">
          <span className="h-8 w-1 rounded" style={{ background: cTeam?.color }} aria-hidden />
          <div className="min-w-0">
            <p className="kicker text-[10px] text-zinc-500">Líder entre construtores</p>
            <p className="truncate text-zinc-300"><strong className="text-white">{c1.name}</strong> · {c1.points} pts{c2 ? <span className="text-zinc-500"> · +{c1.points - c2.points} sobre {c2.name}</span> : null}</p>
          </div>
        </div>
      )}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
        <LiveBadge updatedAt={updatedAt} refreshing={refreshing} onRefresh={refreshNow} />
        <Link to="/classificacao" className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-300 hover:text-white">Classificação completa <ArrowRight className="h-4 w-4" aria-hidden /></Link>
      </div>
      <p className="-mt-2 text-[11px] text-zinc-500">Após a rodada {state.data.round}. “Em jogo” considera 25 pts por GP e 8 por Sprint restantes.</p>
    </article>
  );
}
