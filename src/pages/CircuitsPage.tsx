import { motion } from 'framer-motion';
import { AlertCircle, Compass, Flag as FlagIcon, Route, Search, Timer } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CircuitCard } from '../components/CircuitCard';
import { FavoriteButton } from '../components/FavoriteButton';
import { Flag } from '../components/Flag';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { Reveal } from '../components/Reveal';
import { SourceNote } from '../components/SourceNote';
import { EmptyState } from '../components/States';
import { TrackMap } from '../components/TrackMap';
import { races } from '../data/calendar2026';
import { CIRCUITS_SOURCE, circuits } from '../data/circuits';
import { formatWeekend, normalize } from '../utils/format';

export function CircuitsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [showCancelled, setShowCancelled] = useState(false);

  const ordered = useMemo(
    () => races.map((r) => ({ race: r, circuit: circuits.find((c) => c.id === r.circuitId)! })),
    [],
  );
  const list = ordered.filter(({ race, circuit }) => {
    if (!showCancelled && race.cancelled) return false;
    if (type && circuit.type !== type) return false;
    const q = normalize(query);
    return !q || normalize(`${circuit.name} ${circuit.city} ${circuit.country} ${race.name}`).includes(q);
  });

  const selected = ordered.find((x) => x.circuit.id === id);
  const close = () => navigate('/circuitos', { replace: false });

  return (
    <>
      <PageHeader kicker="Traçados 2026" title={<>Os <span className="text-race">circuitos</span></>}>
        <p>Dos templos da velocidade às ruas iluminadas da noite. Clique em uma pista para ver a ficha técnica completa.</p>
      </PageHeader>
      <div className="container-grid py-10">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Buscar circuito</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
            <input className="input pl-10" placeholder="Buscar circuito, cidade ou país…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <label>
            <span className="sr-only">Tipo de circuito</span>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Todos os tipos</option>
              <option>Permanente</option><option>Rua</option><option>Semipermanente</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" className="h-4 w-4 accent-race" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} />
            Mostrar etapas canceladas
          </label>
        </div>

        {list.length === 0 ? (
          <EmptyState title="Nenhum circuito encontrado" message="Ajuste a busca ou os filtros." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map(({ race, circuit }, i) => (
              <Reveal key={circuit.id} delay={(i % 3) * 0.06}>
                <CircuitCard circuit={circuit} round={race.round} cancelled={race.cancelled} onOpen={() => navigate(`/circuitos/${circuit.id}`)} />
              </Reveal>
            ))}
          </div>
        )}
        <SourceNote label={CIRCUITS_SOURCE.label} url={CIRCUITS_SOURCE.url}>Traçados esquemáticos desenhados para este site (ilustrativos).</SourceNote>
      </div>

      <Modal open={!!selected} onClose={close} title={selected ? selected.circuit.name : 'Circuito'} wide>
        {selected && (
          <div className="grid lg:grid-cols-[1.1fr_1fr]">
            <div className="relative min-h-[320px] bg-gradient-to-br from-carbon-800 to-black p-6">
              <div className="grid-bg absolute inset-0" aria-hidden />
              <motion.div initial={{ scale: 0.85, rotate: -6, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', damping: 18 }} className="relative h-full">
                <TrackMap points={selected.circuit.layout} name={selected.circuit.name} className="h-full max-h-[460px] w-full" />
              </motion.div>
              <p className="absolute bottom-3 left-6 text-[11px] text-zinc-500">Traçado esquemático · ponto branco = linha de chegada</p>
            </div>
            <div className="p-6 sm:p-8">
              <p className="flex items-center gap-2 text-sm text-zinc-400"><Flag code={selected.circuit.countryCode} country={selected.circuit.country} />{selected.circuit.city}, {selected.circuit.country}</p>
              <h2 className="mt-1 pr-10 text-2xl font-black uppercase sm:text-3xl">{selected.circuit.name}</h2>
              <p className="mt-3 text-sm text-zinc-300">{selected.circuit.description}</p>
              {selected.circuit.provisional && (
                <p className="mt-3 flex items-start gap-2 rounded-lg border border-telemetry-yellow/30 bg-telemetry-yellow/10 p-3 text-xs text-telemetry-yellow">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> Circuito novo: dados de projeto divulgados antes da estreia, sujeitos a revisão oficial.
                </p>
              )}
              <dl className="mt-5 grid grid-cols-2 gap-2">
                {[
                  [Route, 'Extensão', `${selected.circuit.lengthKm.toFixed(3)} km`],
                  [Compass, 'Curvas', selected.circuit.turns],
                  [FlagIcon, 'Voltas', selected.circuit.laps],
                  [Route, 'Distância total', `${selected.circuit.raceDistanceKm.toFixed(3)} km`],
                  [Compass, 'Sentido', selected.circuit.direction],
                  [FlagIcon, 'Primeiro GP', selected.circuit.firstGp ?? '—'],
                ].map(([Icon, k, v]) => {
                  const I = Icon as typeof Route;
                  return (
                    <div key={k as string} className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                      <dt className="label flex items-center gap-1.5 text-[10px]"><I className="h-3 w-3" aria-hidden />{k as string}</dt>
                      <dd className="mt-1 font-display font-bold text-white">{v as string}</dd>
                    </div>
                  );
                })}
              </dl>
              <div className="mt-4 rounded-xl border border-telemetry-purple/30 bg-telemetry-purple/10 p-4">
                <p className="label flex items-center gap-2 text-telemetry-purple"><Timer className="h-3.5 w-3.5" aria-hidden />Recorde da volta (corrida)</p>
                {selected.circuit.lapRecord ? (
                  <p className="mt-1 text-white"><span className="font-display text-2xl font-bold">{selected.circuit.lapRecord.time}</span> <span className="text-sm text-zinc-300">— {selected.circuit.lapRecord.driver}, {selected.circuit.lapRecord.year}</span></p>
                ) : (
                  <p className="mt-1 text-sm text-zinc-300">Sem recorde verificado nesta fonte.</p>
                )}
              </div>
              <ul className="mt-4 flex flex-wrap gap-2">
                <li className="chip">{selected.circuit.type}</li>
                {selected.circuit.characteristics.map((c) => <li key={c} className="chip">{c}</li>)}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <FavoriteButton kind="circuit" id={selected.circuit.id} label={selected.circuit.name} variant="full" />
                <Link to={`/calendario/${selected.race.id}`} className="btn-primary">{selected.race.name} · {formatWeekend(selected.race.weekendStart, selected.race.weekendEnd)}</Link>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
