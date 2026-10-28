# PAFIES 2027 — Faltam 86 dias (trailer vertical)

Trailer cinematográfico em motion graphics da **10ª Gincana Solidária PAFIES 2027**, feito em
**Remotion + React + TypeScript**. O número **86** é o protagonista, e a assinatura final é a identidade do
PAFIES 2027. Inclui uma cena com a **correção da arrecadação**: mais de 50 mil **quilos** de alimentos,
e não 50 mil toneladas.

- Arquivo final: `out/pafies-2027-86-dias.mp4`
- 1080 × 1920 (9:16), 30 fps, H.264 + AAC
- **25 s (750 frames)**: os 20 s do roteiro + 5 s da cena da correção

## Roteiro

| Tempo | Cena | O que acontece |
| --- | --- | --- |
| 0–3 s | `Cena1Despertar` | Tela escura, grave ecoando, poeira dourada e feixes azuis. A bola de basquete metálica entra girando, com contraluz azul e laranja. "A CONTAGEM COMEÇOU…" surge letra a letra, e a câmera mergulha na bola. |
| 3–7 s | `Cena2Explosao86` | O **86** vem da lente num zoom agressivo e bate no tempo da trilha (frame 100). Tem extrusão 3D real, face metálica dourada com reflexo correndo, aberração cromática, clarão, onda de choque, explosão de faíscas, raios de luz, linhas de energia azul e laranja e tremor de câmera. Texto: "FALTAM 86 DIAS". Sai com um chicote de câmera. |
| 7–12 s | `Cena3Energia` | Tipografia cinética, uma frase por batida: "UMA MISSÃO." / "MUITAS EQUIPES." / "UM SÓ PROPÓSITO.". Painéis inclinados para fotos e vídeos reais passam por trás, junto com formas geométricas do PAFIES, flashes e linhas de velocidade. |
| 12–16 s | `Cena4Expectativa` | A câmera atravessa um túnel de formas, a poeira dourada vira chuva de luz (warp) e o 86 reaparece girando em 3D. Texto: "A SOLIDARIEDADE VAI FAZER HISTÓRIA!". |
| 16–21 s | `Cena5Correcao` | "ATENÇÃO • CORREÇÃO — Já arrecadamos **mais de 50 mil quilos** de alimentos", seguido de "~~Não são 50 mil toneladas~~". A trilha abre espaço para a leitura. |
| 21–25 s | `Cena6Revelacao` | O logo oficial surge do escuro com anel de luz, brilho, faíscas douradas e o maior impacto sonoro. Depois vêm "10ª GINCANA SOLIDÁRIA", "PAFIES 2027" e "VOCÊ FAZ PARTE DESSA HISTÓRIA!". |

Para voltar aos **20 s exatos** sem a correção, remova a cena `correcao` de `src/tempos.json` e de
`src/Pafies86Dias.tsx`, desloque `revelacao` para 480–600 e ajuste `frames` para 600.

## Comandos

```bash
npm install
npm run studio     # pré-visualização interativa (Remotion Studio)
npm run audio      # regenera a trilha (Python 3 + numpy + scipy)
npm run preview    # gera out/previa.png (frame do 86)
npm run render     # exporta out/pafies-2027-86-dias.mp4
npm run typecheck
```

Se o Remotion não conseguir baixar o próprio Chrome, aponte um já instalado:
`REMOTION_BROWSER=/caminho/chrome-headless-shell npm run render`.

## Como trocar logo, fotos e vídeos

- **Logo:** substitua `public/imagens/logo-pafies.png` (o caminho está em `LOGO`, em `src/config.ts`).
  O logo é exibido como está, sem alterações.
- **Fotos e vídeos reais (cena 3):** copie os arquivos para `public/midia/` e liste-os em `MIDIAS`,
  em `src/config.ts`:
  ```ts
  export const MIDIAS: Midia[] = [
    { arquivo: "midia/equipes.jpg" },
    { arquivo: "midia/alimentos.mp4", video: true },
    { arquivo: "midia/uniao.jpg" },
  ];
  ```
  Cada item vai para um painel, na ordem das frases. Sem arquivos, os painéis mostram composições
  gráficas animadas (nenhum texto de "coloque aqui" aparece no vídeo).

## Organização

- `src/tempos.json` — **fonte única dos tempos**: início e fim das cenas e frames-chave dos impactos. O
  Remotion e `tools/gerar-trilha.py` leem este arquivo, então animação e som batem no mesmo frame.
- `src/componentes/`
  - `Base.tsx` — câmera, tremor, clarão, granulação, vinheta, fades.
  - `Efeitos.tsx` — fundo royal/marinho, poeira dourada, feixes de luz, linhas de energia, warp,
    explosão de faíscas, onda de choque, raios e reflexo anamórfico.
  - `Numero3D.tsx` — número com extrusão 3D em CSS (camadas em `translateZ` com perspectiva), face
    metálica com reflexo e aberração cromática.
  - `Texto.tsx` — tipografia cinética (letra a letra, palavra de impacto com mola), rótulos.
  - `Geometria.tsx` — formas da identidade geométrica (meias-luas, círculos, estrelas), túnel 3D e
    painéis de mídia.
  - `Elementos.tsx` — bola de basquete cinematográfica e revelação do logo.
- `src/cenas/` — uma cena por arquivo.
- `tools/gerar-trilha.py` — trilha **original** sintetizada (sem músicas ou samples de terceiros):
  drone em ré menor, golpes (braam, taiko, sub despencando, estalo e brilho) no 86, nas frases, no
  retorno do 86 e na revelação, ostinato de ação a 120 BPM, Shepard tone no túnel, riser antes dos
  impactos e coral em ré maior no final.

## Regras seguidas

- O único número de contagem exibido é **86** (`DIAS` em `src/config.ts`). Não há datas.
- Arrecadação: só a correção confirmada, "mais de 50 mil quilos" e "não 50 mil toneladas". Nenhum
  outro número foi inventado.
- Logo oficial preservado. Textos dentro da área segura do Reels (topo 260 px, base 1450 px).
- Tipografia: **Saira Extra Condensed** (licença OFL), inclinada, no estilo "Super Condensed Extra Bold
  Oblique" da referência (a Base Neue é paga). Para usar a Base Neue, troque os arquivos e os
  `FontFace` em `src/fontes.ts`.
