import { ArrowRight, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEASON, races } from '../../data/calendar2026';
import { teamById } from '../../data/teams';
import { useAsync } from '../../hooks/useAsync';
import { useNow } from '../../hooks/useNow';
import { LIVE_REFRESH_MS, fetchRecentForm } from '../../services/f1Api';
import type { RaceResultRow } from '../../types';
import { getBaseStatus } from '../../utils/race';
import { findDriver } from '../../utils/season';
import { DriverPhoto } from '../DriverPhoto';
import { HubHeader } from '../HubHeader';

export interface FormEntry { driverId: string; code: string; name: string; points: number; finishes: number[] }

/** Soma dos pontos nas últimas etapas; desempate pela melhor média de chegada. */
export function rankForm(rounds: { round: number; results: RaceResultRow[] }[]): FormEntry[] {
  const map = new Map<string, FormEntry>();
  for (const { results } of rounds) {
    for (const r of results) {
      const e = map.get(r.driverId) ?? { driverId: r.driverId, code: r.code, name: r.driver, points: 0, finishes: [] };
      e.points += r.points;
      e.finishes.push(r.position);
      map.set(r.driverId, e);
    }
  }
  const avg = (f: number[]) => f.reduce((a, b) => a + b, 0) / f.length;
  return [...map.values()].sort((a, b) => b.points - a.points || avg(a.finishes) - avg(b.finishes));
}

/** Pilotos em destaque: quem mais pontuou nas três últimas corridas. */
export function FeaturedDrivers() {
  const now = useNow(10 * 60_000);
  const rounds = races.filter((r) => r.round && getBaseStatus(r, now) === 'completed').slice(-3).map((r) => r.round!);
  const { state } = useAsync((s) => fetchRecentForm(SEASON, rounds, s), [rounds.join(',')], { refreshMs: LIVE_REFRESH_MS });
  const list = state.status === 'success' ? rankForm(state.data).slice(0, 4) : [];
  const names = rounds.map((n) => races.find((r) => r.round === n)?.name.replace(/^GP d[aeo]s? /, '')).join(', ');

  return (
    <section aria-labelledby="featured-title">
      <HubHeader kicker="Em alta" title={<span id="featured-title">Pilotos em destaque</span>} action={<Link to="/pilotos" className="btn-ghost py-2 text-xs">Todos os pilotos <ArrowRight className="h-4 w-4" aria-hidden /></Link>}>
        Quem mais somou pontos nas três últimas corridas{names ? ` (${names})` : ''}.
      </HubHeader>
      {state.status === 'error' ? <p className="surface p-5 text-sm text-zinc-400">{state.error}</p> : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {(list.length ? list : Array.from({ length: 4 }, () => null)).map((e, i) => {
            if (!e) return <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-white/[0.04]" />;
            const local = findDriver({ driverId: e.driverId, code: e.code });
            const team = local ? teamById(local.teamId) : undefined;
            const inner = (
              <>
                <div className="relative aspect-[4/5] overflow-hidden" style={{ background: `linear-gradient(180deg, ${team?.color ?? '#333'}40, transparent 80%)` }}>
                  {local && team && <DriverPhoto driver={local} team={team} width={420} className="h-full w-full transition duration-500 group-hover:scale-[1.03]" />}
                  <span className="absolute left-3 top-3 rounded bg-black/60 px-2 py-0.5 font-condensed text-[10px] font-semibold uppercase tracking-widest text-white backdrop-blur">#{i + 1} em forma</span>
                  {i === 0 && <Flame className="absolute right-3 top-3 h-5 w-5 text-orange-400" aria-hidden />}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-carbon-900 to-transparent" aria-hidden />
                </div>
                <div className="relative -mt-10 p-4">
                  <p className="text-xs text-zinc-400">{local?.firstName ?? e.name.split(' ')[0]}</p>
                  <p className="font-display text-xl font-semibold leading-none text-white">{local?.lastName ?? e.name.split(' ').slice(1).join(' ')}</p>
                  <p className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="font-display text-2xl font-semibold text-white">{e.points}<span className="ml-1 text-xs text-zinc-500">pts</span></span>
                    <span className="font-mono text-[11px] text-zinc-400" aria-label={`Chegadas: ${e.finishes.join(', ')}`}>{e.finishes.map((p) => `P${p}`).join(' · ')}</span>
                  </p>
                </div>
              </>
            );
            return local ? (
              <Link key={e.driverId} to={`/pilotos/${local.id}`} className="group panel block overflow-hidden transition hover:border-white/20">{inner}</Link>
            ) : <div key={e.driverId} className="panel overflow-hidden">{inner}</div>;
          })}
        </div>
      )}
    </section>
  );
}
