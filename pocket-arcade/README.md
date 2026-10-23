# Pocket Arcade

Reconstrução 3D interativa do videogame portátil da fotografia de referência
(`public/reference/pocket-arcade-reference.jpg`), com quatro jogos originais que rodam na
tela do próprio aparelho e um modo de realidade aumentada que só aparece quando o navegador
oferece RA de verdade.

Stack: **React 18 + TypeScript + Vite**, **Three.js** (sem React Three Fiber: o modelo é um
`THREE.Group` reutilizado no visualizador, na sessão WebXR e nos exportadores GLB/USDZ),
**Canvas 2D** para os jogos, **Web Audio** para os sons, **Vitest** e **Playwright**.

## Como executar

Requisitos: Node.js 18+.

```bash
cd pocket-arcade
npm install
npm run dev            # http://localhost:5173
npm test               # testes de unidade (Vitest)
npm run build          # build de produção em dist/
npm run preview        # serve o build
npm run test:e2e       # teste ponta a ponta no Chromium (precisa do build)
```

`npm run test:e2e` e as ferramentas abaixo usam o Chromium em `/opt/pw-browsers/chromium`.
Em outra máquina, aponte para o seu com `CHROMIUM_PATH=/caminho/do/chrome`.

Ferramentas:

| Comando | O que faz |
|---|---|
| `npm run compare:reference -- http://localhost:5173/ comparacao.png` | Renderiza a vista "Como na foto" e monta uma imagem lado a lado com a fotografia, para conferir a fidelidade. |
| `npm run export:models` | Exporta o modelo para `public/models/pocket-arcade.glb` (Scene Viewer/Android) e `pocket-arcade.usdz` (AR Quick Look/iPhone). Rode depois de mudar o modelo: `npm run build && npm run export:models && npm run build`. |

## O que tem

### Modelo 3D (`src/three/`)

- **Geometria real e procedural**, sem nenhuma imagem plana fazendo papel de aparelho:
  carcaça em duas partes (placa frontal + concha traseira) com friso, cantos arredondados e
  chanfros; poços dos botões; botões em torno (colar + capa côncava); joystick com carcaça,
  anéis cromados e capa articulada; cartuchos, cartão, argola e cabo USB em tubo curvo.
- **Medidas tiradas da foto** (`src/three/ArcadeModel/layout.ts`): cada componente foi
  posicionado em coordenadas normalizadas medidas no quadrilátero da face frontal.
- **Materiais PBR**: plástico perolado (clearcoat, sheen, microtextura procedural de
  rugosidade e normal map), metal, cromo, plásticos coloridos brilhantes, vidro da tela.
- **Iluminação de estúdio** com ambiente gerado localmente (sem baixar HDR), luz principal
  com sombras suaves, preenchimento lilás e contraluz; mapeamento de tons neutro.
