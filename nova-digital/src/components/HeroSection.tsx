import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, MousePointerClick } from 'lucide-react';
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

/** Topo da página + capítulos da experiência: o globo fica fixo enquanto a narrativa rola por cima. */
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

        {/* rótulo vertical na borda direita */}
        <p
          data-intro="hero-sub"
          className="pointer-events-none absolute right-[18px] top-1/2 z-20 hidden -translate-y-1/2 rotate-180 text-[12px] uppercase text-ink-mute [writing-mode:vertical-rl] md:block"
          aria-hidden
        >
          Nº 001 — NOVA / DIGITAL — Estúdio de marketing
        </p>

        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast + (highlight?.key ?? 0)}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="glass pointer-events-none absolute left-1/2 top-[calc(var(--nav-h)+16px)] z-30 -translate-x-1/2 !rounded-full px-4 py-2 text-[12px] uppercase text-ink"
              role="status"
            >
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-ember align-middle" />
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
            Sua marca. Sem fronteiras.
          </h1>
          <div className="container-x grid items-end gap-6 md:grid-cols-[minmax(0,420px)_1fr]">
            {/* cartão de atribuição: subordinado ao objeto, com divisória tracejada */}
            <div data-intro="hero-sub" className="pointer-events-auto surface-outline bg-walnut/75 p-6">
              <p className="text-[14px] uppercase text-ink">Marketing digital global</p>
              <div className="my-4 border-t border-dashed border-cork" aria-hidden />
              <p className="text-[16px] font-normal normal-case leading-[1.4] text-ink-soft">
                Marketing que conecta sua marca a pessoas do mundo inteiro: estratégia, conteúdo, mídia paga e dados em uma nova
                dimensão digital.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                <a href="#explore" className="btn-primary">
                  Explorar o mundo
                </a>
                <a href="#experience" className="link-underline">
                  Como fazemos <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                </a>
              </div>
            </div>

            <div data-intro="hero-sub" className="flex flex-col items-start gap-3 md:items-end">
              <p className="flex items-center gap-2 text-[12px] uppercase text-ink-mute">
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

const TITLE_CLASS = 'display text-[clamp(2.4rem,8.6vw,8.6rem)]';

/**
 * Wordmark no canto superior esquerdo, em duas camadas idênticas: "Sem fronteiras." fica atrás do globo
 * e "Sua marca." passa na frente dele. O texto acessível está no h1 sr-only.
 */
function HeroTitle({ front }: { front: boolean }) {
  return (
    <div className="container-x flex h-full flex-col items-start pt-[calc(var(--nav-h)+4svh)]">
      <div data-intro="hero-title" className={TITLE_CLASS}>
        <span className="mask-line">
          <span className={front ? 'text-ink' : 'invisible'}>Sua marca.</span>
        </span>
        <span className="mask-line">
          <span className={front ? 'invisible' : 'text-driftwood'}>Sem fronteiras.</span>
        </span>
      </div>
    </div>
  );
}
