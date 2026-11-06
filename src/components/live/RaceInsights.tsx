import { ArrowDown, ArrowUp, Gauge, Minus, Timer, Trophy, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEASON } from '../../data/calendar2026';
import { teamById } from '../../data/teams';
import { useAsync } from '../../hooks/useAsync';
import { API_SOURCE, LIVE_REFRESH_MS, fetchRaceResults } from '../../services/f1Api';
import type { RaceResultRow } from '../../types';
import { findDriver, teamFor } from '../../utils/season';
import { DriverPhoto } from '../DriverPhoto';

export interface Highlight { icon: typeof Trophy; label: string; value: string; detail: string; row: RaceResultRow }

/** Destaques calculados a partir do resultado oficial: vencedor, volta mais rápida, maior escalada. */
export function raceHighlights(rows: RaceResultRow[]): Highlight[] {
  const out: Highlight[] = [];
  const winner = rows.find((r) => r.position === 1);
  if (winner) out.push({ icon: Trophy, label: 'Vencedor', value: winner.driver, detail: `${winner.constructor} · largou em ${winner.grid || 'box'}º`, row: winner });
  const fl = rows.find((r) => r.fastestLapRank === 1);
  if (fl) out.push({ icon: Timer, label: 'Volta mais rápida', value: fl.driver, detail: fl.fastestLapTime ?? '', row: fl });
  const gains = rows.filter((r) => r.grid > 0 && /Finished|Lap/.test(r.status)).map((r) => ({ r, d: r.grid - r.position })).sort((a, b) => b.d - a.d);
  if (gains[0] && gains[0].d > 0) out.push({ icon: TrendingUp, label: 'Maior escalada', value: gains[0].r.driver, detail: `+${gains[0].d} posições (${gains[0].r.grid}º → ${gains[0].r.position}º)`, row: gains[0].r });
  const pits = rows.filter((r) => r.grid === 0 && r.position <= 10);
  if (pits[0]) out.push({ icon: Gauge, label: 'Do pit lane aos pontos', value: pits[0].driver, detail: `Largou do box e terminou em ${pits[0].position}º`, row: pits[0] });
  return out;
}

function Delta({ d }: { d: number }) {
  if (d > 0) return <span className="inline-flex items-center gap-0.5 font-mono text-xs text-telemetry-green"><ArrowUp className="h-3 w-3" aria-hidden />{d}<span className="sr-only"> posições ganhas</span></span>;
  if (d < 0) return <span className="inline-flex items-center gap-0.5 font-mono text-xs text-race-400"><ArrowDown className="h-3 w-3" aria-hidden />{-d}<span className="sr-only"> posições perdidas</span></span>;
  return <span className="inline-flex items-center text-zinc-600"><Minus className="h-3 w-3" aria-hidden /><span className="sr-only">sem mudança</span></span>;
}

/** Mudanças de posição (largada → chegada) e destaques da corrida. */
export function RaceInsights({ round }: { round: number }) {
  const { state } = useAsync((s) => fetchRaceResults(SEASON, round, s), [round], { refreshMs: LIVE_REFRESH_MS });
  if (state.status !== 'success' || !state.data.length) return null;
  const rows = state.data;
  const hl = raceHighlights(rows);
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 [&>*]:min-w-0">
        {hl.map((h) => {
          const local = findDriver({ driverId: h.row.driverId, code: h.row.code });
          const team = local ? teamById(local.teamId) : teamFor(h.row.constructorId, h.row.constructor);
          return (
            <div key={h.label} className="surface relative flex items-center gap-4 overflow-hidden p-4">
              <span className="absolute inset-y-0 left-0 w-1" style={{ background: team?.color ?? '#e10600' }} aria-hidden />
              {local && team ? <DriverPhoto driver={local} team={team} width={160} className="h-14 w-14 shrink-0 rounded-full bg-white/5" /> : <h.icon className="h-8 w-8 text-race" aria-hidden />}
              <div className="min-w-0">
                <p className="kicker flex items-center gap-1.5 text-zinc-500"><h.icon className="h-3.5 w-3.5" aria-hidden />{h.label}</p>
                <p className="truncate font-display text-lg font-black uppercase text-white">{h.value}</p>
                <p className="text-xs text-zinc-400">{h.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div>
        <p className="kicker mb-3 text-zinc-400">Mudanças de posição · largada → chegada</p>
        <ol className="surface grid divide-y divide-white/[0.05] sm:grid-cols-2 sm:divide-y-0">
          {rows.map((r) => {
            const local = findDriver({ driverId: r.driverId, code: r.code });
            const team = local ? teamById(local.teamId) : teamFor(r.constructorId, r.constructor);
            const classified = /Finished|Lap/.test(r.status);
            return (
              <li key={r.driverId} className="flex items-center gap-3 px-4 py-2 sm:border-b sm:border-white/[0.05]">
                <span className="w-6 font-display text-base font-black text-white tabular">{r.position}</span>
                <span className="h-5 w-1 rounded" style={{ background: team?.color ?? '#71717a' }} aria-hidden />
                {local ? <Link to={`/pilotos/${local.id}`} className="flex-1 truncate text-sm font-semibold text-zinc-100 hover:text-race-400">{r.driver}</Link> : <span className="flex-1 truncate text-sm font-semibold text-zinc-100">{r.driver}</span>}
                <span className="font-mono text-[11px] text-zinc-500">{r.grid ? `P${r.grid}` : 'Box'}</span>
                {classified && r.grid ? <Delta d={r.grid - r.position} /> : <span className="text-[11px] text-zinc-500">{classified ? '—' : 'Aband.'}</span>}
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-[11px] text-zinc-500">Fonte: {API_SOURCE.label}.</p>
      </div>
    </div>
  );
}
