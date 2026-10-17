import { AnimatePresence, motion } from 'framer-motion';
import { LayoutGrid, List, RotateCcw, Search } from 'lucide-react';
import { useMemo } from 'react';
import { PageHeader } from '../components/PageHeader';
import { RaceCard } from '../components/RaceCard';
import { SourceNote } from '../components/SourceNote';
import { EmptyState } from '../components/States';
import { CALENDAR_SOURCE, races } from '../data/calendar2026';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useNow } from '../hooks/useNow';
import type { RaceStatus } from '../types';
import { EMPTY_FILTERS, filterRaces, type CalendarFilters } from '../utils/filters';
import { MONTH_NAMES, raceMonth, userTimeZone } from '../utils/format';
import { STATUS_LABELS, getRaceStatus } from '../utils/race';

const STATUS_OPTIONS: (RaceStatus | 'all')[] = ['all', 'upcoming', 'live', 'completed', 'cancelled'];

export function CalendarPage() {
  const now = useNow(60000);
  const [view, setView] = useLocalStorage<'grid' | 'list'>('gridf1:calendar-view', 'grid');
  const [filters, setFilters] = useLocalStorage<CalendarFilters>('gridf1:calendar-filters', EMPTY_FILTERS);
  const f = { ...EMPTY_FILTERS, ...filters };

  const countries = useMemo(() => [...new Set(races.map((r) => r.country))].sort((a, b) => a.localeCompare(b, 'pt-BR')), []);
  const months = useMemo(() => [...new Set(races.map((r) => raceMonth(r.weekendEnd)))].sort((a, b) => a - b), []);
  const result = filterRaces(races, f, now);
  const active = f.query || f.country || f.month !== null || f.status !== 'all';
  const set = (patch: Partial<CalendarFilters>) => setFilters({ ...f, ...patch });

  return (
    <>
      <PageHeader kicker="Temporada 2026" title={<>Calendário <span className="text-gold">interativo</span></>}>
        <p>22 Grandes Prêmios confirmados. Filtre por país, mês ou status, busque pelo nome e alterne entre cards e lista. Horários exibidos no seu fuso ({userTimeZone()}).</p>
      </PageHeader>

      <div className="container-grid py-10">
        <div className="panel sticky top-20 z-30 mb-8 flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Buscar Grande Prêmio</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
            <input className="input pl-10" placeholder="Buscar GP, cidade ou país…" value={f.query} onChange={(e) => set({ query: e.target.value })} />
          </label>
          <div className="grid grid-cols-3 gap-2 lg:flex">
            <label>
              <span className="sr-only">Filtrar por país</span>
              <select className="input" value={f.country} onChange={(e) => set({ country: e.target.value })}>
                <option value="">Todos os países</option>
                {countries.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Filtrar por mês</span>
              <select className="input" value={f.month ?? ''} onChange={(e) => set({ month: e.target.value === '' ? null : Number(e.target.value) })}>
                <option value="">Todos os meses</option>
                {months.map((m) => <option key={m} value={m}>{MONTH_NAMES[m]}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Filtrar por status</span>
              <select className="input" value={f.status} onChange={(e) => set({ status: e.target.value as CalendarFilters['status'] })}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === 'all' ? 'Todos os status' : STATUS_LABELS[s]}</option>)}
              </select>
            </label>
          </div>
          <div className="flex items-center gap-2">
            {active && (
              <button type="button" className="btn-icon" onClick={() => setFilters(EMPTY_FILTERS)} aria-label="Limpar filtros" title="Limpar filtros">
                <RotateCcw className="h-4 w-4" aria-hidden />
              </button>
            )}
            <div className="flex rounded-lg border border-white/10 p-1" role="group" aria-label="Modo de visualização">
              {(['grid', 'list'] as const).map((v) => {
                const Icon = v === 'grid' ? LayoutGrid : List;
                return (
                  <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v} aria-label={v === 'grid' ? 'Ver em cards' : 'Ver em lista'}
                    className={`flex h-8 w-9 items-center justify-center rounded-md transition ${view === v ? 'bg-gold text-black' : 'text-zinc-400 hover:text-white'}`}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <p className="label mb-4" aria-live="polite">{result.length} {result.length === 1 ? 'etapa encontrada' : 'etapas encontradas'}</p>

        {result.length === 0 ? (
          <EmptyState title="Nenhuma etapa encontrada" message="Tente outro termo ou remova alguns filtros." action={<button type="button" className="btn-ghost" onClick={() => setFilters(EMPTY_FILTERS)}>Limpar filtros</button>} />
        ) : (
          <motion.div layout className={view === 'grid' ? 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col gap-3'}>
            <AnimatePresence mode="popLayout">
              {result.map((r) => (
                <motion.div key={r.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25 }}>
                  <RaceCard race={r} status={getRaceStatus(r, races, now)} view={view} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        <SourceNote label={CALENDAR_SOURCE.label} url={CALENDAR_SOURCE.url}>
          Datas oficiais; horários das sessões estimados. Dados em <code className="text-zinc-400">src/data/calendar2026.ts</code>, atualizado em {CALENDAR_SOURCE.updatedAt}.
        </SourceNote>
      </div>
    </>
  );
}
