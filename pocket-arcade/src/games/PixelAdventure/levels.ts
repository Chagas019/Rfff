/**
 * Fases do Pixel Adventure, montadas por código para que distâncias de pulo sejam
 * verificáveis nos testes.
 *
 * Tiles: '#' chão, 'B' bloco, '=' plataforma, 'o' moeda, '^' espinhos, 'F' bandeira,
 * '.' vazio. Inimigos e o ponto de partida ficam em listas separadas.
 */
export const TILE = 10;
export const LEVEL_ROWS = 18;
/** Linha do topo do chão "normal". */
export const GROUND = 15;

export interface LevelData {
  name: string;
  theme: 'forest' | 'ruins' | 'falls';
  tiles: string[][];
  width: number;
  start: { col: number; row: number };
  enemies: Array<{ col: number; row: number; speed: number }>;
  /** Maior buraco (em tiles) — usado nos testes de alcance do pulo. */
  maxGap: number;
}

class Builder {
  tiles: string[][];
  enemies: LevelData['enemies'] = [];
  maxGap = 0;
  constructor(public width: number) {
    this.tiles = Array.from({ length: LEVEL_ROWS }, () => Array(width).fill('.'));
  }
  set(col: number, row: number, ch: string) {
    if (col >= 0 && col < this.width && row >= 0 && row < LEVEL_ROWS) this.tiles[row][col] = ch;
  }
  /** Chão de c0 a c1 (inclusive) com topo na linha `top`. */
  ground(c0: number, c1: number, top = GROUND) {
    for (let c = c0; c <= c1; c++) for (let r = top; r < LEVEL_ROWS; r++) this.set(c, r, '#');
    return this;
  }
  gap(c0: number, c1: number) {
    this.maxGap = Math.max(this.maxGap, c1 - c0 + 1);
    for (let c = c0; c <= c1; c++) for (let r = 0; r < LEVEL_ROWS; r++) this.set(c, r, '.');
    return this;
  }
  /** Abismo atravessado por plataformas (o alcance é conferido nos testes). */
  pit(c0: number, c1: number) {
    for (let c = c0; c <= c1; c++) for (let r = 0; r < LEVEL_ROWS; r++) this.set(c, r, '.');
    return this;
  }
  platform(c0: number, len: number, row: number, ch = '=') {
    for (let c = c0; c < c0 + len; c++) this.set(c, row, ch);
    return this;
  }
  coins(c0: number, n: number, row: number) {
    for (let c = c0; c < c0 + n; c++) this.set(c, row, 'o');
    return this;
  }
  spikes(c0: number, n: number, row = GROUND - 1) {
    for (let c = c0; c < c0 + n; c++) this.set(c, row, '^');
    return this;
  }
  enemy(col: number, row = GROUND - 1, speed = 24) {
    this.enemies.push({ col, row, speed });
    return this;
  }
  flag(col: number, top = GROUND) {
    for (let r = top - 6; r < top; r++) this.set(col, r, 'F');
    return this;
  }
  build(name: string, theme: LevelData['theme']): LevelData {
    return { name, theme, tiles: this.tiles, width: this.width, start: { col: 2, row: GROUND - 1 }, enemies: this.enemies, maxGap: this.maxGap };
  }
}

function level1(): LevelData {
  const b = new Builder(100);
  b.ground(0, 99);
  b.coins(6, 4, 12);
  b.enemy(15);
  b.gap(19, 21);
  b.platform(26, 5, 11).coins(26, 5, 10);
  b.spikes(34, 2);
  b.enemy(38);
  b.ground(41, 55, GROUND - 1);
  b.coins(44, 3, 11);
  b.gap(56, 58);
  b.platform(63, 3, 12).platform(68, 3, 9).coins(68, 3, 8);
  b.enemy(74);
  b.gap(81, 83);
  b.coins(86, 4, 12);
  b.flag(95);
  return b.build('FLORESTA', 'forest');
}

function level2(): LevelData {
  const b = new Builder(124);
  b.ground(0, 123);
  b.coins(5, 3, 12);
  b.enemy(12, GROUND - 1, 28);
  b.gap(17, 20);
  b.platform(24, 4, 12, 'B').coins(24, 4, 11);
  b.spikes(30, 3);
  b.enemy(36, GROUND - 1, 30);
  b.gap(40, 43);
  b.platform(41, 2, 11); // degrau sobre o buraco
  b.ground(44, 60, GROUND - 2);
  b.spikes(50, 2, GROUND - 3);
  b.coins(49, 4, 9);
  b.enemy(56, GROUND - 3, 30);
  b.gap(61, 64);
  b.platform(67, 4, 11, 'B').platform(73, 4, 8, 'B').coins(73, 4, 7);
  b.enemy(70, GROUND - 1, 32);
  b.spikes(78, 4);
  b.gap(84, 87);
  b.enemy(92, GROUND - 1, 34);
  b.enemy(100, GROUND - 1, 34);
  b.platform(96, 6, 11).coins(96, 6, 10);
  b.flag(118);
  return b.build('RUÍNAS', 'ruins');
}

function level3(): LevelData {
  const b = new Builder(150);
  b.ground(0, 149);
  b.coins(6, 4, 11);
  b.enemy(13, GROUND - 1, 36);
  b.gap(18, 22); // 5 tiles: precisa correr (azul)
  b.platform(27, 3, 11).platform(32, 3, 8).platform(37, 3, 5).coins(37, 3, 4);
  b.spikes(27, 13);
  b.enemy(44, GROUND - 1, 38);
  b.gap(48, 52);
  b.platform(50, 1, 12, 'B');
  b.ground(53, 70, GROUND - 2);
  b.enemy(60, GROUND - 3, 38);
  b.enemy(66, GROUND - 3, 40);
  b.coins(58, 6, 9);
  b.gap(71, 74);
  // abismo da cachoeira atravessado por blocos
  b.pit(78, 100);
  b.platform(80, 4, 12, 'B').platform(86, 4, 10, 'B').platform(92, 4, 12, 'B').platform(98, 2, 12, 'B');
  b.coins(86, 4, 8);
  b.spikes(103, 3);
  b.enemy(108, GROUND - 1, 42);
  b.enemy(114, GROUND - 1, 42);
  b.gap(119, 122);
  b.coins(126, 6, 11);
  b.flag(142);
  return b.build('CACHOEIRA', 'falls');
}

export const LEVELS: LevelData[] = [level1(), level2(), level3()];

export const isSolid = (ch: string | undefined) => ch === '#' || ch === 'B' || ch === '=';

/**
 * Linhas onde dá para ficar em pé em uma coluna (tile sólido com espaço livre em cima).
 * Usado para verificar que toda fase pode ser completada.
 */
export function standableRows(tiles: string[][], col: number): number[] {
  const rows: number[] = [];
  for (let r = 1; r < tiles.length; r++) {
    if (isSolid(tiles[r][col]) && !isSolid(tiles[r - 1][col]) && tiles[r - 1][col] !== '^') rows.push(r);
  }
  return rows;
}

/** Cópia mutável das tiles (moedas somem ao serem coletadas). */
export const cloneTiles = (l: LevelData) => l.tiles.map((r) => [...r]);
