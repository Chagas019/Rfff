# PAFIES 2027 — vídeo promocional

Vídeo curto da **10ª Gincana Solidária PAFIES 2027**, feito em **Remotion + React + TypeScript**,
com dois recados apenas:

1. **Faltam 86 dias para a gincana** — as provas começam em **22 de janeiro de 2027**.
2. **Correção da arrecadação**: já foram arrecadados **mais de 50 mil quilos** de alimentos
   (e **não** 50 mil toneladas).

| Versão | Arquivo | Formato |
| --- | --- | --- |
| Vertical (Reels, Stories, WhatsApp) | `out/pafies-2027-vertical-9x16.mp4` | 1080 × 1920, 30 fps, 33,5 s |
| Horizontal | `out/pafies-2027-horizontal-16x9.mp4` | 1920 × 1080, 30 fps, 33,5 s |

## Roteiro

| Tempo | Cena | Na tela | Locução |
| --- | --- | --- | --- |
| 0–10 s | `Cena1Contagem` | "A contagem regressiva começou! **Faltam 86 dias para a gincana**" → "22 de janeiro de 2027 — começam as provas!" | "E já pode marcar no calendário! No dia vinte e dois de janeiro de dois mil e vinte e sete, começam as provas da nossa gincana!" |
| 10–28,8 s | `Cena2Aviso` | "Atenção! Aviso importante — correção sobre a arrecadação de alimentos" → "+50.000 KG de alimentos" → "Mais de 50 mil quilos arrecadados!" → "~~Não são 50 mil toneladas~~" | Correção completa ("…mais de cinquenta mil quilos, e não cinquenta mil toneladas!") |
| 28,8–33,5 s | `Cena3Encerramento` | Logo, "PAFIES 2027", "Faltam 86 dias", "+50 mil quilos de alimentos arrecadados!" | — (só música) |

## Comandos

```bash
npm install
npm run studio            # pré-visualização interativa
npm run render            # renderiza as duas versões em out/
npm run audio             # regenera trilha e efeitos (Python 3 + numpy + scipy)
npm run typecheck
```

Se o Remotion não conseguir baixar o próprio Chrome, aponte um já instalado:
`REMOTION_BROWSER=/caminho/chrome-headless-shell npm run render`.

### Contagem regressiva

Os dias são calculados entre a data de referência (padrão **28/10/2026**, em `src/config.ts`) e
22/01/2027, o que dá **86 dias**. Para recalcular a partir de outra data, ou do dia do render (valor vazio):

```bash
npx remotion render src/index.ts PafiesVertical out/pafies-2027-vertical-9x16.mp4 \
  --props='{"dataReferencia":"2026-11-15"}'   # ou '{"dataReferencia":""}' para usar hoje
```

## Como está organizado

- `roteiro.json` — **fonte única dos tempos**: início e fim de cada cena, entrada e duração das falas
  e as "marcas" (momentos em que os textos aparecem, sincronizados com a voz). O Remotion e o
  gerador de trilha leem este arquivo.
- `src/Pafies.tsx` — monta as cenas com `Sequence`, a trilha, os efeitos e a narração, e faz o
  **ducking**: a música cai de 0,55 para 0,14 enquanto a locutora fala.
- `src/cenas/` — `Cena1Contagem`, `Cena2Aviso`, `Cena3Encerramento`.
- `src/componentes/` — `Visual.tsx` (fundo, fachos de luz, partículas, câmera, títulos, layout 9:16/16:9),
  `Elementos.tsx` (logotipo e elemento 3D) e `Esportes.tsx` (bola de basquete quicando e rally de pingue-pongue).
- `tools/gerar-trilha.py` — trilha **original**, sintetizada no próprio projeto: hino eletrônico
  esportivo a 120 BPM em mi menor, com acordes que "pulsam", arpejo, baixo, bumbo 4×4 e virada de caixa
  antes do final. Fica mais contida durante o aviso. Os efeitos (impactos, brilhos, subidas, quiques e
  raquetadas) seguem o mesmo tempo.
- `tools/preparar-imagens.py` e `tools/preparar-esportes.py` — recortes do logotipo oficial e dos
  elementos enviados (nó e raio laranja, bola de basquete metálica, raquetes).

### Paleta

`#071B49` azul-marinho · `#1261D8` azul · `#36A5FF` azul luminoso · `#FF6A00` laranja ·
`#FFB347` laranja dourado · `#FFFFFF` branco.

## Narração

A narração foi gerada na **ElevenLabs** (modelo `eleven_v4`, voz **"Lari Diniz"**, feminina, pt-BR).
As falas originais estão em `narracao-original/`. As usadas no vídeo, em `public/narracao/`, tiveram o
silêncio das pontas cortado, andamento 1,12× (sem mudar o tom) e volume normalizado:

```bash
ffmpeg -i narracao-original/cenaN.mp3 -af "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.1,areverse,atempo=1.12,loudnorm=I=-16:TP=-1.5:LRA=7" -ar 44100 -b:a 192k saida.mp3
```

- `contagem.mp3` — trecho inicial da fala da contagem (até "…começam as provas da nossa gincana!").
- `aviso.mp3` — a correção completa.

### ⚠️ Limitação: a locutora não fala "86 dias"

A ElevenLabs bloqueou a conta gratuita ("atividade incomum… faça upgrade") antes que desse para gerar
uma fala nova. Por isso, o **"Faltam 86 dias"** aparece em destaque **na tela**, enquanto a voz anuncia a
data das provas. Para a locutora falar o número:

1. Gere, com a mesma voz, algo como *"Faltam oitenta e seis dias para a nossa gincana! No dia vinte e
   dois de janeiro de dois mil e vinte e sete, começam as provas!"* e salve em `narracao-original/`.
2. Trate com o comando ffmpeg acima, gerando `public/narracao/contagem.mp3`.
3. Em `roteiro.json`, atualize `falaDuracao` da cena `contagem` (use `ffprobe`) e, se for preciso,
   as marcas `data` e `provas` e o `fim` da cena.
4. `npm run audio && npm run render`.

## Imagens

- Logotipo: o oficial, recortado do perfil (não foi redesenhado).
- Nó e raio laranja, bola de basquete e raquetes: imagens de referência enviadas, com o fundo removido.
  A bolinha de pingue-pongue é desenhada em vetor, porque a da imagem tinha resolução baixa demais.
