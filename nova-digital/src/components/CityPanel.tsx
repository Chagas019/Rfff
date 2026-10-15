import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Clock, MapPin, Radio, X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { CONTINENTS, REGIONS } from '../data/site';
import type { City } from '../data/types';
import { useLocalTime } from '../hooks/useLocalTime';
import { useNetwork } from '../hooks/useNetwork';
import { greatCircleKm } from '../lib/geo';
import { otherEnd, routesOf } from '../lib/network';

interface CityPanelProps {
  city: City | null;
  onClose: () => void;
  onSelect: (city: City) => void;
  /** `floating`: cartão sobre o hero. `docked`: painel lateral da seção Explore. */
  variant?: 'floating' | 'docked';
  className?: string;
}

function formatCoord(v: number, pos: string, neg: string) {
  return `${Math.abs(v).toFixed(2)}° ${v >= 0 ? pos : neg}`;
}

/** Painel com informações da cidade selecionada e das conexões dela. */
export function CityPanel({ city, onClose, onSelect, variant = 'floating', className = '' }: CityPanelProps) {
  const { routes, byId, demo } = useNetwork();
  const time = useLocalTime(city?.timezone);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!city) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [city, onClose]);

  const links = city
    ? routesOf(city.id, routes)
        .map((r) => ({ route: r, to: byId.get(otherEnd(r, city.id)) }))
        .filter((l): l is { route: (typeof routes)[number]; to: City } => l.to !== undefined)
    : [];

  return (
    <AnimatePresence mode="wait">
      {city && (
        <motion.aside
          key={city.id}
          aria-label={`Detalhes de ${city.name}`}
          aria-live="polite"
          initial={{ opacity: 0, x: variant === 'docked' ? 24 : 0, y: variant === 'floating' ? 16 : 0, filter: 'blur(6px)' }}
          animate={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, x: variant === 'docked' ? 16 : 0, y: variant === 'floating' ? 10 : 0, filter: 'blur(4px)' }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className={`glass pointer-events-auto flex max-h-full flex-col overflow-hidden rounded-2xl ${className}`}
        >
          <header className="flex items-start justify-between gap-4 border-b border-white/[0.07] p-5">
            <div className="min-w-0">
              <p className="eyebrow text-amber-glow">{city.role}</p>
              <h3 className="mt-2 truncate text-2xl font-light tracking-tight text-ink">{city.name}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
                <MapPin className="h-3.5 w-3.5" aria-hidden /> {city.country} · {CONTINENTS[city.continent].label}
              </p>
            </div>
            <button ref={closeRef} type="button" onClick={onClose} className="icon-btn shrink-0" aria-label="Fechar painel da cidade">
              <X className="h-4 w-4" aria-hidden />
            </button>
          </header>

          <div className="grid grid-cols-2 gap-px bg-white/[0.06]">
            <Stat label="Hora local" value={time || '—'} icon={<Clock className="h-3.5 w-3.5" aria-hidden />} />
            <Stat label="Região" value={REGIONS[city.region].split(',')[0]} />
            <Stat label="Latitude" value={formatCoord(city.lat, 'N', 'S')} />
            <Stat label="Longitude" value={formatCoord(city.lon, 'L', 'O')} />
            <Stat
              label={demo ? 'Campanhas · demo' : 'Campanhas'}
              value={String(city.campaigns)}
              icon={<Radio className="h-3.5 w-3.5" aria-hidden />}
            />
            <Stat label={demo ? 'Engajamento · demo' : 'Engajamento'} value={`${city.engagement.toLocaleString('pt-BR')}%`} />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <p className="eyebrow">Conexões ({links.length})</p>
            {links.length === 0 ? (
              <p className="mt-3 text-sm text-ink-mute">Nenhuma rota cadastrada para esta cidade.</p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {links.map(({ route, to }) => (
                  <li key={route.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(to)}
                      className="group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/[0.05] focus-visible:bg-white/[0.05]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-ink">{to.name}</span>
                        <span className="block truncate font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute">
                          {route.label} · {Math.round(greatCircleKm(city, to)).toLocaleString('pt-BR')} km
                        </span>
                      </span>
                      <ArrowUpRight
                        className="h-4 w-4 shrink-0 text-ink-mute transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-amber-glow"
                        aria-hidden
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {demo && (
              <p className="mt-5 border-t border-white/[0.06] pt-4 text-[11px] leading-relaxed text-ink-mute">
                Coordenadas e hora local são reais. Papel, campanhas, engajamento e rotas são dados de demonstração.
              </p>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="bg-void-900/90 px-5 py-3.5">
      <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-mute">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-[15px] tabular-nums text-ink">{value}</p>
    </div>
  );
}
