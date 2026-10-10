# Modelo 3D do carro

Os arquivos em `car/` e `studio.js` vêm do projeto **F1 Rules Explorer**
(https://github.com/MatthewDelong/formula1, licença ISC, conforme `package.json`
do repositório), que modela proceduralmente um carro genérico de F1 2026, sem
equipes nem logotipos. Alterações feitas aqui: cor de fundo do estúdio
(`STUDIO_BG`) para combinar com o site; pintura do carro (`liveryColor` e acabamento com verniz em `car/materials.js`). `carScene.ts` é o código deste site que
monta a cena e controla a câmera pela rolagem.

ISC License — Copyright (c) MatthewDelong

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES.

## Modelo pré-gerado (desempenho)

Para o site não travar montando o carro peça por peça no navegador, o modelo é
gerado uma vez e salvo em `public/models/f1-2026.glb` (geometria comprimida com
meshopt, ~1,7 MB / ~680 KB com gzip). Os materiais são recriados em tempo de
execução por `createMaterials()` e reaplicados pelo nome.

Para regenerar depois de mudar a geometria em `car/`:
1. `npm run dev` (porta 5180) e rode `node scripts/export-car-glb.mjs car.glb` (Playwright);
2. `node scripts/optimize-car-glb.mjs car.glb public/models/f1-2026.glb`
   (requer `@gltf-transform/core`, `@gltf-transform/extensions`, `@gltf-transform/functions` e `meshoptimizer`).
