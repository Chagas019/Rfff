import { motion } from 'framer-motion';
import { ArrowUpRight, MapPin, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { circuits } from '../data/circuits';
import type { Race, RaceStatus } from '../types';
import { formatDateTime, formatWeekend } from '../utils/format';
import { SESSION_LABELS } from '../utils/race';
import { FavoriteButton } from './FavoriteButton';
import { Flag } from './Flag';
import { StatusBadge } from './StatusBadge';
import { TrackMap } from './TrackMap';

interface Props { race: Race; status: RaceStatus; view?: 'grid' | 'list' }

export function RaceCard({ race, status, view = 'grid' }: Props) {
  const circuit = circuits.find((c) => c.id === race.circuitId);
  const muted = status === 'completed' || status === 'cancelled';
  const roundLabel = race.round ? `R${String(race.round).padStart(2, '0')}` : '—';

  if (view === 'list') {
    return (
      <motion.article layout className={`panel panel-hover group flex flex-col gap-4 p-4 sm:flex-row sm:items-center ${muted ? 'opacity-70' : ''}`}>
        <div className="flex items-center gap-4 sm:w-64">
          <span className="font-display text-2xl font-black text-race">{roundLabel}</span>
          <Flag code={race.countryCode} country={race.country} className="text-3xl" />
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold uppercase">{race.name}</h3>
            <p className="text-xs text-zinc-400">{race.city}</p>
          </div>
        </div>
        <div className="flex-1 text-sm text-zinc-400">
          <span className="font-mono">{formatWeekend(race.weekendStart, race.weekendEnd)}</span>
          <span className="mx-2 text-zinc-600">·</span>
          {circuit?.name}
        </div>
        <div className="flex items-center gap-2">
          {race.sprint && <span className="chip border-telemetry-yellow/40 text-telemetry-yellow"><Zap className="h-3 w-3" aria-hidden />Sprint</span>}
          <StatusBadge status={status} />
          <FavoriteButton kind="race" id={race.id} label={race.name} />
          <Link to={`/calendario/${race.id}`} className="btn-icon" aria-label={`Ver detalhes do ${race.name}`}>
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article layout className={`panel panel-hover group flex h-full flex-col ${muted ? 'opacity-75' : ''}`}>
      <div className="relative flex items-start justify-between gap-3 p-5 pb-0">
        <div>
          <span className="font-display text-4xl font-black leading-none text-white/10 transition group-hover:text-race/40">{roundLabel}</span>
          <h3 className="mt-2 text-lg font-bold uppercase leading-tight">{race.name}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
            <Flag code={race.countryCode} country={race.country} /> {race.city}, {race.country}
          </p>
        </div>
        <FavoriteButton kind="race" id={race.id} label={race.name} />
      </div>
      <div className="relative mx-5 my-4 h-28">
        {circuit && <TrackMap points={circuit.layout} name={circuit.name} color={muted ? '#52525b' : '#e10600'} className="h-full w-full" animated={false} />}
      </div>
      <div className="mt-auto space-y-3 border-t border-white/5 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          {race.sprint && <span className="chip border-telemetry-yellow/40 text-telemetry-yellow"><Zap className="h-3 w-3" aria-hidden />Sprint</span>}
          <span className="chip font-mono">{formatWeekend(race.weekendStart, race.weekendEnd)}</span>
        </div>
        {race.cancelled ? (
          <p className="text-xs text-zinc-500">{race.cancelledNote}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-1 text-xs text-zinc-400">
            {race.sessions.filter((s) => s.type !== 'fp2' && s.type !== 'fp3').map((s) => (
              <li key={s.type} className="flex justify-between gap-2">
                <span>{SESSION_LABELS[s.type]}</span>
                <span className="font-mono text-zinc-300">{formatDateTime(s.start)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="flex items-center gap-1 text-xs text-zinc-500"><MapPin className="h-3 w-3" aria-hidden />{circuit?.name}</span>
          <Link to={`/calendario/${race.id}`} className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-race-400 hover:text-white">
            Detalhes <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