- **Inscrições**: "Play", "Fast Campus", "groffi", "Memory Card", "CE/FC" e a carinha foram
  redesenhadas em canvas de alta resolução. A arte da tela ("MOTION GRAPHIC ADVENTURE /
  MOTION DESIGN 2024") é o **recorte original da foto**, retificado
  (`public/textures/screen-reference.jpg`), e aparece como tela de abertura.
- **Interação**: órbita de 360°, zoom suave, câmera com interpolação entre vistas (Como na
  foto, Frente, Laterais, Traseira, Topo), botões que afundam, joystick que inclina,
  cartuchos que saem e voltam (a câmera se afasta sozinha para caber a peça),
  vários toques simultâneos, flutuação de vitrine (desligada com "reduzir movimento").
- **Desempenho**: ~48 mil vértices indexados, sombras e resolução reduzidas em celulares
  e qualidade adaptativa (se o aparelho não acompanhar, cai a resolução e depois as sombras).

### Jogos (`src/games/`)

Todos originais, desenhados em um canvas de 300×200 que vira a textura da tela 3D (com
grade de LCD) e usando uma fonte pixelada própria com acentos.

| Jogo | Peça física que carrega | Destaques |
|---|---|---|
| **Pixel Adventure** | Cartucho amarelo (topo) | 3 fases, corrida, pulo variável com tolerância, moedas, espinhos, inimigos que se derrota pulando em cima, vidas, bandeira. Os testes conferem que todo buraco e degrau está ao alcance do pulo. |
| **Space Defender** | Cartão azul (lateral) | Ondas progressivas com 3 tipos de inimigo, tiros, bombas, explosões, invencibilidade temporária, recorde. |
| **Snake Classic** | Memória interna | Velocidade de 1 a 5, comida sempre em célula livre, crescimento, colisões, recorde. |
| **Brick Breaker** | Peça vermelha (base) | 5 fases, blocos com resistência e de metal, ângulo pela posição na raquete, sem atravessar blocos, vidas. |

O aparelho da foto tem só três peças removíveis; o Snake fica na memória interna para não
inventar uma quarta peça.

Estados comuns: título → jogando → pausado → fim/vitória, com reinício e recorde local
(`localStorage`).

### Controles

| Controle | Função | Teclado | Gamepad |
|---|---|---|---|
| Joystick amarelo | direcional | setas / WASD | analógico e direcional |
| Botão azul | ação principal (atirar, correr, lançar) | Z, J | X, Y |
| Botão amarelo | confirmar, pular | X, K, Espaço | A |
| Botão vermelho | voltar, pausar, sair | C, L, Esc | B, Select |
| Botão branco | Start / Pausa | Enter, P | Start |

Funcionam por clique/toque direto no modelo 3D, pelos controles na tela (aparecem no modo
Jogar em telas de toque e menores), pelo teclado e por gamepad. São **controles virtuais**:
nada aqui aciona um aparelho físico.

### Realidade aumentada ("Ver no meu espaço")

O app detecta o que o navegador realmente oferece e nunca mostra câmera falsa:

| Situação | O que acontece |
|---|---|
| WebXR `immersive-ar` (Chrome no Android com ARCore) | Sessão completa: retícula de detecção de superfície, toque para posicionar, âncora quando disponível, arrastar para girar, pinça para redimensionar, toque em outro ponto para mover, **jogos funcionando** com os controles na sobreposição. Mesmo objeto 3D, mesmos materiais. A câmera só é pedida nesse momento. |
| iPhone/iPad (Safari) | Abre `pocket-arcade.usdz` no AR Quick Look (modelo estático). |
| Android sem WebXR | Abre `pocket-arcade.glb` no Scene Viewer (modelo estático). |
| Desktop e demais navegadores | Explica a limitação e mantém o 3D. |
| Permissão negada | Mensagem clara e volta ao 3D. |

RA exige HTTPS (ou `localhost`).

## Estrutura

```
src/
  app/            App.tsx (interface) e runtime.ts (liga palco, jogos, entrada e áudio)
  components/     ArcadeViewer, ArcadeControls, CartridgeSelector, ARExperience, HelpSheet, ícones
  three/          ArcadeModel (layout, formas, peças), Materials, Lighting, CameraControls, ar/ARSession
  games/          engine (fonte, entrada, jogo-base), console (tela e biblioteca), 4 jogos, catálogo
  services/       input (teclado/gamepad/toque), audio (Web Audio), arSupport, storage
  styles/         CSS global
  test/           utilitários de teste
public/
  reference/      fotografia de referência
  textures/       recorte retificado da tela da foto
  models/         GLB e USDZ exportados do modelo
tests/e2e/        teste ponta a ponta (Playwright)
tools/            comparação com a foto e exportação dos modelos
```

## Publicação

O app é estático. Na Vercel, importe o repositório e defina **Root Directory = `pocket-arcade`**
(framework "Vite"); o site GRID F1 da raiz continua independente. Qualquer hospedagem estática
serve: publique `pocket-arcade/dist/`. Para RA no celular, a publicação precisa de HTTPS.

## Limitações conhecidas (honestas)

- **Fonte única**: o modelo foi reconstruído a partir de uma foto de frente. Traseira,
  lateral direita, topo e medidas absolutas não aparecem; foram completados de forma
  discreta (tampa traseira, pés de borracha, parafusos) e **não** devem ser lidos como iguais
  ao produto real. A proporção (≈0,76) e a espessura foram estimadas pela perspectiva.
- **Não há arquivo 3D original**: tudo é procedural. A arquitetura aceita trocar o modelo por
  um GLB de maior fidelidade (o `ArcadeModel` expõe peças, controles e animações por nome).
- **Inscrições pequenas**: textos ilegíveis na foto não foram inventados; o cartão azul mostra
  apenas "Memory Card", e a base, "CE"/"FC".
- **Diferenças visuais restantes** em relação à foto (veja `npm run compare:reference`): a
  renderização em tempo real não reproduz a oclusão de ambiente nem o desfoque de fundo da foto;
  o joystick e o adesivo "Play" estão próximos, mas não idênticos.
- **Desempenho medido só em renderização por software** (o ambiente de desenvolvimento não tem
  GPU). Em GPU real o custo é bem menor; a qualidade adaptativa protege aparelhos fracos.
- **RA no AR Quick Look e no Scene Viewer** mostra o modelo estático (sem jogos). A experiência
  completa exige WebXR. Um app nativo (ARKit/ARCore) só seria necessário para recursos além do
  que o WebXR oferece (por exemplo, oclusão por pessoas).
- A sessão WebXR foi testada com WebXR simulado (permissão negada, suporte ausente); não houve
  um celular com ARCore disponível para testar a sessão real.

## Créditos

Fotografia de referência fornecida pelo responsável do projeto. Jogos, sons, fonte pixelada,
ícones e todo o código são originais deste projeto.
