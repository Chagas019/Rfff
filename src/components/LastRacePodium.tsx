import { motion } from 'framer-motion';
import { ArrowRight, ArrowUp, Timer, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEASON } from '../data/calendar2026';
import { teamById } from '../data/teams';
import { useAsync } from '../hooks/useAsync';
import { API_SOURCE, LIVE_REFRESH_MS, fetchRaceResults } from '../services/f1Api';
import type { Race, RaceResultRow } from '../types';
import { formatWeekend } from '../utils/format';
import { findDriver, teamFor } from '../utils/season';
import { DriverPhoto } from './DriverPhoto';
import { Flag } from './Flag';
import { LiveBadge } from './LiveBadge';

const ORDER = [1, 0, 2]; // 2º · 1º · 3º
const PEDESTAL = ['h-24 sm:h-32', 'h-16 sm:h-24', 'h-12 sm:h-16'];
const MEDAL = ['#facc15', '#d4d4d8', '#d97706'];

/** Diferença em segundos a partir do texto da Jolpica ("+4.006"); null quando não é numérica. */
export function gapSeconds(time?: string): number | null {
  if (!time || !time.startsWith('+')) return null;
  const parts = time.slice(1).split(':').map(Number);
  if (parts.some((n) => Number.isNaN(n))) return null;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

/** Diferença entre dois pilotos consecutivos do pódio. */
export function gapBetween(a: RaceResultRow, b: RaceResultRow): string | null {
  const ga = a.position === 1 ? 0 : gapSeconds(a.time);
  const gb = gapSeconds(b.time);
  if (ga === null || gb === null) return b.time && !b.time.startsWith('+') ? null : b.time ?? null;
  return `+${(gb - ga).toFixed(3)} s`;
}

function Step({ r, idx, prev }: { r: RaceResultRow; idx: number; prev?: RaceResultRow }) {
  const local = findDriver({ driverId: r.driverId, code: r.code, number: r.number });
  const team = local ? teamById(local.teamId) : teamFor(r.constructorId, r.constructor);
  const color = team?.color ?? '#e10600';
  const winner = idx === 0;
  const gained = r.grid > 0 ? r.grid - r.position : 0;
  const card = (
    <div className={`relative overflow-hidden rounded-t-2xl border border-b-0 border-white/10 ${winner ? 'ring-1 ring-telemetry-yellow/40' : ''}`} style={{ background: `linear-gradient(180deg, ${color}38 0%, ${color}12 55%, #0d0d12 100%)` }}>
      <span className="absolute left-3 top-2 font-display text-5xl font-semibold leading-none text-white/90 sm:text-7xl" aria-hidden>{r.position}</span>
      {winner && <Trophy className="absolute right-3 top-3 h-5 w-5 text-telemetry-yellow" aria-hidden />}
      <div className={`relative mx-auto ${winner ? 'aspect-[4/5] w-[92%]' : 'aspect-[4/5] w-[86%]'} mt-6`}>
        {local && team ? <DriverPhoto driver={local} team={team} width={winner ? 560 : 420} className="h-full w-full" /> : <div className="h-full w-full" />}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0d0d12] to-transparent" aria-hidden />
      </div>
    </div>
  );
  return (
    <li className="flex flex-col" style={{ order: ORDER.indexOf(idx) }}>
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, delay: winner ? 0.15 : 0.3 + idx * 0.08, ease: [0.22, 1, 0.36, 1] }}>
        {local ? <Link to={`/pilotos/${local.id}`} aria-label={`${r.position}º lugar: ${r.driver}`} className="block transition hover:brightness-110">{card}</Link> : card}
        <div className="border-x border-white/10 bg-carbon-900 px-2 pb-3 pt-2 text-center sm:px-3">
          <p className={`font-display font-semibold leading-tight text-white ${winner ? 'text-lg sm:text-2xl' : 'text-sm sm:text-xl'}`}>{r.driver}</p>
          <p className="mt-0.5 flex items-center justify-center gap-1.5 truncate text-[11px] text-zinc-400 sm:text-xs"><span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden />{r.constructor}</p>
          <p className="mt-2 font-mono text-xs text-white tabular sm:text-sm">{winner ? r.time ?? r.status : prev ? gapBetween(prev, r) ?? r.status : r.time}</p>
          <p className="text-[10px] text-zinc-500 sm:text-[11px]">{winner ? 'tempo total' : 'para o ' + (idx === 1 ? '1º' : '2º')}</p>
        </div>
      </motion.div>
      <motion.div
        initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 + idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
        className={`relative origin-bottom border border-t-0 border-white/10 bg-carbon-850 ${PEDESTAL[idx]}`}
      >
        <span className="absolute inset-x-0 top-0 h-1" style={{ background: MEDAL[idx] }} aria-hidden />
        <div className="flex h-full flex-col items-center justify-center gap-1 px-1">
          <span className="font-condensed text-xs font-semibold uppercase tracking-widest text-white sm:text-sm">+{r.points} pts</span>
          <span className="flex flex-wrap items-center justify-center gap-x-2 text-[10px] text-zinc-500 sm:text-[11px]">
            <span>Largou {r.grid ? `${r.grid}º` : 'do box'}</span>
            {gained > 0 && <span className="inline-flex items-center text-telemetry-green"><ArrowUp className="h-3 w-3" aria-hidden />{gained}</span>}
            {r.fastestLapRank === 1 && <span className="inline-flex items-center gap-0.5 text-telemetry-purple"><Timer className="h-3 w-3" aria-hidden />V. rápida</span>}
          </span>
        </div>
      </motion.div>
    </li>
  );
}

