import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CalendarPlus, MapPin, Zap } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { FavoriteButton } from '../components/FavoriteButton';
import { Flag } from '../components/Flag';
import { RaceCountdown } from '../components/RaceCountdown';
import { ShareButton } from '../components/ShareButton';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { StatusBadge } from '../components/StatusBadge';
import { TrackMap } from '../components/TrackMap';
import { SEASON, races } from '../data/calendar2026';
import { circuits } from '../data/circuits';
import { useAsync } from '../hooks/useAsync';
import { useNow } from '../hooks/useNow';
import { API_SOURCE, fetchRaceResults } from '../services/f1Api';
import type { Race } from '../types';
import { formatDateTime, formatWeekend, userTimeZone } from '../utils/format';
import { RACE_DURATION_MS, SESSION_LABELS, getRaceStatus } from '../utils/race';

function icsFor(race: Race): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const events = race.sessions.map((s) => {
    const start = new Date(s.start);
    const end = new Date(start.getTime() + (s.type === 'race' ? RACE_DURATION_MS : 60 * 60 * 1000));
    return ['BEGIN:VEVENT', `UID:${race.id}-${s.type}@gridf1`, `DTSTAMP:${fmt(new Date())}`, `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`, `SUMMARY:F1 ${race.name} — ${SESSION_LABELS[s.type]}`, `LOCATION:${race.city}, ${race.country}`, 'END:VEVENT'].join('\r\n');
  });
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GRID F1//PT-BR', ...events, 'END:VCALENDAR'].join('\r\n');
}

