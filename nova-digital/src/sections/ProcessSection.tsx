import { FadeUp, MaskTitle } from '../components/Reveal';

/** Etapas reais do trabalho, em ordem: por isso a numeração. */
const STEPS = [
  {
    title: 'Diagnóstico',
    body: 'Analisamos sua marca, seu público, a concorrência e os números que você já tem. Saímos com metas claras e mensuráveis.',
    items: ['Auditoria das redes e do site', 'Análise de concorrência', 'Metas e indicadores (KPIs)'],
  },
  {
    title: 'Estratégia',
    body: 'Definimos posicionamento, canais, mensagem e orçamento. Cada ação tem um papel no funil: atrair, converter e fidelizar.',
    items: ['Plano de canais', 'Funil de vendas', 'Calendário editorial'],
  },
  {
    title: 'Execução',
    body: 'Produzimos conteúdo e criativos, publicamos e gerenciamos a mídia paga com testes constantes de público, oferta e formato.',
    items: ['Conteúdo e criativos', 'Gestão de anúncios', 'Testes A/B'],
  },
  {
    title: 'Otimização',
    body: 'Acompanhamos os dados toda semana, cortamos o que não funciona e escalamos o que dá retorno. Você recebe tudo em linguagem simples.',
    items: ['Relatório mensal', 'Painel de métricas', 'Reunião de resultados'],
  },
];

const CHANNELS = [
  'Instagram',
  'TikTok',
  'YouTube',
  'Google Ads',
  'Meta Ads',
  'LinkedIn',
  'SEO',
  'E-mail marketing',
  'WhatsApp Business',
];

/** Termos de marketing explicados (definições gerais, não dados da empresa). */
const METRICS = [
  { term: 'CAC', name: 'Custo de aquisição de cliente', body: 'Quanto você investe, em média, para conquistar cada novo cliente.' },
  { term: 'ROAS', name: 'Retorno sobre o investimento em anúncios', body: 'Quanto de receita volta para cada real investido em mídia paga.' },
  { term: 'LTV', name: 'Valor do cliente no tempo', body: 'Quanto um cliente gera para o negócio ao longo de todo o relacionamento.' },
  { term: 'CTR', name: 'Taxa de cliques', body: 'A porcentagem de pessoas que viram o anúncio ou post e clicaram nele.' },
  { term: 'Conversão', name: 'Taxa de conversão', body: 'A parte dos visitantes que fazem o que você quer: comprar, chamar ou se cadastrar.' },
];

export function ProcessSection() {
  return (
    <section id="process" aria-labelledby="process-title" className="relative py-28 sm:py-36">
      <div className="pointer-events-none absolute inset-x-0 top-0 hairline" aria-hidden />
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <FadeUp className="eyebrow mb-6">Método</FadeUp>
            <MaskTitle
              id="process-title"
              lines={['Do diagnóstico', 'ao resultado.']}
              className="display text-[clamp(2.4rem,3.6vw,3.2rem)]"
              lineClassName={(i) => (i === 1 ? 'text-ink-mute' : 'text-ink')}
            />
          </div>
          <FadeUp delay={0.1}>
            <p className="max-w-md text-lg font-normal leading-[1.4] text-ink-soft lg:ml-auto">
              Marketing que funciona não é sorte nem post viral. É um processo: entender o público, escolher os canais certos, testar e
              melhorar todo mês.
            </p>
          </FadeUp>
        </div>

        {/* etapas */}
        <FadeUp as="ol" stagger="li" className="mt-16 grid border-t border-dashed border-cork md:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="flex flex-col gap-4 border-b border-dashed border-cork py-8 md:px-6 md:[&:nth-child(odd)]:pl-0 xl:border-b-0 xl:border-r xl:px-6 xl:last:border-r-0 xl:[&:nth-child(odd)]:pl-6 xl:[&:first-child]:pl-0"
            >
              <span className="text-[12px] uppercase text-ember">Etapa 0{i + 1}</span>
              <h3 className="text-[24px] font-medium uppercase leading-[1.09] text-ink">{step.title}</h3>
              <p className="text-[16px] font-normal leading-[1.45] text-ink-soft">{step.body}</p>
              <ul className="mt-auto flex flex-col gap-2 pt-2">
                {step.items.map((it) => (
                  <li key={it} className="flex items-center gap-2 text-[13px] uppercase text-ink-mute">
                    <span className="w-3 border-t border-dashed border-driftwood" aria-hidden />
                    {it}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </FadeUp>

        {/* canais */}
        <div className="mt-20 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <FadeUp>
            <h3 className="text-[24px] font-medium uppercase leading-[1.09] text-ink">Canais com que trabalhamos</h3>
            <p className="mt-3 max-w-sm text-[16px] font-normal leading-[1.45] text-ink-soft">
              Escolhemos os canais pelo lugar onde o seu público está, e não pela moda do momento.
            </p>
          </FadeUp>
          <FadeUp as="ul" stagger="li" className="flex flex-wrap content-start gap-2">
            {CHANNELS.map((c) => (
              <li key={c} className="rounded-ghost border border-cork px-4 py-2.5 text-[13px] uppercase text-ink">
                {c}
              </li>
            ))}
          </FadeUp>
        </div>

        {/* métricas */}
        <div className="mt-20 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <FadeUp>
            <h3 className="text-[24px] font-medium uppercase leading-[1.09] text-ink">Métricas que importam</h3>
            <p className="mt-3 max-w-sm text-[16px] font-normal leading-[1.45] text-ink-soft">
              Curtida não paga boleto. Acompanhamos os números que mostram se o marketing está trazendo clientes e lucro.
            </p>
          </FadeUp>
          <FadeUp as="dl" stagger="div" className="grid border-t border-dashed border-cork sm:grid-cols-2">
            {METRICS.map((m) => (
              <div key={m.term} className="border-b border-dashed border-cork py-5 sm:odd:pr-6 sm:even:pl-6">
                <dt className="flex items-baseline gap-3">
                  <span className="text-[24px] font-medium uppercase leading-none text-ink">{m.term}</span>
                  <span className="text-[12px] uppercase text-ink-mute">{m.name}</span>
                </dt>
                <dd className="mt-2 text-[15px] font-normal leading-[1.45] text-ink-soft">{m.body}</dd>
              </div>
            ))}
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
