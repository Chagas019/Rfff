import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUpRight, MousePointerClick } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CONTINENTS } from '../data/site';
import type { City, ContinentId } from '../data/types';
import { useGlobeController, useSyncReducedMotion } from '../hooks/useGlobeController';
import { useInView } from '../hooks/useInView';
import { useNetwork } from '../hooks/useNetwork';
import { prefersReducedMotion } from '../hooks/useReducedMotion';
import { rotationToFace } from '../lib/geo';
import { tick } from '../lib/motion';
import type { Quality } from '../lib/device';
import { storyState } from '../lib/sceneState';
import { CityPanel } from './CityPanel';
import { CityTooltip } from './CityTooltip';
import { GlobeControls } from './GlobeControls';
import { GlobeView } from './GlobeView';
import type { HighlightSpec } from './globe/Effects';
import { ExperienceChapters } from '../sections/ExperienceChapters';

gsap.registerPlugin(ScrollTrigger);

const START = rotationToFace(16, -38);

interface HeroSectionProps {
  quality: Quality;
  reduced: boolean;
  onGlobeReady: () => void;
}

/** Topo da página + capítulos "Experience": o globo fica fixo enquanto a narrativa rola por cima. */
export function HeroSection({ quality, reduced, onGlobeReady }: HeroSectionProps) {
  const { cities, routes, byId } = useNetwork();
  const controller = useGlobeController({ x: START.x, y: START.y, distance: 4.5 });
  useSyncReducedMotion(controller, reduced);

  const wrap = useRef<HTMLDivElement>(null);
  const titleBack = useRef<HTMLDivElement>(null);
  const titleFront = useRef<HTMLDivElement>(null);
  const active = useInView(wrap, '100px');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hover, setHover] = useState<{ city: City; x: number; y: number } | null>(null);
  const [highlight, setHighlight] = useState<HighlightSpec | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const selected = selectedId ? (byId.get(selectedId) ?? null) : null;

  // progresso do storytelling e saída do título conforme a rolagem
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const reducedNow = prefersReducedMotion();
    const ctx = gsap.context(() => {
      const proxy = { p: 0 };
      gsap.to(proxy, {
        p: 1,
        ease: 'none',
        onUpdate: () => {
          storyState.progress = proxy.p;
        },
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: reducedNow ? true : 1.1 },
      });
      const layers = [titleBack.current, titleFront.current].filter((l): l is HTMLDivElement => l !== null);
      if (layers.length) {
        gsap.to(layers, {
          yPercent: -18,
          opacity: 0,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top top', end: () => `+=${window.innerHeight * 0.85}`, scrub: reducedNow ? true : 0.6 },
        });
      }
    }, el);
    return () => {
      ctx.revert();
      storyState.progress = 0;
    };
  }, []);

  // ao sair do hero, o painel fecha (ele fica numa camada fixa)
  useEffect(() => {
    if (!active) setSelectedId(null);
  }, [active]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  const onHoverCity = useCallback((city: City | null, x: number, y: number) => setHover(city ? { city, x, y } : null), []);
  const onSelectCity = useCallback(
    (city: City) => {
      setSelectedId(city.id);
      tick(); // retorno tátil no mesmo instante da onda de luz
      setHover(null);
      controller.focus(city.lat, city.lon);
    },
    [controller],
  );
  const onContinent = useCallback((continent: ContinentId, lat: number, lon: number) => {
    setHighlight({ continent, lat, lon, key: Date.now() });
    setToast(CONTINENTS[continent].label);
  }, []);
  const reset = useCallback(() => {
    setSelectedId(null);
    setHighlight(null);
    controller.reset();
  }, [controller]);
  const closePanel = useCallback(() => {
    setSelectedId(null);
    controller.release();
  }, [controller]);

  return (
    <div ref={wrap} className="relative">
      {/* palco fixo: título ao fundo, globo, título à frente */}
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_60%,rgba(61,123,255,0.10),transparent_70%)]"
          aria-hidden
        />

        <div ref={titleBack} className="pointer-events-none absolute inset-0" aria-hidden>
          <HeroTitle front={false} />
        </div>

        <div className="absolute inset-0 z-10">
          <GlobeView
            mode="hero"
            mount
            controller={controller}
            cities={cities}
            routes={routes}
            byId={byId}
            selectedId={selectedId}
            highlight={highlight}
            active={active}
            quality={quality}
            reduced={reduced}
            onHoverCity={onHoverCity}
            onSelectCity={onSelectCity}
            onContinent={onContinent}
            onDoubleClick={reset}
            onReady={onGlobeReady}
            onFallback={onGlobeReady}
            focus={selected}
          />
        </div>

        {/* esmaecimento inferior: o planeta "afunda" no preto e o texto do rodapé do hero fica legível */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-[42%] bg-gradient-to-t from-void via-void/70 to-transparent"
          aria-hidden
        />

        {/* a primeira linha do título passa na frente do globo; a segunda fica atrás dele */}
        <div ref={titleFront} className="pointer-events-none absolute inset-0 z-20" aria-hidden>
          <HeroTitle front />
        </div>

        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast + (highlight?.key ?? 0)}
              initial={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -6 }}
              className="glass pointer-events-none absolute left-1/2 top-[calc(var(--nav-h)+16px)] z-30 -translate-x-1/2 rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink"
              role="status"
            >
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-volt-400 align-middle shadow-[0_0_10px_#5b8fff]" />
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* conteúdo que rola por cima do palco */}
      <div className="pointer-events-none relative z-30 -mt-[100svh]">
        <section
          id="home"
          aria-labelledby="hero-title"
          className="relative flex min-h-[100svh] flex-col justify-end pb-8 pt-[calc(var(--nav-h)+2rem)] sm:pb-10"
        >
          <h1 id="hero-title" className="sr-only">
            The world. Reimagined.
          </h1>
          <div className="container-x grid items-end gap-8 md:grid-cols-[1fr_auto]">
            <div className="max-w-md">
              <p data-intro="hero-sub" className="eyebrow mb-4 text-volt-300">
                NOVA / DIGITAL — Marketing digital global
              </p>
              <p data-intro="hero-sub" className="text-lg font-light leading-relaxed text-ink-soft sm:text-xl">
                Marketing que conecta sua marca a pessoas do mundo inteiro: estratégia, conteúdo, mídia paga e dados em uma nova dimensão
                digital.
              </p>
              <div data-intro="hero-sub" className="pointer-events-auto mt-7 flex flex-wrap items-center gap-3">
                <a href="#explore" className="btn-primary">
                  Explore the world <ArrowUpRight className="h-4 w-4" aria-hidden />
                </a>
                <a href="#experience" className="btn-ghost">
                  Como fazemos <ArrowDown className="h-4 w-4" aria-hidden />
                </a>
              </div>
            </div>

            <div data-intro="hero-sub" className="flex flex-col items-start gap-3 md:items-end">
              <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-mute">
                <MousePointerClick className="h-3.5 w-3.5" aria-hidden />
                Arraste · clique nos pontos e continentes · duplo clique recentraliza
              </p>
              <GlobeControls
                controller={controller}
                onCenter={reset}
                showZoom={false}
                onClear={reset}
                canClear={selectedId !== null || highlight !== null}
              />
            </div>
          </div>
        </section>

        <ExperienceChapters />
      </div>

      {/* camada fixa acima do conteúdo: sheet no celular, cartão no canto superior direito em telas maiores */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[45] flex justify-end px-2 pb-[env(safe-area-inset-bottom,0px)] sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-[calc(var(--nav-h)+16px)] sm:px-6 lg:px-10">
        <CityPanel city={selected} onClose={closePanel} onSelect={onSelectCity} className="w-full max-w-sm sm:max-h-[min(72svh,600px)]" />
      </div>
      <CityTooltip hover={hover} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

const TITLE_CLASS = 'display text-[clamp(3.4rem,13.5vw,13.5rem)] uppercase';

/**
 * O título é desenhado em duas camadas idênticas: a de trás mostra "Reimagined." (atrás do globo)
 * e a da frente mostra "The world." (na frente dele). O texto acessível está no h1 sr-only.
 */
function HeroTitle({ front }: { front: boolean }) {
  return (
    <div className="container-x flex h-full flex-col items-center pt-[calc(var(--nav-h)+5svh)] text-center sm:pt-[calc(var(--nav-h)+3svh)]">
      <div data-intro="hero-title" className={TITLE_CLASS}>
        <span className="mask-line">
          <span className={front ? 'text-ink' : 'invisible'}>The world.</span>
        </span>
        <span className="mask-line">
          <span className={front ? 'invisible' : 'text-gradient opacity-[0.34]'}>Reimagined.</span>
        </span>
      </div>
    </div>
  );
}
