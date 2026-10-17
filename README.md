# GRID F1 — A Experiência da Velocidade

Uma plataforma interativa para fãs da Fórmula 1 (temporada 2026), feita com **React + TypeScript + Vite**, **Tailwind CSS**, **Framer Motion** e **Lucide React**.

## Funcionalidades

- **Início**: landing com três celulares (fonte Albert Sans): Lewis Hamilton em Silverstone, os pontos **ao vivo** de Hamilton e da Ferrari em 2026 e os da carreira de Hamilton (contagem animada), e a Ferrari SF-26 com Leclerc (16) e Hamilton (44); menu em tela cheia com links para biografia, classificação e equipe. Depois vem faixa animada com dados da temporada, card do próximo GP com contagem regressiva em tempo real (que nunca fica negativa), favoritar e compartilhar.
- **Calendário 2026**: as 22 etapas mais as 2 canceladas (Bahrein e Arábia Saudita), com busca, filtros por país, mês e status, alternância entre cards e lista (preferência salva) e página de detalhes de cada GP (`/calendario/:id`) com programação, contagem, exportação `.ics`, compartilhamento (Web Share API, com cópia do link como alternativa) e resultado oficial quando a corrida já terminou.
- **Circuitos**: cards com traçado SVG animado, ficha técnica, recorde de volta verificado e modal de detalhes (`/circuitos/:id`).
- **Pilotos**: galeria dos 22 titulares, busca, filtro por equipe, ordenação e perfil (`/pilotos/:id`) com biografia, trajetória e estatísticas da temporada **em tempo real**.
- **Equipes**: 11 equipes com cores, pilotos, história e **foto real do carro de 2026** (Wikimedia Commons, com crédito), com zoom e animação.
- **Classificação**: pilotos e construtores (posição, pontos, vitórias e pódios) vindos de uma API real.
- **Interatividade**: hero com painel de estúdio, garagem em carrossel (setas, teclado, arrastar e troca automática), cards com inclinação 3D e reflexo, transição de página com "cortina de velocidade" e **som de carro de F1 passando** a cada troca de página (botão de som/mudo no menu; arquivo sintetizado por modelo físico em `tools/f1-pass-sound.py` (Python/NumPy/SciPy) e salvo em `public/sounds/f1-pass.mp3`), e barra de progresso de rolagem.
- **Favoritos** de corridas, circuitos, pilotos e equipes (salvos no `localStorage`).
- **Pesquisa global** (`Ctrl/⌘ + K` ou `/`), menu para celular, botão de voltar ao topo, animações ao rolar, estados de carregamento, erro e vazio, navegação por teclado (foco preso nos modais, Esc para fechar, link "pular para o conteúdo") e respeito a `prefers-reduced-motion`.

## Jogos (`/jogos`)

- **Luzes de largada**: as 5 luzes acendem e apagam num momento sorteado; mede o tempo de reação em ms e detecta queima de largada. Funciona com toque, clique, espaço ou Enter.
- **Pit stop**: os pneus acendem em ordem sorteada; pneu errado custa +0,4 s. Depois é só liberar o carro. Dá para escolher as cores da equipe e o composto.
- **Quiz 2026**: 10 perguntas sorteadas a partir dos dados do próprio site (números, equipes, chefes de equipe, carros, sedes, circuitos, voltas, rodadas). Nada é inventado; cada resposta tem um link "Saiba mais" para a página de origem. A pontuação dá bônus por rapidez e por acertos seguidos.

Os recordes ficam salvos no `localStorage` do aparelho e podem ser compartilhados.

## Atualização automática

O site se mantém atualizado sozinho, sem ninguém precisar recarregar a página:

- **Dados ao vivo**: classificação, estatísticas dos pilotos, resultados e o pódio da última corrida na home são buscados de novo a cada 3 minutos (só com a aba visível), quando a pessoa volta para a aba e quando a internet reconecta. Os dados antigos ficam na tela enquanto os novos chegam. O selo "Atualiza sozinho" mostra a hora da última busca e tem um botão para atualizar na hora.
- **Calendário**: status (próxima, ao vivo, concluída), contagem regressiva e "próximo GP" são calculados pelo relógio, então mudam sozinhos.
- **Versão nova do site**: cada build gera `/version.json` (commit da Vercel). O site consulta esse arquivo a cada 5 minutos; quando sai uma publicação nova, ela entra sozinha na próxima troca de página (ou na hora, se a aba estiver em segundo plano). Os cabeçalhos em `vercel.json` impedem que o navegador guarde versões velhas do `index.html`.

## Tipografia

Inspirada em **Growth** (Broworks Studio) e **TT Burn** (TrueType), que são fontes pagas. Como o projeto não tem a licença delas, usa alternativas gratuitas (OFL) com o mesmo estilo, hospedadas no próprio site via Fontsource:
- **Big Shoulders Display** (títulos, ultracondensada) no lugar da Growth;
- **Oswald Variable** (rótulos, botões e subtítulos, condensada e variável) no lugar da TT Burn;
- **Titillium Web** para textos corridos.

