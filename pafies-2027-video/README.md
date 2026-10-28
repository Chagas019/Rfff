# PAFIES 2027 — vídeo promocional

Vídeo da **10ª Gincana Solidária PAFIES 2027** feito em **Remotion + React + TypeScript**:
contagem regressiva para o início das provas (**22 de janeiro de 2027**), narração feminina
em português brasileiro e o aviso oficial corrigindo a arrecadação (**mais de 50 mil quilos**
de alimentos, **não** toneladas).

| Versão | Arquivo | Formato |
| --- | --- | --- |
| Vertical (Reels, Stories, WhatsApp) | `out/pafies-2027-vertical-9x16.mp4` | 1080 × 1920, 30 fps, 65 s |
| Horizontal | `out/pafies-2027-horizontal-16x9.mp4` | 1920 × 1080, 30 fps, 65 s |

## Comandos

```bash
npm install
npm run studio            # pré-visualização interativa
npm run render            # renderiza as duas versões em out/
npm run render:vertical   # só 9:16
npm run render:horizontal # só 16:9
npm run audio             # regenera trilha e efeitos (precisa de Python 3 + numpy + scipy)
npm run typecheck
```

Se o Remotion não conseguir baixar o próprio Chrome, aponte um já instalado:
`REMOTION_BROWSER=/caminho/chrome-headless-shell npm run render`.

### Contagem regressiva

O vídeo mostra **"FALTAM 86 DIAS PARA A GINCANA"**: os dias são calculados entre a data de
referência (padrão **28/10/2026**, em `src/config.ts`) e 22/01/2027. Para recalcular a partir
de outra data, ou do dia do render (valor vazio):

```bash
npx remotion render src/index.ts PafiesVertical out/pafies-2027-vertical-9x16.mp4 \
  --props='{"dataReferencia":"2026-11-15"}'   # ou '{"dataReferencia":""}' para usar hoje
```

## Como está organizado

- `roteiro.json` — **fonte única dos tempos**: início/fim de cada cena, quando cada fala entra,
  duração das falas e as "marcas" (momentos em que textos aparecem, sincronizados com a voz).
  O Remotion e o gerador de trilha leem este arquivo.
- `src/Pafies.tsx` — monta as 6 cenas com `Sequence`, a trilha, os efeitos e a narração;
  faz o **ducking** (a música cai de 0,55 para 0,14 enquanto a locutora fala, com ataque de 0,25 s
  e soltura de 0,6 s).
- `src/cenas/` — uma cena por arquivo: `Cena1Chamado`, `Cena2Gincana`, `Cena3Contagem`,
  `Cena4Aviso`, `Cena5Gratidao`, `Cena6Encerramento`.
- `src/componentes/Visual.tsx` — fundo, fachos de luz volumétrica, partículas, faixas de luz,
  clarões, câmera simulada, títulos e layout responsivo (9:16 e 16:9).
- `src/config.ts` — paleta oficial, cálculo de dias, data das provas.
- `tools/gerar-trilha.py` — trilha **original** sintetizada (piano, pads, percussão, tambores na
  contagem, impactos, brilhos e subidas). Nada de música comercial.
- `tools/preparar-imagens.py` — recorta o logotipo oficial do print do perfil e tira o fundo dos
  elementos 3D laranja de referência.

### Paleta

`#071B49` azul-marinho · `#1261D8` azul · `#36A5FF` azul luminoso · `#FF6A00` laranja ·
`#FFB347` laranja dourado · `#FFFFFF` branco.

## Narração

Gerada na **ElevenLabs** (modelo `eleven_v4`, voz **"Lari Diniz"**, feminina, pt-BR, para anúncios).
Os arquivos originais estão em `narracao-original/`; os usados no vídeo (`public/narracao/`)
tiveram o silêncio das pontas cortado, andamento 1,12× (sem alterar o tom) e volume normalizado:

```bash
ffmpeg -i narracao-original/cenaN.mp3 -af "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.1,areverse,atempo=1.12,loudnorm=I=-16:TP=-1.5:LRA=7" -ar 44100 -b:a 192k public/narracao/cenaN.mp3
```

### ⚠️ Pendência: fala da cena 6

A ElevenLabs bloqueou a conta gratuita antes da última fala ("PAFIES 2027! A solidariedade nos une.
E essa história, vamos escrever juntos!"), então **o encerramento está sem locução** — só música,
impactos e textos. Para completar:

1. Gere a fala com a mesma voz (Lari Diniz) e salve em `narracao-original/cena6.mp3`.
2. Trate com o comando ffmpeg acima, gerando `public/narracao/cena6.mp3`.
3. Em `roteiro.json`, na cena `encerramento`, preencha `"narracao": "cena6.mp3"`,
   `"falaInicio": 60.2` e `"falaDuracao"` com a duração do arquivo (`ffprobe`). Se a fala
   passar de 65 s, aumente `"fim"` da cena e `"duracao"` do vídeo.
4. `npm run audio && npm run render`.

## Imagens

- Logotipo: o oficial, recortado do perfil (não foi redesenhado).
- Elementos 3D laranja (nó e raio): imagens de referência enviadas, com o fundo removido.
- Cena de gratidão: **ilustrações vetoriais** (caixa de mantimentos, mãos com coração,
  voluntários). Não havia fotos reais do PAFIES, e nada foi feito para parecer registro do evento.
  Para usar fotos reais, troque os componentes em `src/cenas/Cena5Gratidao.tsx` por `<Img>`
  apontando para arquivos em `public/`.
