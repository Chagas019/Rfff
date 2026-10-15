import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { FadeUp, MaskTitle } from '../components/Reveal';
import { prefersReducedMotion } from '../hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

const STATEMENT =
  'Transformamos atenção em crescimento: estratégia, conteúdo, mídia e dados trabalhando como uma só rede, do negócio do bairro à marca global.';

/** Palavras que acendem conforme a rolagem. */
function ScrubStatement() {
  const ref = useRef<HTMLParagraphElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll('[data-word]'),
        { opacity: 0.25 },
        { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 50%', scrub: true } },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <p ref={ref} className="lede">
      {STATEMENT.split(' ').map((w, i) => (
        <span key={i} data-word className="inline-block pr-[0.26em]">
          {w}
        </span>
      ))}
    </p>
  );
}

interface ChapterProps {
  index: string;
  label: string;
  title: string[];
  children: ReactNode;
}

/**
 * "Void mode": título à esquerda, o globo (fixo no palco do hero) ao centro e o texto descritivo à direita.
 * No celular, título e texto empilham sobre o globo.
 */
function Chapter({ index, label, title, children }: ChapterProps) {
  return (
    <div className="flex min-h-[100svh] items-center py-24">
      <div className="container-x grid w-full gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)] md:items-center">
        <div className="min-w-0">
          <FadeUp className="mb-5 flex items-center gap-3 text-[12px] uppercase">
            <span className="text-ember">{index}</span>
            <span className="w-8 border-t border-dashed border-driftwood" aria-hidden />
            <span className="text-ink-mute">{label}</span>
          </FadeUp>
          <MaskTitle
            as="h2"
            lines={title}
            className="display text-[clamp(2.3rem,3.6vw,3.2rem)]"
            lineClassName={(i) => (i === title.length - 1 ? 'text-ink-mute' : 'text-ink')}
          />
        </div>
        <div aria-hidden className="hidden md:block" />
        <FadeUp delay={0.1} className="min-w-0 bg-void/80 p-4 md:bg-transparent md:p-0">
          {children}
        </FadeUp>
      </div>
    </div>
  );
}

/** Capítulos da narrativa. O globo muda de rotação, distância e luz em cada um. */
export function ExperienceChapters() {
  return (
    <section id="experience" aria-label="Experiência" className="relative">
      <Chapter index="01" label="Público" title={['Cada ponto', 'é um público.']}>
        <p className="lede">
          Cada ponto de luz é um mercado onde sua marca pode conversar com pessoas reais. Antes de investir, mapeamos público,
          comportamento, concorrência e oportunidade.
        </p>
      </Chapter>
      <Chapter index="02" label="Sempre ativo" title={['Quando o sol se põe,', 'o feed acende.']}>
        <p className="lede">
          Do outro lado do planeta, seu público está online. Campanhas que respeitam fuso, cultura e horário de pico trabalham 24 horas.
        </p>
      </Chapter>
      <Chapter index="03" label="Crescimento" title={['Crescimento', 'em todo lugar.']}>
        <ScrubStatement />
      </Chapter>
    </section>
  );
}
