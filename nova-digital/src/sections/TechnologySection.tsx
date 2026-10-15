import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLayoutEffect, useRef } from 'react';
import { FadeUp, MaskTitle } from '../components/Reveal';
import { CubeVisual, LayersVisual, NeuralVisual, OrbitVisual, TechnologyCard, type TechItem } from '../components/TechnologyCards';
import { prefersReducedMotion } from '../hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

const ITEMS: TechItem[] = [
  {
    id: 'ai',
    index: '01',
    tag: 'Cognition',
    title: 'Artificial Intelligence',
    short: 'Modelos que entendem contexto e transformam dados em decisões.',
    details: 'Assistentes, recomendação e automação desenhados para pessoas, com transparência sobre como cada resposta é gerada.',
    specs: ['Modelos multimodais', 'Inferência na borda', 'Privacidade por padrão'],
    visual: <NeuralVisual />,
  },
  {
    id: 'spatial',
    index: '02',
    tag: 'Dimension',
    title: 'Spatial Computing',
    short: 'Interfaces que saem da tela e ocupam o espaço ao seu redor.',
    details: 'Experiências para headsets, celulares e telas imersivas que respondem ao corpo, ao olhar e ao ambiente.',
    specs: ['WebXR', 'Rastreamento de mãos', 'Mapeamento espacial'],
    visual: <CubeVisual />,
  },
  {
    id: 'connectivity',
    index: '03',
    tag: 'Network',
    title: 'Global Connectivity',
    short: 'Infraestrutura que aproxima cidades e encurta distâncias.',
    details: 'Redes de baixa latência e sincronização em tempo real para equipes, produtos e públicos espalhados pelo mundo.',
    specs: ['Edge global', 'Tempo real', 'Alta disponibilidade'],
    visual: <OrbitVisual />,
  },
  {
    id: 'immersive',
    index: '04',
    tag: 'Emotion',
    title: 'Immersive Experiences',
    short: 'Narrativas interativas que o público sente, não apenas vê.',
    details: 'Instalações, lançamentos e produtos digitais com 3D em tempo real, som espacial e direção cinematográfica.',
    specs: ['3D em tempo real', 'Áudio espacial', 'Direção de arte'],
    visual: <LayersVisual />,
  },
];

export function TechnologySection() {
  const grid = useRef<HTMLDivElement>(null);

  // cards surgem com profundidade
  useLayoutEffect(() => {
    const el = grid.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll('[data-tech-wrap]'), {
        opacity: 0,
        y: 90,
        rotateX: 24,
        z: -160,
        transformPerspective: 1200,
        duration: 1.3,
        ease: 'expo.out',
        stagger: 0.1,
        clearProps: 'transform',
        scrollTrigger: { trigger: el, start: 'top 82%', once: true },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section id="technology" aria-labelledby="technology-title" className="relative py-28 sm:py-36">
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <FadeUp className="eyebrow mb-6">Technology — Capabilities</FadeUp>
            <MaskTitle
              id="technology-title"
              lines={['Beyond the', 'expected.']}
              className="display text-[clamp(3rem,9vw,8.5rem)] uppercase"
              lineClassName={(i) => (i === 1 ? 'text-ink-mute' : 'text-ink')}
            />
          </div>
          <FadeUp delay={0.1}>
            <p className="max-w-md text-lg leading-relaxed text-ink-soft lg:ml-auto">
              Quatro frentes que trabalham juntas para transformar ideias em experiências que funcionam em qualquer lugar do planeta.
              <span className="mt-3 block text-sm text-ink-mute">
                Passe o cursor para explorar. Toque ou clique para fixar os detalhes.
              </span>
            </p>
          </FadeUp>
        </div>

        <div ref={grid} className="mt-16 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" style={{ perspective: 1400 }}>
          {ITEMS.map((item) => (
            <div key={item.id} data-tech-wrap>
              <TechnologyCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
