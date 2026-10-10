import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DriverCard } from '../components/DriverCard';
import { FavoriteButton } from '../components/FavoriteButton';
import { Flag } from '../components/Flag';
import { HelmetAvatar } from '../components/HelmetAvatar';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { Reveal } from '../components/Reveal';
import { SourceNote } from '../components/SourceNote';
import { EmptyState, ErrorState } from '../components/States';
import { SEASON } from '../data/calendar2026';
import { DRIVERS_SOURCE, drivers } from '../data/drivers';
import { teamById, teams } from '../data/teams';
import { useAsync } from '../hooks/useAsync';
import { API_SOURCE, fetchDriverStandings } from '../services/f1Api';
import type { Driver } from '../types';
import { age, normalize } from '../utils/format';

function SeasonStats({ driver }: { driver: Driver }) {
  const { state, retry } = useAsync((signal) => fetchDriverStandings(SEASON, signal), []);
  if (state.status === 'loading' || state.status === 'idle') {
    return <div className="grid grid-cols-4 gap-2" role="status" aria-label="Carregando estatísticas">{[0, 1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />)}</div>;
  }
  if (state.status === 'error') return <ErrorState message={`${state.error} As estatísticas da temporada vêm da ${API_SOURCE.label}.`} onRetry={retry} />;
  const row = state.data.items.find((s) => s.driverId === driver.apiId || s.code === driver.code);
  if (!row) return <p className="text-sm text-zinc-400">Este piloto ainda não aparece na classificação publicada pela fonte de dados.</p>;
  return (
    <div>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[['Posição', `${row.position}º`], ['Pontos', row.points], ['Vitórias', row.wins], ['Pódios', row.podiums ?? '—']].map(([k, v]) => (
          <div key={k as string} className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
            <dt className="label text-[10px]">{k}</dt>
            <dd className="font-display text-2xl font-black text-white">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-[11px] text-zinc-500">Temporada {state.data.season}, após a rodada {state.data.round}. Fonte: {API_SOURCE.label}.</p>
    </div>
  );
}

export function DriversPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [team, setTeam] = useState('');
  const [sort, setSort] = useState<'team' | 'number' | 'name'>('team');

  const list = drivers
    .filter((d) => (!team || d.teamId === team) && (!query || normalize(`${d.firstName} ${d.lastName} ${d.code} ${d.number} ${d.nationality}`).includes(normalize(query))))
    .sort((a, b) =>
      sort === 'number' ? a.number - b.number
      : sort === 'name' ? a.lastName.localeCompare(b.lastName, 'pt-BR')
      : teams.findIndex((t) => t.id === a.teamId) - teams.findIndex((t) => t.id === b.teamId));

  const selected = drivers.find((d) => d.id === id);
  const selTeam = selected ? teamById(selected.teamId)! : undefined;

  return (
    <>
      <PageHeader kicker="Grid 2026" title={<>Os <span className="text-race">pilotos</span></>}>
        <p>22 pilotos, 11 equipes. Clique em um card para ver biografia, trajetória e números da temporada.</p>
      </PageHeader>
      <div className="container-grid py-10">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Buscar piloto</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
            <input className="input pl-10" placeholder="Nome, número ou nacionalidade…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <label>
            <span className="sr-only">Filtrar por equipe</span>
            <select className="input" value={team} onChange={(e) => setTeam(e.target.value)}>
              <option value="">Todas as equipes</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Ordenar</span>
            <select className="input" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
              <option value="team">Ordenar por equipe</option>
              <option value="number">Ordenar por número</option>
              <option value="name">Ordenar por sobrenome</option>
            </select>
          </label>
        </div>

        {list.length === 0 ? (
          <EmptyState title="Nenhum piloto encontrado" message="Tente outro nome ou equipe." />
        ) : (
          <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((d, i) => (
              <Reveal key={d.id} delay={(i % 4) * 0.05}>
                <DriverCard driver={d} onOpen={() => navigate(`/pilotos/${d.id}`)} />
              </Reveal>
            ))}
          </motion.div>
        )}
        <SourceNote label={DRIVERS_SOURCE.label} url={DRIVERS_SOURCE.url}>Capacetes são artes geradas nas cores das equipes, não fotos oficiais.</SourceNote>
      </div>

      <Modal open={!!selected} onClose={() => navigate('/pilotos')} title={selected ? `${selected.firstName} ${selected.lastName}` : 'Piloto'} accent={selTeam?.color} wide>
        {selected && selTeam && (
          <div>
            <div className="relative overflow-hidden p-6 sm:p-8" style={{ background: `linear-gradient(120deg, ${selTeam.color}33, transparent 60%)` }}>
              <span className="pointer-events-none absolute -right-4 -top-8 font-display text-[10rem] font-black italic leading-none opacity-15" style={{ color: selTeam.color }} aria-hidden>{selected.number}</span>
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
                <motion.div initial={{ rotate: -10, scale: 0.8, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 14 }}>
                  <HelmetAvatar color={selTeam.color} accent={selTeam.accent} number={selected.number} code={selected.code} className="h-40 w-40" />
                </motion.div>
                <div>
                  <p className="label" style={{ color: selTeam.color }}>#{selected.number} · {selTeam.name}</p>
                  <h2 className="text-3xl font-black uppercase leading-none sm:text-5xl">{selected.firstName}<br />{selected.lastName}</h2>
                  <p className="mt-2 flex items-center gap-2 text-zinc-300"><Flag code={selected.countryCode} country={selected.nationality} />{selected.nationality}</p>
                </div>
              </div>
            </div>
            <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-2">
              <div>
                <h3 className="label mb-2">Biografia</h3>
                <p className="text-zinc-300">{selected.bio}</p>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  {[
                    ['Nascimento', `${new Date(`${selected.birthDate}T00:00:00`).toLocaleDateString('pt-BR')} (${age(selected.birthDate)} anos)`],
                    ['Local', selected.birthPlace],
                    ['Estreia na F1', selected.debutYear],
                    ['Títulos mundiais', selected.worldTitles],
                  ].map(([k, v]) => (
                    <div key={k as string} className="rounded-lg bg-white/[0.03] p-3"><dt className="label text-[10px]">{k}</dt><dd className="font-semibold text-white">{v}</dd></div>
                  ))}
                </dl>
                <p className="mt-2 text-[11px] text-zinc-500">Títulos contabilizados até o fim da temporada 2025.</p>
              </div>
              <div>
                <h3 className="label mb-2">Trajetória</h3>
                <ol className="relative space-y-3 border-l border-white/10 pl-5">
                  {selected.career.map((c) => (
                    <li key={c} className="relative text-sm text-zinc-300">
                      <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full" style={{ background: selTeam.color }} aria-hidden />
                      {c}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="lg:col-span-2">
                <h3 className="label mb-2">Temporada {SEASON} · dados em tempo real</h3>
                <SeasonStats driver={selected} />
              </div>
              <div className="flex flex-wrap gap-3 lg:col-span-2">
                <FavoriteButton kind="driver" id={selected.id} label={`${selected.firstName} ${selected.lastName}`} variant="full" />
                <button type="button" className="btn-ghost" onClick={() => navigate(`/equipes/${selTeam.id}`)}>Ver equipe {selTeam.name}</button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
