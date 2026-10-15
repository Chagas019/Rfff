import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftRight, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Counter } from '../components/Counter';
import { NetworkMap } from '../components/NetworkMap';
import { formatTzDiff } from '../lib/time';
import { FadeUp, MaskTitle } from '../components/Reveal';
import { NETWORK_STATS } from '../data/site';
import type { Route } from '../data/types';
import { useNetwork } from '../hooks/useNetwork';
import { greatCircleKm } from '../lib/geo';
import { otherEnd, routesOf } from '../lib/network';

const KIND_LABEL: Record<Route['kind'], string> = {
  backbone: 'Mídia paga',
  research: 'Dados e insights',
  creative: 'Conteúdo e creators',
};

export function GlobalNetwork() {
  const { cities, routes, byId, demo, warning } = useNetwork();
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [focusCity, setFocusCity] = useState<string | null>(null);

  const route = selectedRoute ? (routes.find((r) => r.id === selectedRoute) ?? null) : null;
  const city = focusCity ? (byId.get(focusCity) ?? null) : null;
  const cityRoutes = useMemo(() => (city ? routesOf(city.id, routes) : []), [city, routes]);

  const selectRoute = (id: string) => {
    setSelectedRoute((cur) => (cur === id ? null : id));
    setFocusCity(null);
  };
  const selectCity = (id: string) => {
    setFocusCity((cur) => (cur === id ? null : id));
    setSelectedRoute(null);
  };
  const clear = () => {
    setSelectedRoute(null);
    setFocusCity(null);
  };

  return (
    <section id="network" aria-labelledby="network-title" className="relative overflow-hidden py-28 sm:py-36">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" aria-hidden />
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <FadeUp className="eyebrow mb-6">Rede — Alcance das campanhas</FadeUp>
            <MaskTitle
              id="network-title"
              lines={['Um planeta.', 'Conexões infinitas.']}
              className="display text-[clamp(2.4rem,3.6vw,3.2rem)]"
              lineClassName={(i) => (i === 1 ? 'text-ink-mute' : 'text-ink')}
            />
          </div>
          <FadeUp delay={0.1}>
            <p className="max-w-md text-lg font-normal leading-[1.4] text-ink-soft lg:ml-auto">
              Cada linha é uma rota de campanha entre dois mercados. Clique em uma linha para ver o tipo de ação, a distância, a diferença
              de fuso e o alcance, ou em uma cidade para destacar todas as campanhas ligadas a ela.
            </p>
          </FadeUp>
        </div>

        <FadeUp className="relative mt-14">
          <div className="relative rounded-card border border-cork bg-transparent p-3 sm:p-6">
            <NetworkMap
              cities={cities}
              routes={routes}
              byId={byId}
              selectedRoute={selectedRoute}
              focusCity={focusCity}
              onSelectRoute={selectRoute}
              onSelectCity={selectCity}
            />

            <AnimatePresence>
              {(route || city) && (
                <motion.div
                  key={route?.id ?? city?.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="glass relative mt-3 rounded-card p-5 md:absolute md:bottom-6 md:left-6 md:mt-0 md:w-[340px]"
                  role="region"
                  aria-live="polite"
                  aria-label="Detalhes da conexão"
                >
                  <button type="button" className="icon-btn absolute right-2 top-2 h-9 w-9" onClick={clear} aria-label="Fechar detalhes">
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                  {route && <RouteDetails route={route} />}
                  {city && !route && (
                    <div>
                      <p className="eyebrow text-amber-glow">{city.country}</p>
                      <p className="mt-1.5 text-xl font-medium text-ink">{city.name}</p>
                      <p className="mt-3 text-sm text-ink-soft">{cityRoutes.length} conexões</p>
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {cityRoutes.map((r) => {
                          const other = byId.get(otherEnd(r, city.id));
                          return (
                            <li key={r.id}>
                              <button
                                type="button"
                                onClick={() => selectRoute(r.id)}
                                className="rounded-full border border-cork px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-ink hover:text-ink"
                              >
                                {other?.name ?? r.label}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </FadeUp>

        {/* lista acessível por teclado com todas as rotas */}
        <FadeUp className="mt-6">
          <p className="eyebrow mb-3">Rotas de campanha ({routes.length})</p>
          <ul className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0" aria-label="Rotas da rede">
            {routes.map((r) => {
              const a = byId.get(r.from);
              const b = byId.get(r.to);
              if (!a || !b) return null;
              const sel = selectedRoute === r.id;
              return (
                <li key={r.id} className="snap-start">
                  <button
                    type="button"
                    onClick={() => selectRoute(r.id)}
                    aria-pressed={sel}
                    className={`flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-full border px-4 text-xs transition-colors ${
                      sel
                        ? 'border-ink bg-bark text-ink'
                        : 'border-cork text-ink-soft hover:border-ink hover:text-ink'
                    }`}
                  >
                    {a.name}
                    <ArrowLeftRight className="h-3 w-3 text-ink-mute" aria-hidden />
                    {b.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </FadeUp>

        <div className="mt-20 grid gap-px overflow-hidden rounded-card border border-cork bg-cork sm:grid-cols-3">
          {NETWORK_STATS.items.map((s, i) => (
            <FadeUp key={s.label} delay={i * 0.08} className="bg-void px-6 py-10 sm:px-8">
              <p className="display text-[clamp(2.6rem,4vw,3.2rem)] text-ink">
                <Counter item={s} />
              </p>
              <p className="mt-4 font-mono text-[11px] uppercase text-ink-mute">{s.label}</p>
            </FadeUp>
          ))}
        </div>
        {(NETWORK_STATS.demo || demo) && (
          <p className="mt-4 text-xs text-ink-mute">
            Indicadores e rotas são exemplos de interface (dados de demonstração), não estatísticas reais. Edite em{' '}
            <code className="font-mono">src/data/site.ts</code> e <code className="font-mono">src/data/demoNetwork.ts</code>.
          </p>
        )}
        {warning && <p className="mt-2 text-xs text-amber-300">{warning}</p>}
      </div>
    </section>
  );
}

function RouteDetails({ route }: { route: Route }) {
  const { byId, demo } = useNetwork();
  const a = byId.get(route.from);
  const b = byId.get(route.to);
  if (!a || !b) return null;
  const km = greatCircleKm(a, b);
  return (
    <div>
      <p className="eyebrow text-amber-glow">
        {KIND_LABEL[route.kind]} · {route.label}
      </p>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-xl font-medium text-ink">
        {a.name} <ArrowLeftRight className="h-4 w-4 text-ink-mute" aria-hidden /> {b.name}
      </p>
      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="font-mono text-[10px] uppercase text-ink-mute">Distância</dt>
          <dd className="mt-1 tabular-nums text-ink">{Math.round(km).toLocaleString('pt-BR')} km</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase text-ink-mute">Fuso*</dt>
          <dd className="mt-1 tabular-nums text-ink">{formatTzDiff(a.timezone, b.timezone)}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase text-ink-mute">Alcance/dia{demo ? ' · demo' : ''}</dt>
          <dd className="mt-1 tabular-nums text-ink">{route.reachK.toLocaleString('pt-BR')} mil</dd>
        </div>
      </dl>
      <p className="mt-3 text-[11px] text-ink-mute">
        * Diferença de horário real de {b.name} em relação a {a.name}, hoje. Ajuda a programar posts e anúncios no horário de pico de cada
        mercado.
      </p>
    </div>
  );
}
