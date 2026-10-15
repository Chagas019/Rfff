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
    tag: 'Intelligence',
    title: 'AI-Powered Marketing',
    short: 'IA para segmentar, prever e personalizar cada campanha.',
    details: 'Modelos que encontram o público certo, sugerem criativos e automatizam funis, com uma pessoa revisando cada decisão.',
    specs: ['Segmentação preditiva', 'Criativos com IA', 'Automação de funis'],
    visual: <NeuralVisual />,
  },
  {
    id: 'spatial',
    index: '02',
    tag: 'Attention',
    title: 'Social & Content',
    short: 'Conteúdo que para o scroll e constrói comunidade.',
    details: 'Planejamento editorial, Reels, vídeos curtos e parcerias com creators, com a voz da sua marca em cada plataforma.',
    specs: ['Reels e vídeo curto', 'Calendário editorial', 'Creators e influência'],
    visual: <CubeVisual />,
  },
  {
    id: 'connectivity',
    index: '03',
    tag: 'Growth',
    title: 'Performance Media',
    short: 'Mídia paga focada em resultado, não em curtida.',
    details:
      'Campanhas em Meta, Google e TikTok com testes A/B contínuos, otimizadas por custo de aquisição e retorno sobre o investimento.',
    specs: ['Meta, Google e TikTok Ads', 'Testes A/B', 'CAC e ROAS'],
    visual: <OrbitVisual />,
  },
  {
    id: 'immersive',
    index: '04',
    tag: 'Emotion',
    title: 'Brand Experiences',
    short: 'Marcas e sites que as pessoas lembram e compartilham.',
    details: 'Identidade visual, landing pages que convertem e lançamentos com experiências interativas e 3D.',
    specs: ['Branding', 'Landing pages', 'Experiências 3D'],
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
        y: 40,
        duration: 1.1,
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
            <FadeUp className="eyebrow mb-6">Technology — Marketing services</FadeUp>
            <MaskTitle
              id="technology-title"
              lines={['Beyond the', 'expected.']}
              className="display text-[clamp(2.4rem,3.6vw,3.2rem)]"
              lineClassName={(i) => (i === 1 ? 'text-ink-mute' : 'text-ink')}
            />
          </div>
          <FadeUp delay={0.1}>
            <p className="max-w-md text-lg font-normal leading-[1.4] text-ink-soft lg:ml-auto">
              Quatro frentes de marketing que trabalham juntas para transformar atenção em clientes, em qualquer lugar do planeta.
              <span className="mt-3 block text-sm text-ink-mute">
                Passe o cursor para explorar. Toque ou clique para fixar os detalhes.
              </span>
            </p>
          </FadeUp>
        </div>

        <div ref={grid} className="mt-16 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
