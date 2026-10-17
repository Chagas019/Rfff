import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CountUp } from '../components/CountUp';
import { PageHeader } from '../components/PageHeader';
import { SourceNote } from '../components/SourceNote';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { SEASON } from '../data/calendar2026';
import { drivers } from '../data/drivers';
import { teams } from '../data/teams';
import { useAsync } from '../hooks/useAsync';
import { API_BASE, API_SOURCE, LIVE_REFRESH_MS, fetchConstructorStandings, fetchDriverStandings } from '../services/f1Api';
import { LiveBadge } from '../components/LiveBadge';
import { normalize } from '../utils/format';

/** Associa o construtor da API à equipe local (para usar as cores). */
function teamFor(constructorId: string, name: string) {
  const n = normalize(`${constructorId} ${name}`).replace(/_/g, ' ');
  return teams.find((t) => n.includes(normalize(t.name)) || n.includes(t.id.replace('-', ' ')) || (t.id === 'racing-bulls' && /\brb\b|racing bulls/.test(n)));
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5" aria-hidden>
      <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${max ? (value / max) * 100 : 0}%` }} transition={{ duration: 0.8 }} />
    </div>
  );
}

/** Os três primeiros em cartões de vidro com o número gigante da landing (o líder em dourado). */
function Leaders({ items }: { items: { key: string; first: string; last: string; points: number; color: string; to?: string }[] }) {
  return (
    <div className="mb-8 grid gap-3 sm:grid-cols-3">
      {items.slice(0, 3).map((it, i) => {
        const body = (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-white/60">{i + 1}º lugar</span>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: it.color }} aria-hidden />
            </div>
            <p className="mt-3 text-[15px] text-white/70">{it.first}</p>
            <p className="text-3xl font-semibold leading-none tracking-[-0.05em] text-white">{it.last}</p>
            <CountUp
              value={it.points}
              delay={200 + i * 200}
              className={`display-number mt-6 block text-[clamp(72px,9vw,110px)] ${i === 0 ? 'text-gold' : 'text-gradient'}`}
            />
            <span className="text-[13px] text-white/50">pontos</span>
          </>
        );
        const cls = 'panel block rounded-b-none border-b-0 p-5 transition hover:border-gold/40';
        return (
          <motion.div key={it.key} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.12, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            {it.to ? <Link to={it.to} className={cls}>{body}</Link> : <div className={cls}>{body}</div>}
          </motion.div>
        );
      })}
    </div>
  );
}

function DriversTable() {
  const { state, retry, refreshNow, updatedAt, refreshing } = useAsync((signal) => fetchDriverStandings(SEASON, signal), [], { refreshMs: LIVE_REFRESH_MS });
  if (state.status === 'loading' || state.status === 'idle') return <LoadingState label="Carregando classificação de pilotos…" rows={8} />;
  if (state.status === 'error') return <ErrorState message={state.error} onRetry={retry}><Unavailable /></ErrorState>;
  const items = state.data.items;
  if (!items.length) return <EmptyState title="Classificação ainda não publicada" message={`A fonte de dados ainda não tem pontuação para ${SEASON}.`} />;
  const max = items[0].points;
  const leaders = items.map((s) => {
    const local = drivers.find((d) => d.apiId === s.driverId || d.code === s.code);
    return { key: s.driverId, first: s.givenName, last: s.familyName, points: s.points, color: teamFor(s.constructorId, s.constructorName)?.color ?? '#71717a', to: local && `/pilotos/${local.id}` };
  });
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="label">Após a rodada {state.data.round} · temporada {state.data.season}</p>
        <LiveBadge updatedAt={updatedAt} refreshing={refreshing} onRefresh={refreshNow} />
      </div>
      <Leaders items={leaders} />
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">Classificação do campeonato de pilotos</caption>
          <thead className="label bg-white/[0.03]">
            <tr><th className="px-4 py-3">Pos</th><th>Piloto</th><th>Equipe</th><th className="text-right">Vitórias</th><th className="text-right">Pódios</th><th className="px-4 text-right">Pontos</th></tr>
          </thead>
          <tbody>
            {items.map((s, i) => {
              const team = teamFor(s.constructorId, s.constructorName);
              const local = drivers.find((d) => d.apiId === s.driverId || d.code === s.code);
              const color = team?.color ?? '#71717a';
              return (
                <motion.tr key={s.driverId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.025, 0.5) }} className="border-t border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-display text-lg font-semibold text-white">{s.position}</td>
                  <td>
                    <span className="flex items-center gap-3">
                      <span className="h-6 w-1 rounded" style={{ background: color }} aria-hidden />
                      {local ? <Link to={`/pilotos/${local.id}`} className="font-semibold text-white hover:text-gold">{s.givenName} <strong className="">{s.familyName}</strong></Link>
                        : <span className="font-semibold text-white">{s.givenName} <strong className="">{s.familyName}</strong></span>}
                    </span>
                  </td>
                  <td className="text-zinc-400">{s.constructorName}</td>
                  <td className="text-right font-mono">{s.wins}</td>
                  <td className="text-right font-mono">{s.podiums ?? '—'}</td>
                  <td className="w-48 px-4">
                    <CountUp value={s.points} delay={Math.min(i * 40, 600)} className="block text-right text-lg font-semibold tracking-[-0.04em] text-white" />
                    <Bar value={s.points} max={max} color={color} />
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConstructorsTable() {
  const { state, retry, refreshNow, updatedAt, refreshing } = useAsync((signal) => fetchConstructorStandings(SEASON, signal), [], { refreshMs: LIVE_REFRESH_MS });
  if (state.status === 'loading' || state.status === 'idle') return <LoadingState label="Carregando classificação de construtores…" rows={8} />;
  if (state.status === 'error') return <ErrorState message={state.error} onRetry={retry}><Unavailable /></ErrorState>;
  const items = state.data.items;
  if (!items.length) return <EmptyState title="Classificação ainda não publicada" message={`A fonte de dados ainda não tem pontuação para ${SEASON}.`} />;
  const max = items[0].points;
  const leaders = items.map((s) => {
    const team = teamFor(s.constructorId, s.name);
    return { key: s.constructorId, first: 'Equipe', last: s.name, points: s.points, color: team?.color ?? '#71717a', to: team && `/equipes/${team.id}` };
  });
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="label">Após a rodada {state.data.round} · temporada {state.data.season}</p>
        <LiveBadge updatedAt={updatedAt} refreshing={refreshing} onRefresh={refreshNow} />
      </div>
      <Leaders items={leaders} />
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <caption className="sr-only">Classificação do campeonato de construtores</caption>
          <thead className="label bg-white/[0.03]">
            <tr><th className="px-4 py-3">Pos</th><th>Equipe</th><th>Pilotos</th><th className="text-right">Vitórias</th><th className="px-4 text-right">Pontos</th></tr>
          </thead>
          <tbody>
            {items.map((s, i) => {
              const team = teamFor(s.constructorId, s.name);
              const color = team?.color ?? '#71717a';
              return (
                <motion.tr key={s.constructorId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="border-t border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-display text-lg font-semibold text-white">{s.position}</td>
                  <td>
                    <span className="flex items-center gap-3">
                      <span className="h-6 w-1 rounded" style={{ background: color }} aria-hidden />
                      {team ? <Link to={`/equipes/${team.id}`} className="font-bold text-white hover:text-gold">{s.name}</Link> : <span className="font-bold text-white">{s.name}</span>}
                    </span>
                  </td>
                  <td className="text-xs text-zinc-400">{team ? drivers.filter((d) => d.teamId === team.id).map((d) => d.lastName).join(' · ') : '—'}</td>
                  <td className="text-right font-mono">{s.wins}</td>
                  <td className="w-48 px-4">
                    <CountUp value={s.points} delay={Math.min(i * 40, 600)} className="block text-right text-lg font-semibold tracking-[-0.04em] text-white" />
                    <Bar value={s.points} max={max} color={color} />
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Unavailable() {
  return (
    <p className="max-w-lg text-xs text-zinc-500">
      Este site não exibe pontuações inventadas: sem resposta da fonte ({API_BASE}), a tabela fica indisponível. Consulte também a{' '}
      <a href="https://www.formula1.com/en/results/2026/drivers" target="_blank" rel="noreferrer" className="underline">classificação oficial em formula1.com</a>.
    </p>
  );
}

export function StandingsPage() {
  const [tab, setTab] = useState<'drivers' | 'constructors'>('drivers');
  return (
    <>
      <PageHeader kicker={`Campeonato ${SEASON}`} title={<>Classificação <span className="text-gold">ao vivo</span></>}>
        <p>Pontuação real de pilotos e construtores, carregada diretamente da fonte de dados a cada visita.</p>
      </PageHeader>
      <div className="container-grid py-10">
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-telemetry-cyan/20 bg-telemetry-cyan/5 p-4 text-sm text-zinc-300">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-telemetry-cyan" aria-hidden />
          Os dados vêm da {API_SOURCE.label}, que reproduz os resultados oficiais. Pode haver alguns minutos de atraso após cada sessão.
        </div>
        <div role="tablist" aria-label="Tipo de classificação" className="mb-6 inline-flex rounded-xl border border-white/10 p-1">
          {([['drivers', 'Pilotos'], ['constructors', 'Construtores']] as const).map(([key, label]) => (
            <button key={key} role="tab" type="button" id={`tab-${key}`} aria-selected={tab === key} aria-controls={`panel-${key}`} onClick={() => setTab(key)}
              className={`relative rounded-lg px-5 py-2 text-sm font-bold transition ${tab === key ? 'text-black' : 'text-zinc-400 hover:text-white'}`}>
              {tab === key && <motion.span layoutId="tab-bg" className="absolute inset-0 rounded-lg bg-gold" />}
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === 'drivers' ? <DriversTable /> : <ConstructorsTable />}
        </div>
        <SourceNote label={API_SOURCE.label} url={API_SOURCE.url}>Endpoint configurável pela variável VITE_F1_API_BASE.</SourceNote>
      </div>
    </>
  );
}