/** Pódio da última corrida concluída — resultado oficial, atualizado sozinho. */
export function LastRacePodium({ race }: { race: Race }) {
  const { state, refreshNow, updatedAt, refreshing } = useAsync((signal) => fetchRaceResults(SEASON, race.round!, signal), [race.round], { refreshMs: LIVE_REFRESH_MS });

  let body;
  if (state.status === 'loading' || state.status === 'idle') {
    body = <div className="grid grid-cols-3 items-end gap-3" role="status" aria-label="Carregando pódio">{ORDER.map((i) => <div key={i} className={`animate-pulse rounded-t-2xl bg-white/[0.04] ${i === 0 ? 'h-80' : i === 1 ? 'h-72' : 'h-64'}`} />)}</div>;
  } else if (state.status === 'error' || state.data.length < 3) {
    body = (
      <p className="surface p-6 text-zinc-400">
        {state.status === 'error' ? 'Não foi possível buscar o resultado agora. O site tenta de novo sozinho em alguns minutos.' : 'O resultado oficial ainda não foi publicado pela fonte de dados. Esta seção se atualiza sozinha assim que ele sair.'}
      </p>
    );
  } else {
    const top = state.data.slice(0, 3);
    body = (
      <ol className="mx-auto grid max-w-4xl grid-cols-3 items-end gap-2 sm:gap-4" aria-label="Pódio">
        {top.map((r, idx) => <Step key={r.driverId} r={r} idx={idx} prev={idx > 0 ? top[idx - 1] : undefined} />)}
      </ol>
    );
  }

  return (
    <section aria-labelledby="podium-title">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.08] pb-3">
        <div>
          <p className="kicker flex items-center gap-2 text-gold"><Trophy className="h-3.5 w-3.5" aria-hidden />Pódio · Rodada {race.round} · {formatWeekend(race.weekendStart, race.weekendEnd)}</p>
          <h2 id="podium-title" className="mt-1 text-2xl leading-none sm:text-3xl"><Flag code={race.countryCode} country={race.country} className="mr-2 align-middle" />{race.name}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LiveBadge updatedAt={updatedAt} refreshing={refreshing} onRefresh={refreshNow} />
          <Link to={`/calendario/${race.id}`} className="btn-ghost py-2 text-xs">Resultado completo <ArrowRight className="h-4 w-4" aria-hidden /></Link>
        </div>
      </div>
      {body}
      <p className="mt-3 text-center text-[11px] text-zinc-500">Fonte: {API_SOURCE.label}. Fotos oficiais: Formula 1.</p>
    </section>
  );
}
