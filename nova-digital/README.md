# NOVA / DIGITAL — The World. Reimagined.

Landing page futurista de um **estúdio de marketing digital**, com um **globo terrestre 3D interativo** (Three.js + React Three Fiber), abertura cinematográfica, storytelling por rolagem (GSAP + ScrollTrigger) e interface responsiva.

Projeto independente dentro deste repositório: tem `package.json`, dependências e testes próprios.

## Como executar

```bash
cd nova-digital
npm install
npm run dev        # http://localhost:5173
npm test           # testes unitários (Vitest)
npm run build      # typecheck + build de produção em dist/
npm run preview    # serve o build
```

Para testar o modo sem WebGL, abra `/?nowebgl`.

## Sistema visual (ORYZO Darkroom)

- Cores: canvas `#100904` (walnut), texto `#ffedd7` (cream), superfície elevada `#382416` (bark), divisórias tracejadas `#40372e` (cork), estrutura `#6c5f51` (driftwood) e `#dc5000` (ember) só em destaques editoriais, nunca em botões.
- Tipografia: Inter, caixa alta e peso 500 na interface; texto descritivo em caixa mista, peso 400, ~29px no desktop. Títulos com entrelinha 0.90, sem apertar o espaçamento.
- Sem sombras desfocadas nem brilhos; raio 12px nos cards, pílula de 36px no CTA preenchido, 22,5px no botão contornado, campos só com linha inferior.
- Navegação com no máximo quatro itens (Experiência, Serviços, Explorar, Contato); Método, Rede e Sobre ficam no rodapé. Todo o texto da interface está em português.
- Hero com wordmark no canto superior esquerdo, rótulo vertical na borda direita e cartão de atribuição; capítulos em "void mode" (título à esquerda, globo ao centro, texto à direita).
- Tokens em `tailwind.config.js` e `src/styles/index.css`.

## Stack

React 18 + TypeScript, Vite 5, Tailwind CSS 3, Three.js 0.170, React Three Fiber 8, Drei 9, GSAP 3 (ScrollTrigger), Framer Motion 11, Lucide React, d3-geo + topojson-client + world-atlas (fronteiras dos países), fonte Inter auto-hospedada via Fontsource. React Router não foi usado porque a página tem uma rota só.

## Seções

| Seção | O que faz |
|---|---|
| Método | Etapas do trabalho (diagnóstico, estratégia, execução, otimização), canais e um glossário das métricas de marketing (CAC, ROAS, LTV, CTR, conversão). |
| Abertura | Tela preta → linha luminosa → expansão → partículas → globo surge → atmosfera → título com máscara → textos → navegação. Espera as texturas (máx. 7 s), e qualquer clique, tecla, rolagem ou toque acelera. |
| Hero + Experience | Globo fixo enquanto a narrativa rola por cima: muda de posição, distância e luz (dia → noite com luzes das cidades em âmbar → visão afastada). Título em duas camadas: "The world." na frente do globo e "Reimagined." atrás. |
| Serviços | Cards com perspectiva que segue o cursor, borda luminosa, texto revelado, onda ao clicar e visual animado próprio. No toque, um toque abre os detalhes. |
| Network | Mapa-múndi pontilhado com arcos desenhados pela rolagem e partículas percorrendo as rotas. Clique em uma rota (distância, latência mínima teórica e capacidade) ou em uma cidade. Contadores animados. |
| Explore | Seletor de continente, busca de cidades (sem acento), filtro por região, zoom, centralizar, rotação automática, tela cheia (quando o navegador permite), limpar e painel lateral. |
| About / Contact | Princípios do estúdio e formulário validado. |

### Interações do globo

Arrastar (mouse e toque) gira com inércia · passar sobre um ponto mostra tooltip · clicar no ponto abre o painel e anima as conexões com ondas de luz · clicar em um continente o destaca com uma varredura luminosa · duplo clique volta à posição inicial · botão pausa/ativa a rotação automática · no Explore: Ctrl/⌘ + rolagem ou pinça para zoom, e teclado (setas, + e -, 0, Home, Esc).

Para não prender a página: no hero o zoom é controlado pela rolagem (storytelling), e no Explore a rolagem simples continua rolando a página. O canvas usa `touch-action: pan-y`, então o gesto vertical no celular sempre rola a página.

## Dados

- `src/data/demoNetwork.ts`: **conjunto de demonstração**. Coordenadas, países e fusos são reais; papéis, nós, latências, rotas e capacidades são fictícios e a interface avisa isso.
- Fonte configurável: defina `VITE_NETWORK_URL` com um JSON no formato `{ demo, cities: City[], routes: Route[] }` (veja `src/data/types.ts`). O JSON é validado; se falhar, o site volta para a demonstração e mostra um aviso.
- `src/data/site.ts`: indicadores da seção Network (campanhas, países, ROAS: exemplos de interface, **não** estatísticas reais), links e e-mail.
- Na seção Network, a coluna "Fuso" mostra a diferença real de horário entre os mercados (útil para programar posts e anúncios).

## Configuração (`.env`)

```
VITE_NETWORK_URL=https://exemplo.com/rede.json   # opcional
VITE_CONTACT_EMAIL=contato@suaempresa.com          # e-mail que recebe o formulário
VITE_CONTACT_ENDPOINT=https://exemplo.com/contato  # opcional: POST JSON {name,email,topic,message}
```

Sem endpoint, o formulário abre o aplicativo de e-mail com a mensagem pronta. O e-mail padrão (`contato@novadigital.example`) é um placeholder: troque antes de publicar.

## Performance e acessibilidade

- Three.js fica num chunk separado, carregado sob demanda. O globo do Explore só monta perto da tela, e cada canvas para de renderizar quando sai da tela.
- Pixel ratio limitado (2 no desktop, 1,75 em aparelhos modestos), ajuste automático com `PerformanceMonitor`, menos partículas e menos geometria em celulares.
- Texturas em WebP (~345 KB no total).
- Sem WebGL (ou se o contexto cair), aparece um globo vetorial em canvas 2D que pode ser arrastado e deixa selecionar cidades. Ele não gira sozinho, para não travar aparelhos que desenham a página sem aceleração gráfica.
- `prefers-reduced-motion`: pula a abertura, desliga a rotação automática e as partículas animadas, e faz as transições sem animação.
- Link "pular para o conteúdo", foco visível, menu mobile com foco preso e Esc, controles com `aria-label`, área de toque de pelo menos 44 px.

## Créditos

Texturas da Terra: NASA Blue Marble e Earth at Night (domínio público), via pacote `three-globe` (MIT). Fronteiras: Natural Earth via `world-atlas`.
