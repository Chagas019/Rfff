import { AnimatePresence, motion, useDragControls, type PanInfo } from 'framer-motion';
import { ArrowUpRight, Clock, MapPin, Radio, X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { CONTINENTS, REGIONS } from '../data/site';
import type { City } from '../data/types';
import { useLocalTime } from '../hooks/useLocalTime';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { project, SPRING } from '../lib/motion';
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
  const reduced = useReducedMotion();
  const narrow = useMediaQuery('(max-width: 639px)');
  // no celular, o cartão do hero vira uma "sheet" que se fecha arrastando para baixo
  const sheet = variant === 'floating' && narrow && !reduced;
  const drag = useDragControls();
  const sheetRef = useRef<HTMLElement>(null);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    // decide pelo ponto onde o gesto VAI parar (projeção do impulso), não só por onde soltou
    const h = sheetRef.current?.offsetHeight ?? 400;
    const projected = info.offset.y + project(info.velocity.y);
    if (info.offset.y > h * 0.3 || projected > h * 0.5) onClose();
  };

  const motionProps = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.2 } }
    : sheet
      ? { initial: { y: '110%' }, animate: { y: 0 }, exit: { y: '110%' }, transition: SPRING.sheet }
      : {
          // entra e sai pelo mesmo caminho; blur + posição juntos "materializam" o vidro
          initial: { opacity: 0, x: variant === 'docked' ? 24 : 0, y: variant === 'floating' ? 16 : 0, filter: 'blur(6px)' },
          animate: { opacity: 1, x: 0, y: 0, filter: 'blur(0px)' },
          exit: { opacity: 0, x: variant === 'docked' ? 24 : 0, y: variant === 'floating' ? 16 : 0, filter: 'blur(6px)' },
          transition: SPRING.ui,
        };

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
          ref={sheetRef}
          {...motionProps}
          drag={sheet ? 'y' : false}
          dragControls={drag}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: 0 }}
          // para cima resiste (rubber-band); para baixo segue o dedo 1:1
          dragElastic={{ top: 0.06, bottom: 1 }}
          dragTransition={{ bounceStiffness: 420, bounceDamping: 34 }}
          onDragEnd={sheet ? onDragEnd : undefined}
          className={`glass pointer-events-auto flex max-h-full flex-col overflow-hidden rounded-2xl ${sheet ? 'max-h-[72svh] rounded-b-none' : ''} ${className}`}
        >
          {sheet && (
            <div
              className="flex cursor-grab touch-none justify-center pb-1 pt-3 active:cursor-grabbing"
              onPointerDown={(e) => drag.start(e)}
              aria-hidden
            >
              <span className="h-1.5 w-10 rounded-full bg-white/25" />
            </div>
          )}
          <header
            className={`flex items-start justify-between gap-4 border-b border-white/[0.07] p-5 ${sheet ? 'touch-none pt-2' : ''}`}
            onPointerDown={sheet ? (e) => !(e.target as HTMLElement).closest('button') && drag.start(e) : undefined}
          >
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
            <Stat label={demo ? 'Engajamento · demo' : 'Engajamento'} value={`${city.engagement.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`} />
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
