# GRID F1 — A Experiência da Velocidade

Uma plataforma interativa para fãs da Fórmula 1 (temporada 2026), feita com **React + TypeScript + Vite**, **Tailwind CSS**, **Framer Motion** e **Lucide React**.

## Funcionalidades

- **Início**: hero cinematográfico ("THE RACE NEVER STOPS."), faixa animada com dados da temporada, card do próximo GP com contagem regressiva em tempo real (que nunca fica negativa), favoritar e compartilhar.
- **Calendário 2026**: as 22 etapas mais as 2 canceladas (Bahrein e Arábia Saudita), com busca, filtros por país, mês e status, alternância entre cards e lista (preferência salva) e página de detalhes de cada GP (`/calendario/:id`) com programação, contagem, exportação `.ics`, compartilhamento (Web Share API, com cópia do link como alternativa) e resultado oficial quando a corrida já terminou.
- **Circuitos**: cards com traçado SVG animado, ficha técnica, recorde de volta verificado e modal de detalhes (`/circuitos/:id`).
- **Pilotos**: galeria dos 22 titulares, busca, filtro por equipe, ordenação e perfil (`/pilotos/:id`) com biografia, trajetória e estatísticas da temporada **em tempo real**.
- **Equipes**: 11 equipes com cores, pilotos, história e **foto real do carro de 2026** (Wikimedia Commons, com crédito), com zoom e animação.
- **Classificação**: pilotos e construtores (posição, pontos, vitórias e pódios) vindos de uma API real.
- **Favoritos** de corridas, circuitos, pilotos e equipes (salvos no `localStorage`).
- **Pesquisa global** (`Ctrl/⌘ + K` ou `/`), menu para celular, botão de voltar ao topo, animações ao rolar, estados de carregamento, erro e vazio, navegação por teclado (foco preso nos modais, Esc para fechar, link "pular para o conteúdo") e respeito a `prefers-reduced-motion`.

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

**Fotos dos carros (reais):** carregadas no navegador do visitante pela API pública do [Wikimedia Commons](https://commons.wikimedia.org) (`src/services/carPhotos.ts`). Só entram fotos com licença livre (CC/domínio público), e cada uma mostra o autor e a licença, com link para o arquivo original. A busca procura a categoria do chassi de 2026 (ex.: *McLaren MCL40*) e, se não achar, o nome do carro ou da equipe com 2026. O resultado fica em cache por 24 h. Se ainda não houver foto livre de um carro, o card avisa e mostra um link para o Commons. Para fixar uma foto específica, coloque o nome do arquivo em `PINNED_PHOTOS`.

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
