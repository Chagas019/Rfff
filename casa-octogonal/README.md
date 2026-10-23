# Casa Octógono — 3D

Casa de pedra natural em planta octogonal, no meio da mata: cobertura em laje
de pedra com claraboia de vidro facetada sobre a sala rebaixada com lareira
central, e oito ambientes em volta (estar com lareira, jantar, cozinha, três
suítes, quarto de hóspedes e banho).

Feita em React + TypeScript com Three.js, React Three Fiber, drei,
postprocessing, Tailwind e Zustand.

## Vistas

- **Aérea**: a casa na clareira, com o caminho de cascalho em volta e a mata.
- **Corte**: sem a cobertura, com as paredes cortadas em preto e legendas dos
  ambientes, sobre fundo claro (como uma maquete de apresentação).
- **Interior**: de dentro da sala central, olhando a sala rebaixada.

Cada vista funciona de tarde e de noite (luzes internas e fogo acesos).
Também dá para abrir direto por URL: `?vista=corte&luz=noite`.

## Como rodar

```bash
npm install
npm run dev       # desenvolvimento
npm test          # testes
npm run build     # build de produção (dist/)
```

## Texturas

A pedra irregular, o cascalho e o chão de mata são procedurais e sem emendas:

```bash
npm run textures   # python3 + numpy + pillow
```

As madeiras, tecidos e mármore vêm da Mansão Infinity (`../mansao-infinity`).

## Estrutura

- `src/data/plan.ts`: geometria do octógono, ambientes e vãos (portas, janelas).
- `src/three/geom.ts`: construção das paredes em peças ao redor dos vãos, com
  UV em metros.
- `src/three/House.tsx`: paredes, pisos, sala rebaixada, laje e claraboia.
- `src/three/Furniture.tsx`: mobiliário de cada ambiente.
- `src/three/Site.tsx`: terreno, caminhos, arbustos e mata instanciados.
- `src/three/Scene.tsx`: câmera, luzes, ambiente, legendas e pós-processamento.
