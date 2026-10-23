/**
 * Fonte pixelada 5×7 própria (desenhada para este projeto). Cada glifo tem 7 linhas de
 * 5 bits. Acentos do português são desenhados como marcas em cima/embaixo da letra-base.
 */
const G: Record<string, string> = {
  A: '01110 10001 10001 11111 10001 10001 10001',
  B: '11110 10001 10001 11110 10001 10001 11110',
  C: '01110 10001 10000 10000 10000 10001 01110',
  D: '11110 10001 10001 10001 10001 10001 11110',
  E: '11111 10000 10000 11110 10000 10000 11111',
  F: '11111 10000 10000 11110 10000 10000 10000',
  G: '01110 10001 10000 10111 10001 10001 01111',
  H: '10001 10001 10001 11111 10001 10001 10001',
  I: '01110 00100 00100 00100 00100 00100 01110',
  J: '00111 00010 00010 00010 00010 10010 01100',
  K: '10001 10010 10100 11000 10100 10010 10001',
  L: '10000 10000 10000 10000 10000 10000 11111',
  M: '10001 11011 10101 10101 10001 10001 10001',
  N: '10001 10001 11001 10101 10011 10001 10001',
  O: '01110 10001 10001 10001 10001 10001 01110',
  P: '11110 10001 10001 11110 10000 10000 10000',
  Q: '01110 10001 10001 10001 10101 10010 01101',
  R: '11110 10001 10001 11110 10100 10010 10001',
  S: '01111 10000 10000 01110 00001 00001 11110',
  T: '11111 00100 00100 00100 00100 00100 00100',
  U: '10001 10001 10001 10001 10001 10001 01110',
  V: '10001 10001 10001 10001 10001 01010 00100',
  W: '10001 10001 10001 10101 10101 10101 01010',
  X: '10001 10001 01010 00100 01010 10001 10001',
  Y: '10001 10001 01010 00100 00100 00100 00100',
  Z: '11111 00001 00010 00100 01000 10000 11111',
  '0': '01110 10001 10011 10101 11001 10001 01110',
  '1': '00100 01100 00100 00100 00100 00100 01110',
  '2': '01110 10001 00001 00010 00100 01000 11111',
  '3': '11111 00010 00100 00010 00001 10001 01110',
  '4': '00010 00110 01010 10010 11111 00010 00010',
  '5': '11111 10000 11110 00001 00001 10001 01110',
  '6': '00110 01000 10000 11110 10001 10001 01110',
  '7': '11111 00001 00010 00100 01000 01000 01000',
  '8': '01110 10001 10001 01110 10001 10001 01110',
  '9': '01110 10001 10001 01111 00001 00010 01100',
  ' ': '00000 00000 00000 00000 00000 00000 00000',
  '.': '00000 00000 00000 00000 00000 01100 01100',
  ',': '00000 00000 00000 00000 01100 00100 01000',
  ':': '00000 01100 01100 00000 01100 01100 00000',
  '!': '00100 00100 00100 00100 00100 00000 00100',
  '?': '01110 10001 00001 00010 00100 00000 00100',
  '-': '00000 00000 00000 11111 00000 00000 00000',
  '+': '00000 00100 00100 11111 00100 00100 00000',
  '=': '00000 00000 11111 00000 11111 00000 00000',
  '/': '00001 00010 00010 00100 01000 01000 10000',
  "'": '00100 00100 01000 00000 00000 00000 00000',
  '(': '00010 00100 01000 01000 01000 00100 00010',
  ')': '01000 00100 00010 00010 00010 00100 01000',
  '%': '11000 11001 00010 00100 01000 10011 00011',
  '*': '00000 00100 10101 01110 10101 00100 00000',
  '#': '01010 01010 11111 01010 11111 01010 01010',
  '<': '00010 00100 01000 10000 01000 00100 00010',
  '>': '01000 00100 00010 00001 00010 00100 01000',
  '▶': '01000 01100 01110 01111 01110 01100 01000',
  '◀': '00010 00110 01110 11110 01110 00110 00010',
  '▲': '00000 00000 00100 01110 11111 00000 00000',
  '▼': '00000 00000 11111 01110 00100 00000 00000',
  '♥': '00000 01010 11111 11111 01110 00100 00000',
  '●': '00000 01110 11111 11111 11111 01110 00000',
  '★': '00100 00100 11111 01110 01110 11011 00000',
};

const ACCENTS: Record<string, { rows: string[]; below?: boolean }> = {
  '́': { rows: ['00010', '00100'] }, // agudo
  '̀': { rows: ['01000', '00100'] }, // grave
  '̂': { rows: ['00100', '01010'] }, // circunflexo
  '̃': { rows: ['01101', '10110'] }, // til
  '̧': { rows: ['00100', '01000'], below: true }, // cedilha
};

const GLYPHS = new Map<string, number[][]>();
for (const [ch, rows] of Object.entries(G)) {
  GLYPHS.set(
    ch,
    rows.split(' ').map((r) => r.split('').map((b) => (b === '1' ? 1 : 0))),
  );
}

export const GLYPH_W = 5;
export const GLYPH_H = 7;
export const ADVANCE = 6;

export function textWidth(text: string, scale = 1) {
  const n = [...text.normalize('NFD')].filter((c) => !ACCENTS[c]).length;
  return Math.max(0, n * ADVANCE - 1) * scale;
}

export interface TextOpts {
  color?: string;
  scale?: number;
  align?: 'left' | 'center' | 'right';
  shadow?: string;
}

/** Desenha texto com a fonte pixelada. Retorna a largura desenhada. */
export function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, opts: TextOpts = {}): number {
  const scale = opts.scale ?? 1;
  const w = textWidth(text, scale);
  let cx = Math.round(opts.align === 'center' ? x - w / 2 : opts.align === 'right' ? x - w : x);
  const cy = Math.round(y);
  if (opts.shadow) {
    drawText(ctx, text, x + scale, y + scale, { ...opts, shadow: undefined, color: opts.shadow });
  }
  ctx.fillStyle = opts.color ?? '#ffffff';
  const chars = [...text.toUpperCase().normalize('NFD')];
  for (let i = 0; i < chars.length; i++) {
    const glyph = GLYPHS.get(chars[i]) ?? GLYPHS.get('?')!;
    plot(ctx, glyph, cx, cy, scale);
    // marcas de acento que vêm logo depois da letra-base
    while (i + 1 < chars.length && ACCENTS[chars[i + 1]]) {
      const acc = ACCENTS[chars[++i]];
      const rows = acc.rows.map((r) => r.split('').map((b) => (b === '1' ? 1 : 0)));
      plot(ctx, rows, cx, acc.below ? cy + GLYPH_H * scale : cy - 3 * scale, scale);
    }
    cx += ADVANCE * scale;
  }
  return w;
}

function plot(ctx: CanvasRenderingContext2D, rows: number[][], x: number, y: number, s: number) {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      if (row[c]) ctx.fillRect(x + c * s, y + r * s, s, s);
    }
  }
}

export function hasGlyph(ch: string) {
  return GLYPHS.has(ch.toUpperCase());
}
