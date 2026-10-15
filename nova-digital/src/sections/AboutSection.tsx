import { FadeUp, MaskTitle } from '../components/Reveal';

const PRINCIPLES = [
  {
    title: 'Curiosidade como método',
    body: 'Cada projeto começa com perguntas, não com templates. Investigamos pessoas, contexto e dados antes de desenhar.',
  },
  {
    title: 'Tecnologia a serviço da emoção',
    body: '3D, IA e tempo real só entram quando tornam a experiência mais clara, mais humana ou mais memorável.',
  },
  {
    title: 'Feito para durar',
    body: 'Performance, acessibilidade e código limpo desde o primeiro protótipo, para funcionar em qualquer tela e conexão.',
  },
];

export function AboutSection() {
  return (
    <section id="about" aria-labelledby="about-title" className="relative py-28 sm:py-36">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" aria-hidden />
      <div className="container-x">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <FadeUp className="eyebrow mb-6">About — Studio</FadeUp>
            <MaskTitle
              id="about-title"
              lines={['Nova', '/ Digital']}
              className="display text-[clamp(3.4rem,11vw,10rem)] uppercase"
              lineClassName={(i) => (i === 1 ? 'text-ink-mute' : 'text-ink')}
            />
          </div>
          <div className="flex flex-col justify-end">
            <FadeUp>
              <p className="text-balance text-[clamp(1.4rem,2.6vw,2.2rem)] font-light leading-snug tracking-tight text-ink">
                Somos um estúdio de experiências digitais que une direção criativa, engenharia e tecnologia 3D para aproximar pessoas,
                marcas e ideias — em qualquer ponto do planeta.
              </p>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft">
                Trabalhamos com equipes que querem lançar algo que ainda não existe: produtos, plataformas e experiências interativas que
                contam uma história e funcionam de verdade.
              </p>
            </FadeUp>
          </div>
        </div>

        <FadeUp
          as="ol"
          stagger="li"
          className="mt-20 grid gap-px overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.06] md:grid-cols-3"
        >
          {PRINCIPLES.map((p, i) => (
            <li key={p.title} className="group relative bg-void p-7 transition-colors duration-500 hover:bg-void-900 sm:p-9">
              <span className="font-mono text-[11px] text-amber-glow">0{i + 1}</span>
              <h3 className="mt-10 text-2xl font-light tracking-tight text-ink">{p.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{p.body}</p>
              <span
                className="absolute inset-x-9 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-volt-400 to-amber-glow transition-transform duration-700 ease-expo group-hover:scale-x-100"
                aria-hidden
              />
            </li>
          ))}
        </FadeUp>
      </div>
    </section>
  );
}
