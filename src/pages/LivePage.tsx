import { Database, Radio, Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { circuits } from '../data/circuits';
import { NextRaceCard } from '../components/hub/NextRaceCard';
import { WeekendCenter } from '../components/live/WeekendCenter';
import { weekendFocus } from '../components/live/useWeekend';
import { HubHeader } from '../components/HubHeader';
import { NewsHub } from '../components/NewsHub';
import { useNow } from '../hooks/useNow';
import { API_SOURCE } from '../services/f1Api';
import { OPENF1_SOURCE } from '../services/openf1';

/** F1 LIVE: sessões do fim de semana, resultados oficiais, direção de prova e notícias. */
export function LivePage() {
  const now = useNow(30_000);
  const { race, mode, next } = weekendFocus(now);
  const nextCircuit = next ? circuits.find((c) => c.id === next.circuitId) : undefined;
  const [q, setQ] = useState('');

  return (
    <div className="pb-16 pt-24">
      <header className="container-grid">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div>
            <p className="kicker flex items-center gap-2 text-gold"><Radio className="h-3.5 w-3.5" aria-hidden />Central de informações</p>
            <h1 className="mt-2 text-5xl leading-none sm:text-7xl">F1 <span className="text-gold">Live</span></h1>
            <p className="mt-3 max-w-2xl text-zinc-400">
              {mode === 'live'
                ? 'Fim de semana em andamento: tempos de cada sessão, comunicados da direção de prova e as notícias mais recentes.'
                : 'Nenhum fim de semana em andamento agora. Veja como foi a última etapa, o que vem a seguir e as notícias do paddock.'}
            </p>
          </div>
          <p className="flex max-w-sm items-start gap-2 text-xs text-zinc-500">
            <Database className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>Nada aqui é simulado. Tempos e direção de prova: <a className="underline-offset-2 hover:underline" href={OPENF1_SOURCE.url} target="_blank" rel="noreferrer">OpenF1</a>, publicados após cada sessão. Campeonato: <a className="underline-offset-2 hover:underline" href={API_SOURCE.url} target="_blank" rel="noreferrer">Jolpica-F1</a>. Cada bloco mostra quando foi atualizado.</span>
          </p>
        </div>
      </header>

      <div className="container-grid mt-8 space-y-14">
        {race ? <WeekendCenter race={race} now={now} mode={mode} /> : <p className="surface p-6 text-zinc-400">A temporada ainda não começou.</p>}

        {mode === 'recent' && (
          <section aria-label="Próxima etapa" className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <NextRaceCard />
            {nextCircuit ? (
              <div className="panel p-6">
                <p className="kicker text-zinc-400">Conheça a pista</p>
                <h2 className="mt-2 text-2xl">{nextCircuit.name}</h2>
                <p className="mt-2 text-sm text-zinc-400">{nextCircuit.description}</p>
                <ul className="mt-4 flex flex-wrap gap-2">{nextCircuit.characteristics.map((c) => <li key={c} className="chip">{c}</li>)}</ul>
                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  {[
                    ['Tipo', nextCircuit.type], ['Sentido', nextCircuit.direction],
                    ['Distância', `${nextCircuit.raceDistanceKm.toFixed(3)} km`], ['Primeiro GP', nextCircuit.firstGp ?? '—'],
                  ].map(([k, v]) => <div key={k as string} className="rounded-lg bg-white/[0.03] p-3"><dt className="kicker text-[10px] text-zinc-500">{k}</dt><dd className="mt-1 font-semibold text-white">{v}</dd></div>)}
                </dl>
                {nextCircuit.lapRecord && <p className="mt-4 text-sm text-zinc-400">Recorde de volta em corrida: <strong className="text-white">{nextCircuit.lapRecord.time}</strong> · {nextCircuit.lapRecord.driver} ({nextCircuit.lapRecord.year})</p>}
                <Link to={`/circuitos/${nextCircuit.id}`} className="btn-ghost mt-5 py-2 text-xs">Ficha completa do circuito</Link>
              </div>
            ) : null}
          </section>
        )}

        <section aria-labelledby="news-title">
          <HubHeader
            kicker="Notícias"
            title={<span id="news-title">Últimas do paddock</span>}
            action={(
              <label className="relative">
                <span className="sr-only">Buscar nas notícias</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
                <input className="input w-56 py-2 pl-9 text-sm" placeholder="Piloto, equipe, GP…" value={q} onChange={(e) => setQ(e.target.value)} />
              </label>
            )}
          />
          <NewsHub variant="full" query={q} />
        </section>
      </div>
    </div>
  );
}
