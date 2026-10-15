import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLayoutEffect, useRef } from 'react';
import { FadeUp, MaskTitle } from '../components/Reveal';
import { prefersReducedMotion } from '../hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

const STATEMENT =
  'We turn attention into growth — strategy, content, media and data working as one network, from a local business to a global brand.';

/** Palavras que acendem (cinza → branco) conforme a rolagem. */
function ScrubStatement() {
  const ref = useRef<HTMLParagraphElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll('[data-word]'),
        { opacity: 0.16 },
        { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <p
      ref={ref}
      className="text-balance text-[clamp(1.9rem,4.6vw,4.4rem)] font-light uppercase leading-[0.98] tracking-[-0.045em] text-ink"
    >
      {STATEMENT.split(' ').map((w, i) => (
        <span key={i} data-word className="inline-block pr-[0.24em]">
          {w}
        </span>
      ))}
    </p>
  );
}

function Chapter({
  index,
  label,
  title,
  body,
  align,
}: {
  index: string;
  label: string;
  title: string[];
  body: string;
  align: 'left' | 'right';
}) {
  return (
    <div className="flex min-h-[100svh] items-center py-24">
      <div className={`container-x flex ${align === 'right' ? 'md:justify-end' : ''}`}>
        <div className="max-w-xl rounded-3xl bg-gradient-to-b from-void/70 to-void/30 p-6 backdrop-blur-[2px] sm:p-8 md:bg-none md:p-0 md:backdrop-blur-0">
          <FadeUp className="mb-6 flex items-center gap-4">
            <span className="font-mono text-[11px] text-amber-glow">{index}</span>
            <span className="h-px w-10 bg-white/20" aria-hidden />
            <span className="eyebrow">{label}</span>
          </FadeUp>
          <MaskTitle
            as="h2"
            lines={title}
            className="display text-[clamp(2.6rem,6.4vw,6rem)] uppercase"
            lineClassName={(i) => (i === title.length - 1 ? 'text-ink-mute' : 'text-ink')}
          />
          <FadeUp delay={0.15}>
            <p className="mt-7 max-w-md text-base leading-relaxed text-ink-soft sm:text-lg">{body}</p>
          </FadeUp>
        </div>
      </div>
    </div>
  );
}

/** Capítulos da narrativa. O globo (fixo no palco do hero) muda de posição e luz em cada um. */
export function ExperienceChapters() {
  return (
    <section id="experience" aria-label="Experience" className="relative">
      <Chapter
        index="01"
        label="Audience"
        title={['Every point', 'is an audience.']}
        body="Cada ponto de luz é um mercado onde sua marca pode conversar com pessoas reais. Antes de investir um real, mapeamos público, comportamento, concorrência e oportunidade. Clique nos pontos do globo para ver cada mercado."
        align="left"
      />
      <Chapter
        index="02"
        label="Always on"
        title={['When the sun sets,', 'the feed lights up.']}
        body="Do outro lado do planeta, seu público está online. Campanhas que respeitam fuso, cultura e horário de pico trabalham 24 horas: enquanto uma metade do mundo dorme, a outra está rolando o feed."
        align="right"
      />
      <div className="flex min-h-[100svh] items-end pb-[12svh] md:items-center md:pb-0">
        <div className="container-x">
          <div className="mx-auto max-w-5xl rounded-3xl bg-void/40 p-6 text-center backdrop-blur-[2px] sm:p-10 md:bg-transparent md:backdrop-blur-0">
            <FadeUp className="mb-8 flex items-center justify-center gap-4">
              <span className="font-mono text-[11px] text-amber-glow">03</span>
              <span className="h-px w-10 bg-white/20" aria-hidden />
              <span className="eyebrow">Growth, everywhere</span>
            </FadeUp>
            <ScrubStatement />
          </div>
        </div>
      </div>
    </section>
  );
}
