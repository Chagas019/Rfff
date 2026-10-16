import { motion } from 'framer-motion';
import { ArrowRight, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEASON } from '../data/calendar2026';
import { drivers } from '../data/drivers';
import { teamById } from '../data/teams';
import { useAsync } from '../hooks/useAsync';
import { API_SOURCE, LIVE_REFRESH_MS, fetchRaceResults } from '../services/f1Api';
import type { Race } from '../types';
import { normalize } from '../utils/format';
import { DriverHelmet } from './DriverHelmet';
import { Flag } from './Flag';
import { LiveBadge } from './LiveBadge';

const ORDER = [1, 0, 2]; // 2º · 1º · 3º
const HEIGHT = ['h-40 sm:h-48', 'h-28 sm:h-36', 'h-20 sm:h-28'];
const MEDAL = ['#facc15', '#d4d4d8', '#d97706'];

/** Pódio da última corrida concluída — busca o resultado oficial e se atualiza sozinho. */
export function LastRacePodium({ race }: { race: Race }) {
  const { state, refreshNow, updatedAt, refreshing } = useAsync((signal) => fetchRaceResults(SEASON, race.round!, signal), [race.round], { refreshMs: LIVE_REFRESH_MS });

  const header = (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="label flex items-center gap-2 text-race-400"><Trophy className="h-3.5 w-3.5" aria-hidden />Último resultado · Rodada {race.round}</p>
        <h2 id="podium-title" className="mt-2 text-3xl font-black uppercase sm:text-4xl">
          <Flag code={race.countryCode} country={race.country} className="mr-3 align-middle" />{race.name}
        </h2>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <LiveBadge updatedAt={updatedAt} refreshing={refreshing} onRefresh={refreshNow} />
        <Link to={`/calendario/${race.id}`} className="btn-ghost">Resultado completo <ArrowRight className="h-4 w-4" aria-hidden /></Link>
      </div>
    </div>
  );

  let body;
  if (state.status === 'loading' || state.status === 'idle') {
    body = <div className="grid grid-cols-3 items-end gap-3" role="status" aria-label="Carregando pódio">{HEIGHT.map((_, i) => <div key={i} className={`animate-pulse rounded-t-2xl bg-white/5 ${HEIGHT[ORDER[i]]}`} />)}</div>;
  } else if (state.status === 'error' || state.data.length < 3) {
    body = (
      <p className="panel p-6 text-zinc-400">
        {state.status === 'error' ? 'Não foi possível buscar o resultado agora. O site tenta de novo sozinho em alguns minutos.' : 'O resultado oficial ainda não foi publicado pela fonte de dados. Esta seção se atualiza sozinha assim que ele sair.'}
      </p>
    );
  } else {
    const top = state.data.slice(0, 3);
    body = (
      <ol className="grid grid-cols-3 items-end gap-2 sm:gap-4" aria-label="Pódio">
        {ORDER.map((idx, col) => {
          const r = top[idx];
          const local = drivers.find((d) => normalize(`${d.firstName} ${d.lastName}`) === normalize(r.driver)) ?? drivers.find((d) => normalize(r.driver).endsWith(normalize(d.lastName)));
          const team = local ? teamById(local.teamId) : undefined;
          const color = team?.color ?? '#e10600';
          const content = (
            <>
              {local && team && <DriverHelmet driver={local} team={team} className="mx-auto h-20 w-20 sm:h-28 sm:w-28" />}
              <p className="mt-2 font-display text-sm font-black uppercase leading-tight text-white sm:text-lg">{r.driver}</p>
              <p className="truncate text-[11px] text-zinc-400 sm:text-xs">{r.constructor}</p>
              <p className="mt-1 font-mono text-[11px] text-zinc-300 sm:text-xs">{r.time ?? r.status}</p>
            </>
          );
          return (
            <li key={r.position} style={{ order: col }} className="flex flex-col text-center">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 + col * 0.12 }} className="mb-3 px-1">
                {local ? <Link to={`/pilotos/${local.id}`} className="block rounded-xl transition hover:bg-white/[0.04]">{content}</Link> : content}
              </motion.div>
              <motion.div
                initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: col * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className={`relative origin-bottom overflow-hidden rounded-t-2xl border border-b-0 border-white/10 ${HEIGHT[idx]}`}
                style={{ background: `linear-gradient(180deg, ${color}55, ${color}10 70%, transparent)` }}
              >
                <span className="absolute inset-x-0 top-0 h-1" style={{ background: MEDAL[idx] }} aria-hidden />
                <span className="absolute inset-0 flex items-start justify-center pt-3 font-display text-4xl font-black text-white/90 sm:text-6xl">{r.position}</span>
                <span className="absolute bottom-2 inset-x-0 text-center font-condensed text-[10px] uppercase tracking-widest text-zinc-300 sm:text-xs">+{r.points} pts</span>
              </motion.div>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <section className="container-grid pb-20" aria-labelledby="podium-title">
      <div className="panel relative overflow-hidden p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(250,204,21,0.12),transparent_65%)]" aria-hidden />
        {header}
        {body}
        <p className="mt-4 text-[11px] text-zinc-500">Fonte: {API_SOURCE.label}. Atualizado automaticamente a cada poucos minutos.</p>
      </div>
    </section>
  );
}
