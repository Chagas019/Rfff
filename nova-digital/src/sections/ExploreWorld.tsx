import { AnimatePresence, motion } from 'framer-motion';
import { Database, Loader2, Search, X } from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { CityPanel } from '../components/CityPanel';
import { CityTooltip } from '../components/CityTooltip';
import { GlobeControls } from '../components/GlobeControls';
import { GlobeView } from '../components/GlobeView';
import type { HighlightSpec } from '../components/globe/Effects';
import { FadeUp, MaskTitle } from '../components/Reveal';
import { CONTINENTS, REGIONS } from '../data/site';
import type { City, ContinentId, RegionId } from '../data/types';
import { useGlobeController, useSyncReducedMotion } from '../hooks/useGlobeController';
import { useInView } from '../hooks/useInView';
import { useNetwork } from '../hooks/useNetwork';
import type { Quality } from '../lib/device';
import { foldText, rotationToFace } from '../lib/geo';

const START = rotationToFace(20, -20);
const CONTINENT_ORDER: ContinentId[] = ['north-america', 'south-america', 'europe', 'africa', 'asia', 'oceania', 'antarctica'];

interface ExploreWorldProps {
  quality: Quality;
  reduced: boolean;
}

export function ExploreWorld({ quality, reduced }: ExploreWorldProps) {
  const { cities, routes, byId, demo, source } = useNetwork();
  const controller = useGlobeController({ x: START.x, y: START.y, distance: 4.3 }, { minDistance: 1.7, maxDistance: 7 });
  useSyncReducedMotion(controller, reduced);

  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const globeBox = useRef<HTMLDivElement>(null);
  const mount = useInView(section, '700px', true);
  const active = useInView(globeBox, '0px');
  const hintId = useId();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [continent, setContinent] = useState<ContinentId | null>(null);
  const [region, setRegion] = useState<RegionId | 'all'>('all');
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState<HighlightSpec | null>(null);
  const [hover, setHover] = useState<{ city: City; x: number; y: number } | null>(null);
  const [ready, setReady] = useState(false);
  const [wheelHint, setWheelHint] = useState(false);

  const selected = selectedId ? (byId.get(selectedId) ?? null) : null;

  const visibleCities = useMemo(() => cities.filter((c) => region === 'all' || c.region === region), [cities, region]);
  const results = useMemo(() => {
    const q = foldText(query);
    return visibleCities
      .filter((c) => !continent || c.continent === continent)
      .filter((c) => !q || foldText(`${c.name} ${c.country}`).includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [visibleCities, continent, query]);

  useEffect(() => {
    if (!wheelHint) return;
    const id = window.setTimeout(() => setWheelHint(false), 1600);
    return () => window.clearTimeout(id);
  }, [wheelHint]);

  const selectCity = useCallback(
    (city: City) => {
      setSelectedId(city.id);
      setHover(null);
      controller.focus(city.lat, city.lon, 3.0);
    },
    [controller],
  );

  const selectContinent = useCallback(
    (id: ContinentId | null, origin?: { lat: number; lon: number }) => {
      setContinent(id);
      if (!id) {
        setHighlight(null);
        return;
      }
      const c = CONTINENTS[id];
      setHighlight({ continent: id, lat: origin?.lat ?? c.lat, lon: origin?.lon ?? c.lon, key: Date.now() });
      if (!origin) controller.focus(c.lat, c.lon, 3.8);
    },
    [controller],
  );

  const clearAll = useCallback(() => {
    setSelectedId(null);
    setContinent(null);
    setHighlight(null);
    setQuery('');
    setRegion('all');
    controller.release();
    controller.setZoom(controller.initialView.distance);
  }, [controller]);

  const resetView = useCallback(() => {
    setSelectedId(null);
    setHighlight(null);
    setContinent(null);
    controller.reset();
  }, [controller]);

  const center = useCallback(() => {
    if (selected) controller.focus(selected.lat, selected.lon, 3.0);
    else controller.reset();
  }, [controller, selected]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = 0.18;
    const map: Record<string, () => void> = {
      ArrowLeft: () => controller.nudge(0, step),
      ArrowRight: () => controller.nudge(0, -step),
      ArrowUp: () => controller.nudge(step, 0),
      ArrowDown: () => controller.nudge(-step, 0),
      '+': () => controller.zoomBy(1 / 1.15),
      '=': () => controller.zoomBy(1 / 1.15),
      '-': () => controller.zoomBy(1.15),
      '0': center,
      Home: resetView,
      Escape: clearAll,
    };
    const fn = map[e.key];
    if (fn) {
      e.preventDefault();
      fn();
    }
  };

  const hasSelection = selectedId !== null || continent !== null || highlight !== null || query !== '' || region !== 'all';

  return (
    <section ref={section} id="explore" aria-labelledby="explore-title" className="relative py-28 sm:py-36">
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <FadeUp className="eyebrow mb-6">Explore — Interactive</FadeUp>
            <MaskTitle
              id="explore-title"
              lines={['Explore', 'the planet.']}
              className="display text-[clamp(3rem,9vw,8.5rem)] uppercase"
              lineClassName={(i) => (i === 1 ? 'text-ink-mute' : 'text-ink')}
            />
          </div>
          <FadeUp delay={0.1}>
            <p className="max-w-md text-lg leading-relaxed text-ink-soft lg:ml-auto">
              Escolha um continente, busque uma cidade ou filtre por região. A câmera viaja até o ponto e o painel mostra os detalhes e as
              rotas.
            </p>
          </FadeUp>
        </div>

        <div className="mt-14 grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* ---------- ferramentas ---------- */}
          <aside
            className="glass flex min-w-0 flex-col gap-5 rounded-3xl p-5 lg:max-h-[min(82svh,780px)]"
            aria-label="Ferramentas de exploração"
          >
            <div>
              <label htmlFor="city-search" className="eyebrow mb-2 block">
                Buscar cidade
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" aria-hidden />
                <input
                  id="city-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && results[0]) selectCity(results[0]);
                  }}
                  placeholder="Ex.: São Paulo, Tóquio…"
                  autoComplete="off"
                  className="field pl-10"
                  aria-controls="city-results"
                />
              </div>
            </div>

            <fieldset>
              <legend className="eyebrow mb-2">Continente</legend>
              <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 lg:flex-wrap">
                {CONTINENT_ORDER.map((id) => {
                  const on = continent === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => selectContinent(on ? null : id)}
                      className={`min-h-[40px] whitespace-nowrap rounded-full border px-3.5 text-xs transition-colors ${
                        on
                          ? 'border-volt-400/70 bg-volt-500/15 text-ink'
                          : 'border-white/10 text-ink-soft hover:border-white/30 hover:text-ink'
                      }`}
                    >
                      {CONTINENTS[id].label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label htmlFor="region-filter" className="eyebrow mb-2 block">
                Filtrar por região
              </label>
              <select id="region-filter" value={region} onChange={(e) => setRegion(e.target.value as RegionId | 'all')} className="field">
                <option value="all">Todas as regiões</option>
                {(Object.keys(REGIONS) as RegionId[]).map((r) => (
                  <option key={r} value={r}>
                    {REGIONS[r]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="mb-2 flex items-center justify-between">
                <p className="eyebrow" id="city-results-label">
                  Cidades ({results.length})
                </p>
                {hasSelection && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="flex min-h-[32px] items-center gap-1 rounded-full px-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-mute hover:text-ink"
                  >
                    <X className="h-3 w-3" aria-hidden /> Limpar
                  </button>
                )}
              </div>
              <ul
                id="city-results"
                aria-labelledby="city-results-label"
                className="-mx-2 max-h-56 min-h-0 flex-1 overflow-y-auto px-2 lg:max-h-none"
              >
                {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-ink-mute">Nenhuma cidade encontrada.</li>}
                {results.map((c) => {
                  const on = selectedId === c.id;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => selectCity(c)}
                        aria-current={on ? 'true' : undefined}
                        className={`flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                          on ? 'bg-amber-glow/10 text-ink' : 'text-ink-soft hover:bg-white/[0.05] hover:text-ink'
                        }`}
                      >
                        <span className="min-w-0 truncate text-sm">{c.name}</span>
                        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-mute">{c.country}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <p className="flex items-start gap-2 border-t border-white/[0.06] pt-4 text-[11px] leading-relaxed text-ink-mute">
              <Database className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                {demo ? 'Dados de demonstração' : 'Fonte de dados'}: <span className="break-all">{source}</span>
              </span>
            </p>
          </aside>

          {/* ---------- palco do globo ---------- */}
          <div ref={stage} className="explore-stage relative min-w-0">
            <div
              ref={globeBox}
              className="explore-globe relative h-[68svh] min-h-[420px] overflow-hidden rounded-3xl border border-white/[0.06] bg-[radial-gradient(60%_60%_at_50%_45%,rgba(61,123,255,0.12),transparent_70%)] outline-none focus-visible:ring-2 focus-visible:ring-amber-glow/70 lg:h-[min(82svh,780px)]"
              tabIndex={0}
              onKeyDown={onKeyDown}
              aria-label="Globo interativo"
              aria-describedby={hintId}
            >
              <p id={hintId} className="sr-only">
                Use as setas para girar, + e - para zoom, 0 para centralizar, Home para voltar à posição inicial e Esc para limpar a
                seleção. As cidades também podem ser escolhidas pela lista de busca.
              </p>
              <GlobeView
                mode="explore"
                mount={mount}
                controller={controller}
                cities={visibleCities}
                routes={routes}
                byId={byId}
                selectedId={selectedId}
                highlight={highlight}
                active={active}
                quality={quality}
                reduced={reduced}
                onHoverCity={(city, x, y) => setHover(city ? { city, x, y } : null)}
                onSelectCity={selectCity}
                onContinent={(id, lat, lon) => selectContinent(id, { lat, lon })}
                onDoubleClick={resetView}
                onWheelHint={() => setWheelHint(true)}
                onReady={() => setReady(true)}
                onFallback={() => setReady(true)}
                focus={selected}
              />

              {!ready && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center" role="status">
                  <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-mute">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Carregando o globo
                  </span>
                </div>
              )}

              <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
                {continent && (
                  <span className="glass rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink">
                    <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-volt-400 align-middle" />
                    {CONTINENTS[continent].label}
                  </span>
                )}
              </div>

              <AnimatePresence>
                {wheelHint && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="pointer-events-none absolute inset-0 grid place-items-center bg-void/40 text-sm text-ink"
                  >
                    Use Ctrl + rolagem (⌘ no Mac) ou os botões para aproximar
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
                <GlobeControls
                  controller={controller}
                  onCenter={center}
                  onClear={clearAll}
                  canClear={hasSelection}
                  fullscreenTarget={stage}
                />
              </div>
            </div>

            <div className="explore-panel pointer-events-none z-20 mt-3 lg:absolute lg:bottom-4 lg:right-4 lg:top-4 lg:mt-0 lg:w-[340px]">
              <CityPanel
                city={selected}
                variant="docked"
                onClose={() => {
                  setSelectedId(null);
                  controller.release();
                }}
                onSelect={selectCity}
                className="lg:max-h-full"
              />
            </div>
          </div>
        </div>
      </div>
      <CityTooltip hover={hover} />
    </section>
  );
}
