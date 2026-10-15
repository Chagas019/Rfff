import { FadeUp, MaskTitle } from '../components/Reveal';

const PRINCIPLES = [
  {
    title: 'Estratégia antes do post',
    body: 'Cada projeto começa com diagnóstico: público, concorrência, funil e metas. Só depois vêm conteúdo e anúncios.',
  },
  {
    title: 'Criatividade guiada por dados',
    body: 'Ideias ousadas, testadas e medidas. O que funciona escala; o que não funciona vira aprendizado rápido.',
  },
  {
    title: 'Resultado que dá para medir',
    body: 'Relatórios claros com as métricas que importam para o negócio: leads, vendas, custo por cliente e retorno.',
  },
];

export function AboutSection() {
  return (
    <section id="about" aria-labelledby="about-title" className="relative py-28 sm:py-36">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" aria-hidden />
      <div className="container-x">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <FadeUp className="eyebrow mb-6">About — Marketing studio</FadeUp>
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
                Somos um estúdio de marketing digital que une estratégia, conteúdo, mídia paga e tecnologia para conectar marcas a pessoas —
                do bairro ao mundo inteiro.
              </p>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft">
                Trabalhamos com empresas, criadores e marcas que querem crescer com método: mais alcance, mais clientes e uma presença
                digital que vale a pena seguir.
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
