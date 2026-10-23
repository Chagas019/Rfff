# Mansão Infinity — Luxury 3D Experience

Experiência arquitetônica 3D interativa de uma mansão contemporânea de luxo, feita em **React 19 + TypeScript + Three.js + React Three Fiber**. É um projeto 3D navegável, com interiores completos, mobiliário em escala real, planta baixa conectada ao modelo, iluminação de dia, pôr do sol e noite e visita guiada. Não usa imagens estáticas no lugar do modelo.

**No ar:** https://mansao-infinity.vercel.app (projeto `mansao-infinity` na Vercel, raiz `mansao-infinity/`).

```bash
cd mansao-infinity
npm install
npm run dev        # http://localhost:5173
npm test           # 30 testes (Vitest + Testing Library)
npm run build      # build de produção em dist/
npm run textures   # regenera as texturas PBR procedurais (Python 3 + NumPy + Pillow)
```

Parâmetros de URL opcionais: `?hora=dia|por-do-sol|noite` e `?qualidade=baixa|media|alta|ultra`.

## Conceito arquitetônico

Residência em platô sobre o mar. A fachada principal fica voltada para a rua, ao sul. A piscina e o jardim ficam ao norte, que é de onde vem o sol no Brasil.

- **Volumes:** volume térreo em travertino; volume superior em concreto aparente e teca; caixa de vidro de pé-direito duplo para o estar; terraço sobre cinema e escritório; marquise de concreto branco com 6,5 m em balanço sobre a entrada; lâmina de travertino que organiza o acesso.
- **Áreas:** 1.350 m² construídos (térreo de 44 × 20 m e superior de 28 × 20 m, descontados os vazios). São cerca de 1.280 m² úteis, descontadas as paredes.
- **Programa:**
  - Social: hall com pé-direito duplo (7 m), escada flutuante e elevador; galeria; estar com lareira e painel em Nero Marquina; jantar para 12; cozinha com ilha de 4,4 m e despensa; escritório; cinema; lavabo.
  - Íntimo: suíte master (quarto, closet, banho com banheira independente e varanda), mais 2 suítes, 2 quartos e banho compartilhado.
  - Serviço: lavanderia, depósito/área técnica, hall de serviço e garagem para 4 carros com portão seccionado.
  - Externo: piscina de 20 × 7 m com borda infinita e prainha, terraço, espaço gourmet com pérgola, jardim tropical, muros e portões automáticos.

Fonte única de verdade: `src/data/plan.ts` define cômodos, paredes (com espessura), vãos, escada, vazios e guarda-corpos. A partir dele saem o modelo 3D, a planta 2D, a colisão do modo caminhada e as fichas dos cômodos. O mobiliário fica em `src/data/furniture.ts`, com 200 peças posicionadas em metros, que alimenta tanto os modelos 3D quanto as pegadas na planta.

## Funcionalidades

| Requisito | Onde |
|---|---|
| Órbita 360°, zoom, deslocamento | `CameraController` (camera-controls), com limites por modo |
| Caminhada em 1ª pessoa, entrar pela porta, navegar entre cômodos | `FirstPersonController`: WASD/setas, mouse com pointer lock, joystick virtual no celular, colisão com paredes, portas fechadas, vidros, guarda-corpos e móveis grandes, escada degrau a degrau, elevador (tecla **E**) |
| Vistas externa, interna (corte "casa de bonecas"), superior | Modos 1–4; corte por pavimento (térreo/superior/completa) |
| Clicar nos ambientes | Pisos clicáveis no corte, lista de ambientes e planta 2D |
| Dia / pôr do sol / noite | `LightingSystem`: céu físico, sol com sombras, mapa de ambiente gerado do próprio céu, céu noturno com estrelas e transição suave |
| Ligar/desligar luzes | Por cômodo (ficha do ambiente) ou todas (**L**); LEDs, cúpulas, forros e spots respondem |
| Abrir/fechar portas e portões | Clique na folha, **E** na caminhada ou todas (**O**): portas de giro, duplas, de correr, pivotante de 4,5 m, portão seccionado da garagem e portões da rua |
| Informações de área, materiais e destaques | `RoomInfoPanel` |
| Visita guiada cinematográfica | `TourController` + `src/data/tour.ts`: 14 planos com legenda, pausa e avanço; cortes com fade entre interiores |
| Prancha de apresentação (modo 5) | Isométrica teleobjetiva com o superior flutuando sobre o térreo (separação ajustável), topo das paredes em preto (poché), pé-direito duplo cortado a 4 m, linhas de projeção tracejadas, cômodos legendados em colunas com linhas de chamada, escala gráfica e norte, fundo de prancha quadriculado ou estúdio escuro e luz de estúdio com luminárias acesas; layouts explodida, só térreo ou só superior |
| Planta baixa integrada | `FloorPlan`: paredes com espessura, janelas, portas com arco de abertura, mobiliário em escala, áreas e cotas, escada, norte, escala e posição/direção da câmera ao vivo; clicar leva a câmera ao cômodo |

Atalhos: `1` Externa · `2` Interna · `3` Superior · `4` Caminhar · `5` Apresentação · `P` Planta · `T` Visita · `L` Luzes · `O` Portas · `N` Horário · `Esc` fecha painéis.

## Arquitetura do código