function downloadIcs(race: Race) {
  const blob = new Blob([icsFor(race)], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${race.id}-2026.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function Results({ round }: { round: number }) {
  const { state, retry } = useAsync((signal) => fetchRaceResults(SEASON, round, signal), [round]);
  if (state.status === 'loading' || state.status === 'idle') return <LoadingState label="Carregando resultado oficial…" rows={5} />;
  if (state.status === 'error') return <ErrorState message={state.error} onRetry={retry} />;
  if (!state.data.length) return <EmptyState title="Resultado ainda não publicado" message="A fonte de dados ainda não disponibilizou a classificação final desta corrida." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <caption className="sr-only">Resultado da corrida</caption>
        <thead className="label">
          <tr><th className="py-2">Pos</th><th>Piloto</th><th>Equipe</th><th className="text-right">Largada</th><th className="text-right">Tempo/Status</th><th className="text-right">Pts</th></tr>
        </thead>
        <tbody>
          {state.data.map((r) => (
            <tr key={r.position} className="border-t border-white/5">
              <td className="py-2 font-display font-bold text-white">{r.position}</td>
              <td className="font-semibold text-white">{r.driver}</td>
              <td className="text-zinc-400">{r.constructor}</td>
              <td className="text-right font-mono">{r.grid || 'Box'}</td>
              <td className="text-right font-mono text-zinc-300">{r.time ?? r.status}</td>
              <td className="text-right font-display font-bold text-race-400">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-zinc-500">Fonte: <a href={API_SOURCE.url} className="underline" target="_blank" rel="noreferrer">{API_SOURCE.label}</a></p>
    </div>
  );
}

export function RaceDetailPage() {
  const { id } = useParams();
  const now = useNow(1000);
  const index = races.findIndex((r) => r.id === id);
  const race = races[index];

  if (!race) {
    return (
      <div className="container-grid pb-20 pt-32">
        <EmptyState title="Grande Prêmio não encontrado" message="O endereço pode estar incorreto ou a etapa foi removida do calendário." action={<Link to="/calendario" className="btn-primary">Voltar ao calendário</Link>} />
      </div>
    );
  }

  const circuit = circuits.find((c) => c.id === race.circuitId)!;
  const status = getRaceStatus(race, races, now);
  const prev = races.slice(0, index).reverse().find((r) => !r.cancelled);
  const next = races.slice(index + 1).find((r) => !r.cancelled);

  return (
    <article className="pb-10 pt-24">
      <div className="container-grid">
        <Link to="/calendario" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"><ArrowLeft className="h-4 w-4" aria-hidden />Calendário</Link>

        <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative mt-6 overflow-hidden">
          <span className="pointer-events-none absolute -top-6 right-0 font-display text-[9rem] font-black italic leading-none text-white/[0.04] sm:text-[14rem]" aria-hidden>
            {race.round ? String(race.round).padStart(2, '0') : '✕'}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={status} />
            {race.round && <span className="chip">Rodada {race.round}</span>}
            {race.sprint && <span className="chip border-telemetry-yellow/40 text-telemetry-yellow"><Zap className="h-3 w-3" aria-hidden />Sprint</span>}
          </div>
          <h1 className="mt-4 text-4xl font-black uppercase leading-none sm:text-6xl">
            <Flag code={race.countryCode} country={race.country} className="mr-3 align-middle" />{race.name}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">{race.officialName}</p>
          <p className="mt-3 flex items-center gap-2 text-zinc-300"><MapPin className="h-4 w-4 text-race" aria-hidden />{circuit.name} · {race.city}, {race.country} · {formatWeekend(race.weekendStart, race.weekendEnd)} 2026</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <FavoriteButton kind="race" id={race.id} label={race.name} variant="full" />
            <ShareButton title={race.name} text={`${race.name} — ${formatWeekend(race.weekendStart, race.weekendEnd)} 2026`} path={`/calendario/${race.id}`} />
            {!race.cancelled && (
              <button type="button" className="btn-ghost" onClick={() => downloadIcs(race)}><CalendarPlus className="h-4 w-4" aria-hidden />Adicionar à agenda</button>
            )}
          </div>
        </motion.header>

        {race.cancelled ? (
          <div className="panel mt-10 p-8">
            <p className="font-display text-xl font-bold text-white">Etapa cancelada</p>
            <p className="mt-2 text-zinc-400">{race.cancelledNote}</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <section className="panel p-6" aria-labelledby="schedule-title">
              <h2 id="schedule-title" className="text-xl font-bold uppercase">Programação</h2>
              <p className="mt-1 text-xs text-zinc-500">No seu fuso ({userTimeZone()}). {!race.timesConfirmed && 'Horários estimados — confirme em formula1.com.'}</p>
              <ol className="mt-5 space-y-2">
                {race.sessions.map((s) => {
                  const start = new Date(s.start);
                  const done = now.getTime() > start.getTime() + (s.type === 'race' ? RACE_DURATION_MS : 60 * 60 * 1000);
                  const live = !done && now >= start;
                  return (
                    <li key={s.type} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${s.type === 'race' ? 'border-race/40 bg-race/10' : 'border-white/5 bg-white/[0.02]'} ${done ? 'opacity-50' : ''}`}>
                      <span className="flex items-center gap-3">
                        <span className={`h-2 w-2 rounded-full ${live ? 'animate-pulse bg-telemetry-green' : done ? 'bg-zinc-600' : 'bg-race'}`} aria-hidden />
                        <span className="font-semibold text-white">{SESSION_LABELS[s.type]}</span>
                        {live && <span className="chip border-telemetry-green/40 text-telemetry-green">Ao vivo</span>}
                      </span>
                      <time dateTime={s.start} className="font-mono text-sm text-zinc-300">{formatDateTime(s.start)}</time>
                    </li>
                  );
                })}
              </ol>
              <div className="mt-6">
                <p className="label mb-2">Largada em</p>
                <RaceCountdown race={race} />
              </div>
            </section>

            <section className="panel relative overflow-hidden p-6" aria-labelledby="circuit-title">
              <h2 id="circuit-title" className="text-xl font-bold uppercase">Circuito</h2>
              <p className="text-sm text-zinc-400">{circuit.name}</p>
              <div className="relative my-4 aspect-square max-h-72 w-full">
                <div className="grid-bg absolute inset-0 rounded-xl" aria-hidden />
                <TrackMap points={circuit.layout} name={circuit.name} className="relative h-full w-full" />
              </div>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {[['Extensão', `${circuit.lengthKm.toFixed(3)} km`], ['Curvas', circuit.turns], ['Voltas', circuit.laps], ['Distância', `${circuit.raceDistanceKm.toFixed(3)} km`]].map(([k, v]) => (
                  <div key={k as string} className="rounded-lg bg-white/[0.03] p-3"><dt className="label text-[10px]">{k}</dt><dd className="font-display font-bold text-white">{v}</dd></div>
                ))}
              </dl>
              <Link to={`/circuitos/${circuit.id}`} className="btn-ghost mt-4 w-full">Ficha completa do circuito</Link>
            </section>
          </div>
        )}

        {race.round && status === 'completed' && (
          <section className="panel mt-6 p-6" aria-labelledby="results-title">
            <h2 id="results-title" className="mb-4 text-xl font-bold uppercase">Resultado da corrida</h2>
            <Results round={race.round} />
          </section>
        )}

        <nav className="mt-10 flex justify-between gap-4" aria-label="Etapas vizinhas">
          {prev ? <Link to={`/calendario/${prev.id}`} className="btn-ghost"><ArrowLeft className="h-4 w-4" aria-hidden /><span className="hidden sm:inline">{prev.name}</span><span className="sm:hidden">Anterior</span></Link> : <span />}
          {next ? <Link to={`/calendario/${next.id}`} className="btn-ghost"><span className="hidden sm:inline">{next.name}</span><span className="sm:hidden">Próxima</span><ArrowRight className="h-4 w-4" aria-hidden /></Link> : <span />}
        </nav>
      </div>
    </article>
  );
}
