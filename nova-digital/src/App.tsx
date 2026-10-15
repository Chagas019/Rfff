import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCallback, useEffect, useState } from 'react';
import { HeroSection } from './components/HeroSection';
import { LoadingScreen } from './components/LoadingScreen';
import { Navbar } from './components/Navbar';
import { NetworkProvider } from './hooks/useNetwork';
import { useReducedMotion } from './hooks/useReducedMotion';
import { detectQuality, type Quality } from './lib/device';
import { AboutSection } from './sections/AboutSection';
import { ContactSection } from './sections/ContactSection';
import { ExploreWorld } from './sections/ExploreWorld';
import { GlobalNetwork } from './sections/GlobalNetwork';
import { TechnologySection } from './sections/TechnologySection';

export default function App() {
  const reduced = useReducedMotion();
  const [quality] = useState<Quality>(detectQuality);
  const [globeReady, setGlobeReady] = useState(false);
  const onGlobeReady = useCallback(() => setGlobeReady(true), []);

  // recalcula as posições do ScrollTrigger quando fontes e imagens terminam de carregar
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    document.fonts?.ready.then(refresh).catch(() => undefined);
    return () => window.removeEventListener('load', refresh);
  }, []);

  return (
    <NetworkProvider>
      <a
        href="#main"
        className="sr-only z-[90] rounded-full bg-ink px-4 py-2 text-void focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Pular para o conteúdo
      </a>
      <LoadingScreen ready={globeReady} onDone={() => ScrollTrigger.refresh()} />
      <Navbar />
      <main id="main">
        <HeroSection quality={quality} reduced={reduced} onGlobeReady={onGlobeReady} />
        <TechnologySection />
        <GlobalNetwork />
        <ExploreWorld quality={quality} reduced={reduced} />
        <AboutSection />
        <ContactSection />
      </main>
    </NetworkProvider>
  );
}