```
src/
  data/        plan.ts (planta), furniture.ts, doors.ts, landscape.ts, tour.ts
  config/      quality.ts (perfis gráficos), lighting.ts (presets de horário)
  store/       useExperience.ts (Zustand), walkInput.ts
  materials/   library.tsx (materiais PBR compartilhados e emissivos por cômodo)
  utils/       geometry.ts, collision.ts, plan2d.ts, interact.ts
  three/
    Experience.tsx, LightingSystem.tsx, PostFX.tsx
    structure/   MansionStructure, structureGeometry, Doors, Stairs, visibility
    rooms/       InteriorRooms (LOD), LivingRoom, SocialRooms (DiningRoom, Kitchen,
                 FoyerGallery, Office, Cinema), PrivateRooms (MasterSuite, Bedrooms,
                 Bathrooms, Garage, ServiceAreas)
    furniture/   primitivas com cache + ~45 tipos de móveis procedurais, Car
    exterior/    MansionExterior, SwimmingPool, Landscape, vegetação instanciada
    controls/    CameraController, FirstPersonController, TourController
  ui/          UIOverlay, LoadingScreen, FloorPlan, RoomNavigation, RoomInfoPanel,
               EnvironmentSelector, WalkHUD, Panels (planta, visita, ajustes, ajuda)
```

## Modelagem, materiais e iluminação

- **Geometria:** procedural e organizada por componentes. Paredes são divididas ao redor de cada vão (trechos cheios, peitoris, vergas). A fachada recebe revestimento em camada própria do lado externo (travertino, concreto, teca), e áreas molhadas recebem revestimento interno. Há rodapés, batentes, caixilhos, peitoris de pedra, beirais, frisos de LED e brises. Móveis usam caixas arredondadas e extrusões (piano de cauda, carros com caixas de roda).
- **Texturas PBR:** geradas por `tools/generate_textures.py` com ruído fractal periódico via FFT, por isso não têm emendas. Cada uma tem cor, normal e rugosidade: concreto com marcas de fôrma e furos de tirante, travertino em réguas, carvalho em tábuas, nogueira, teca, mármores Calacatta e Nero Marquina, porcelanato, grama, pedras, pastilhas, linho, bouclé, veludo, tapete, casca e folhagens com transparência. Saem em WebP (~11 MB no total). As UVs ficam em metros, então a escala dos materiais é real em qualquer peça.
- **Luz:** sol direcional com mapa de sombras de até 4096 px, luz hemisférica, mapa de ambiente do céu e um conjunto fixo de luzes pontuais reais redistribuídas a cada 0,3 s entre os cômodos acesos mais próximos da câmera. Assim o custo fica constante e os shaders não recompilam. Os demais cômodos ficam iluminados por emissivos (forro, LEDs, cúpulas, spots instanciados).
- **Pós-processamento discreto:** N8AO (oclusão de ambiente), bloom só à noite e no pôr do sol, ACES, SMAA e vinheta leve.

## Desempenho e qualidade

- Motor 3D carregado sob demanda (lazy) com **tela de progresso real**, que conta o pacote e as 64 texturas e trata falhas de carregamento.
- Perfis Baixa/Média/Alta/Ultra com resolução, sombras, AO, bloom, luzes, alcance do LOD e densidade de vegetação. No modo **Auto** o perfil inicial depende do aparelho e depois sobe ou desce conforme o FPS (`PerformanceMonitor`).
- **LOD por cômodo:** o mobiliário de ambientes distantes e sem vista de fora não é desenhado.
- Geometrias da estrutura mescladas por material, com poucas chamadas de desenho para milhares de peças. Primitivas dos móveis com cache.
- **Instancing** para palmeiras, árvores, arbustos, capins, spots de forro e ripas do brise.
- WebGL ausente ou erro na cena geram uma tela amigável com opção de recarregar.

## Acessibilidade

Interface em estilo editorial de luxo (painéis com filete de 1 px e cantos retos, monograma, numeração, Cormorant Garamond + Manrope, dourado só como acento). Contraste ≥ 4,5:1 nos painéis, foco visível, alvos de toque de 44 px, rótulos em todos os botões de ícone e atalhos de teclado. Diálogos têm foco preso e fecham com Esc. Os cômodos da planta são operáveis por teclado. A preferência por movimento reduzido desliga transições da interface, o balanço da câmera e a rotação da tela inicial, e encurta as transições de câmera.

## Testes

`npm test` roda 30 testes:

- **Planta:** cômodos sem sobreposição, dentro da projeção construída e com o superior fechando a conta com os vazios; programa mínimo; vãos dentro das paredes; escada pela regra de Blondel.
- **Circulação:** todos os cômodos alcançáveis a partir do hall, por portas, vãos e escada.
- **Mobiliário:** cada peça dentro do seu cômodo.
- **Navegação:** colisão (paredes, portas abertas e fechadas, piscina, vazios), altura da escada e interação.
- **Geometria e corte:** cortes de parede, lado externo, regras do corte.
- **Estado e interface:** foco em cômodo, portas, planta clicável e por teclado, ficha do cômodo e seletor de horário.

O QA visual foi feito com o Chromium headless em várias vistas (externa nos três horários, cortes, vista superior, interiores, planta, celular).

## Decisões e limitações

- O ambiente de desenvolvimento não tinha acesso a bibliotecas externas de HDRI, texturas ou modelos GLB (Poly Haven bloqueado). Por isso tudo é procedural. A estrutura aceita GLB sem mudanças: basta trocar um componente de `furniture/` por `useGLTF`.
- O mapa de ambiente é gerado do próprio céu da cena, e não de uma foto HDRI.
- Na renderização por software (headless) a cena roda a ~1 FPS. Em GPU real os perfis Alta/Média são os indicados.
- A skill `ui-ux-pro-max` foi consultada para a direção de interface (glassmorphism com contraste, foco visível, alvos de toque, movimento reduzido). A paleta sugerida por ela foi descartada em favor da pedida no briefing (preto, branco, grafite e tons naturais).