Para usar as fontes originais licenciadas, coloque os arquivos `.woff2` em `public/fonts/`, declare-os com `@font-face` em `src/index.css` e troque os nomes em `tailwind.config.js` (`display` e `condensed`).

## Como executar

Requisitos: Node.js 18 ou mais recente.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # testes (Vitest + Testing Library)
npm run build      # build de produção em dist/
npm run preview    # serve o build localmente
```

## Fontes de dados (sem dados inventados)

| Dado | Onde fica | Fonte |
|---|---|---|
| Calendário, datas, Sprints | `src/data/calendar2026.ts` | [formula1.com/en/racing/2026](https://www.formula1.com/en/racing/2026). Revisão de março/2026: Bahrein e Arábia Saudita foram cancelados. |
| Horários das sessões | `src/data/calendar2026.ts` | **Estimados** pelo padrão de cada evento (`timesConfirmed: false`, avisado na interface). Confira em formula1.com. |
| Circuitos e recordes | `src/data/circuits.ts` | Páginas de circuito em formula1.com. Recordes até 2025; `lapRecord: null` quando não houver dado verificado. Madri está marcado como provisório. |
| Pilotos e equipes | `src/data/drivers.ts`, `src/data/teams.ts` | Lista oficial de pilotos e números de 2026 (formula1.com). Títulos contados até 2025. |
| Classificação, vitórias, pódios e resultados | `src/services/f1Api.ts` | [Jolpica-F1 API](https://github.com/jolpica/jolpica-f1) (sucessora da Ergast), sem chave e com cache de 10 minutos. Se a API não responder, a interface diz que os dados estão indisponíveis; nada é inventado. |

Para trocar a API (por exemplo, por um proxy próprio), crie um `.env` com:

```
VITE_F1_API_BASE=https://seu-proxy.exemplo.com/ergast/f1
```

Nenhuma chave secreta é usada no frontend.

**Imagens de estúdio dos carros:** para mostrar um carro como no showroom (render ou foto em fundo claro, vista 3/4), salve a imagem em `public/cars/<id-da-equipe>.webp` e registre-a em `src/data/carImages.ts` com o crédito. Ela passa a aparecer no hero, na Garagem 2026 e no card da equipe, com inclinação 3D que segue o mouse. Use só imagens com direito de uso. Hoje estão cadastradas, como PNG com fundo transparente (recortado com o modelo BiRefNet via `rembg`): `audi` (render 3/4) e `ferrari` (vista aérea), enviadas pelo responsável do site, e o capacete de Leclerc (`public/helmets/leclerc.webp`, arte de DaiMOnDesign), que substitui o capacete ilustrado no perfil do piloto.

**Fotos dos carros (reais):** usadas para as equipes sem imagem de estúdio. carregadas no navegador do visitante pela API pública do [Wikimedia Commons](https://commons.wikimedia.org) (`src/services/carPhotos.ts`). Só entram fotos com licença livre (CC/domínio público), e cada uma mostra o autor e a licença, com link para o arquivo original. A busca procura a categoria do chassi de 2026 (ex.: *McLaren MCL40*) e, se não achar, o nome do carro ou da equipe com 2026. O resultado fica em cache por 24 h. Se ainda não houver foto livre de um carro, o card avisa e mostra um link para o Commons. Para fixar uma foto específica, coloque o nome do arquivo em `PINNED_PHOTOS`.

Fotos oficiais da F1 e das equipes têm direitos autorais e não são usadas. Capacetes dos pilotos e traçados das pistas são ilustrações SVG deste projeto. Para usar fotos de pilotos, preencha `photoUrl` e `photoCredit` em `drivers.ts` com imagens licenciadas.

## Estrutura

```
src/
  components/  Navbar, Hero, RaceCountdown, RaceCard, CircuitCard, DriverCard, TeamCard,
               SearchBar, Footer, Modal, TrackMap, CarIllustration, ...
  pages/       Home, Calendar, RaceDetail, Circuits, Drivers, Teams, Standings, Favorites, 404
  data/        calendário, circuitos, pilotos e equipes (atualizáveis)
  hooks/       useFavorites, useLocalStorage, useNow, useAsync, useToast
  services/    f1Api (Jolpica), storage
  types/       tipos TypeScript
  utils/       status/contagem, filtros, busca, formatação, traçado SVG, compartilhamento
```

## Como publicar

O site é estático (SPA). Rode `npm run build` e publique a pasta `dist/`.

- **Vercel**: importe o repositório em vercel.com/new (framework "Vite"). O `vercel.json` já redireciona todas as rotas para `index.html`.
- **Netlify**: build command `npm run build` e publish directory `dist`. O arquivo `public/_redirects` cuida das rotas.
- **GitHub Pages / Cloudflare Pages**: publique `dist/` e configure o fallback de SPA para `index.html` (no GitHub Pages, copie `index.html` como `404.html`).

---
Site de fãs sem vínculo com a Formula One Group ou a FIA. "Formula 1", "F1" e marcas relacionadas pertencem aos seus donos.
