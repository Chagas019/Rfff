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
