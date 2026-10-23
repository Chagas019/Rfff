import { describe, expect, it } from 'vitest';
import { DT, PadDriver, testEnv } from '../test/helpers';
import { mulberry32 } from './engine/random';
import { createSnake, spawnFood, stepSnake, turn } from './SnakeClassic/snakeLogic';
import { SnakeClassic } from './SnakeClassic/SnakeClassic';
import { BALL_R, BRICK, LEVELS as BRICK_LEVELS, PADDLE, buildBricks, remainingBreakable, stepBall, type Ball } from './BrickBreaker/brickLogic';
import { BrickBreaker } from './BrickBreaker/BrickBreaker';
import { overlaps, spawnEnemy, waveSpec } from './SpaceDefender/spaceLogic';
import { SpaceDefender } from './SpaceDefender/SpaceDefender';
import { GROUND, LEVELS, TILE, standableRows } from './PixelAdventure/levels';
import { PHYS, moveBody, type Body } from './PixelAdventure/physics';
import { PixelAdventure } from './PixelAdventure/PixelAdventure';
import { CATALOG } from './catalog';

// ---------------------------------------------------------------- Snake

describe('Snake Classic', () => {
  it('a comida nunca nasce em cima da cobra', () => {
    const rng = mulberry32(3);
    const s = createSnake(6, 4, rng);
    for (let i = 0; i < 200; i++) {
      const f = spawnFood(s, rng)!;
      expect(s.body.some((c) => c.x === f.x && c.y === f.y)).toBe(false);
    }
  });

  it('sem espaço livre, não há comida (vitória)', () => {
    const body = [];
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) body.push({ x, y });
    expect(spawnFood({ cols: 2, rows: 2, body }, mulberry32(1))).toBeNull();
  });

  it('cresce ao comer e morre ao bater na parede', () => {
    const rng = mulberry32(9);
    const s = createSnake(10, 5, rng);
    const head = s.body[0];
    s.food = { x: head.x + 1, y: head.y };
    expect(stepSnake(s, rng)).toBe('ate');
    expect(stepSnake(s, rng)).toBe('moved');
    expect(s.body.length).toBe(4);
    let r = 'moved';
    for (let i = 0; i < 20 && r !== 'died'; i++) {
      s.food = null;
      r = stepSnake(s, rng);
    }
    expect(r).toBe('died');
    expect(s.alive).toBe(false);
  });

  it('não permite meia-volta e morre ao bater no próprio corpo', () => {
    const rng = mulberry32(2);
    const s = createSnake(20, 20, rng);
    s.food = null;
    turn(s, 'left'); // meia-volta: ignorada
    expect(s.queue).toEqual([]);
    s.grow = 5;
    for (let i = 0; i < 5; i++) stepSnake(s, rng);
    turn(s, 'down');
    stepSnake(s, rng);
    turn(s, 'left');
    stepSnake(s, rng);
    turn(s, 'up');
    expect(stepSnake(s, rng)).toBe('died');
  });

  it('velocidade é ajustável no título e a partida pode ser pausada e reiniciada', () => {
    const { env } = testEnv();
    const g = new SnakeClassic(env).init();
    const pad = new PadDriver();
    g.update(DT, pad.frame({ x: 1 }));
    g.update(DT, pad.frame());
    g.update(DT, pad.frame({ x: 1 }));
    expect(g.speedLevel).toBe(4);
    g.update(DT, pad.frame({ yellow: true }));
    expect(g.status).toBe('playing');
    g.update(DT, pad.frame({ start: true }));
    expect(g.status).toBe('paused');
    g.update(DT, pad.frame());
    g.update(DT, pad.frame({ blue: true })); // azul na pausa = reiniciar
    expect(g.status).toBe('playing');
    expect(g.score).toBe(0);
  });

  it('grava o recorde no fim da partida', () => {
    const { env, scores } = testEnv();
    const g = new SnakeClassic(env).init();
    const pad = new PadDriver();
    g.update(DT, pad.frame({ yellow: true }));
    g.state.food = { x: g.state.body[0].x + 1, y: g.state.body[0].y };
    for (let i = 0; i < 60 * 10 && g.status === 'playing'; i++) g.update(DT, pad.frame());
    expect(g.status).toBe('gameover');
    expect(g.score).toBeGreaterThan(0);
    expect(scores.get('snake-classic')).toBe(g.score);
  });
});

// ---------------------------------------------------------------- Brick Breaker

describe('Brick Breaker', () => {
  it('todas as fases têm blocos dentro da tela', () => {
    BRICK_LEVELS.forEach((_, i) => {
      const bricks = buildBricks(i + 1);
      expect(remainingBreakable(bricks)).toBeGreaterThan(0);
      for (const b of bricks) {
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.x + BRICK.w).toBeLessThanOrEqual(300);
      }
    });
  });

  it('a bola quebra um bloco e quica', () => {
    const bricks = [{ x: 100, y: 50, hp: 1, metal: false }];
    const ball: Ball = { x: 110, y: 80, vx: 0, vy: -150, stuck: false };
    let broken = 0;
    for (let i = 0; i < 30; i++) broken += stepBall(ball, 0, bricks, DT).bricksBroken.length;
    expect(broken).toBe(1);
    expect(ball.vy).toBeGreaterThan(0);
  });

  it('não atravessa blocos mesmo rápida', () => {
    const bricks = [{ x: 100, y: 50, hp: 3, metal: false }];
    const ball: Ball = { x: 110, y: 90, vx: 0, vy: -2000, stuck: false };
    stepBall(ball, 0, bricks, 0.05);
    expect(bricks[0].hp).toBe(2);
    expect(ball.y).toBeGreaterThan(50);
  });

  it('a raquete devolve a bola para cima com ângulo pela posição do toque', () => {
    const ball: Ball = { x: 100 + PADDLE.w - 2, y: PADDLE.y - BALL_R - 1, vx: 0, vy: 150, stuck: false };
    const ev = stepBall(ball, 100, [], DT);
    expect(ev.paddle).toBe(true);
    expect(ball.vy).toBeLessThan(0);
    expect(ball.vx).toBeGreaterThan(0);
  });

  it('perde vida quando a bola cai e termina sem vidas', () => {
    const { env } = testEnv();
    const g = new BrickBreaker(env).init();
    const pad = new PadDriver();
    g.update(DT, pad.frame({ yellow: true }));
    expect(g.status).toBe('playing');
    for (let life = 0; life < 3; life++) {
      g.launch();
      g.ball.vx = 0;
      g.ball.vy = 400;
      g.ball.y = 195;
      g.paddleX = 0;
      g.ball.x = 280;
      for (let i = 0; i < 20; i++) g.update(DT, pad.frame());
    }
    expect(g.status).toBe('gameover');
  });

  it('limpa a fase e avança', () => {
    const { env } = testEnv();
    const g = new BrickBreaker(env).init();
    const pad = new PadDriver();
    g.update(DT, pad.frame({ yellow: true }));
    g.bricks.forEach((b) => !b.metal && (b.hp = 0));
    g.update(DT, pad.frame());
    expect(g.status).toBe('levelclear');
    for (let i = 0; i < 120; i++) g.update(DT, pad.frame());
    expect(g.level).toBe(2);
    expect(g.status).toBe('playing');
  });
});

// ---------------------------------------------------------------- Space Defender

describe('Space Defender', () => {
  it('ondas ficam maiores e mais variadas', () => {
    expect(waveSpec(1).kinds).toEqual(['drone']);
    expect(waveSpec(3).kinds).toContain('gunner');
    expect(waveSpec(5).count).toBeGreaterThan(waveSpec(1).count);
  });

  it('tiro destrói inimigo e soma pontos', () => {
    const { env } = testEnv();
    const g = new SpaceDefender(env).init();
    const pad = new PadDriver();
    g.update(DT, pad.frame({ yellow: true }));
    const e = spawnEnemy('drone', mulberry32(1), 300, 12, 1);
    e.x = g.ship.x;
    e.baseX = g.ship.x;
    e.y = g.ship.y - 40;
    e.vy = 0;
    g.enemies = [e];
    for (let i = 0; i < 40; i++) g.update(DT, pad.frame({ blue: true }));
    expect(g.score).toBeGreaterThanOrEqual(50);
    expect(g.enemies.includes(e)).toBe(false);
  });

  it('colisão com inimigo tira vida e dá invencibilidade temporária', () => {
    const { env } = testEnv();
    const g = new SpaceDefender(env).init();
    const pad = new PadDriver();
    g.update(DT, pad.frame({ yellow: true }));
    const e = spawnEnemy('diver', mulberry32(1), 300, 12, 1);
    Object.assign(e, { x: g.ship.x, y: g.ship.y, vy: 0, vx: 0 });
    g.enemies = [e];
    g.update(DT, pad.frame());
    expect(g.lives).toBe(2);
    expect(g.invulnerable).toBeGreaterThan(1);
  });

  it('bomba limpa tiros inimigos e tem limite', () => {
    const { env } = testEnv();
    const g = new SpaceDefender(env).init();
    g.start();
    g.enemyShots = [{ x: 10, y: 10, w: 3, h: 3, vx: 0, vy: 0 }];
    g.bomb();
    expect(g.enemyShots).toHaveLength(0);
    g.bomb();
    g.bomb();
    g.bomb();
    expect(g.bombs).toBe(0);
  });

  it('caixas que se tocam colidem', () => {
    expect(overlaps({ x: 0, y: 0, w: 5, h: 5 }, { x: 4, y: 4, w: 5, h: 5 })).toBe(true);
    expect(overlaps({ x: 0, y: 0, w: 5, h: 5 }, { x: 5, y: 0, w: 5, h: 5 })).toBe(false);
  });
});

// ---------------------------------------------------------------- Pixel Adventure

describe('Pixel Adventure', () => {
  const jumpHeightPx = PHYS.jumpVelocity ** 2 / (2 * PHYS.gravity);
  const airTime = (2 * PHYS.jumpVelocity) / PHYS.gravity;
  const runReachTiles = (PHYS.runSpeed * airTime) / TILE;

  it('as fases são completáveis: buracos e degraus dentro do alcance do pulo', () => {
    for (const level of LEVELS) {
      expect(level.tiles.every((r) => r.length === level.width)).toBe(true);
      expect(level.tiles.flat().includes('F')).toBe(true);
      let lastRow = GROUND;
      let gap = 0;
      for (let c = 0; c < level.width; c++) {
        const rows = standableRows(level.tiles, c);
        if (!rows.length) {
          gap++;
          continue;
        }
        // superfície mais alta alcançável a partir da última
        const reachable = rows.filter((r) => (lastRow - r) * TILE <= jumpHeightPx - 4);
        expect(reachable.length, `${level.name}: coluna ${c} inalcançável`).toBeGreaterThan(0);
        expect(gap, `${level.name}: buraco antes da coluna ${c}`).toBeLessThanOrEqual(Math.floor(runReachTiles) - 1);
        lastRow = Math.min(...reachable);
        gap = 0;
      }
    }
  });

  it('o personagem cai e fica em pé sobre o chão', () => {
    const tiles = LEVELS[0].tiles;
    const b: Body = { x: 20, y: 40, w: 7, h: 11, vx: 0, vy: 0, onGround: false };
    for (let i = 0; i < 240; i++) {
      b.vy = Math.min(PHYS.maxFall, b.vy + PHYS.gravity / 120);
      moveBody(b, tiles, 1 / 120);
    }
    expect(b.onGround).toBe(true);
    expect(b.y + b.h).toBeCloseTo(GROUND * TILE, 3);
  });

  it('pula, coleta moedas e marca pontos', () => {
    const { env, sounds } = testEnv();
    const g = new PixelAdventure(env).init();
    const pad = new PadDriver();
    g.update(DT, pad.frame({ yellow: true }));
    expect(g.status).toBe('playing');
    for (let i = 0; i < 30; i++) g.update(DT, pad.frame());
    // anda até as moedas da coluna 6–9 (linha 12) pulando
    for (let i = 0; i < 200 && g.coins === 0; i++) g.update(DT, pad.frame({ x: 1, yellow: i % 40 < 20 }));
    expect(g.coins).toBeGreaterThan(0);
    expect(g.score).toBeGreaterThan(0);
    expect(sounds).toContain('jump');
    expect(sounds).toContain('coin');
  });

  it('pisar no inimigo derrota ele; encostar de lado custa uma vida', () => {
    const { env } = testEnv();
    const g = new PixelAdventure(env).init();
    const pad = new PadDriver();
    g.update(DT, pad.frame({ yellow: true }));
    const e = g.enemies[0];
    e.speed = 0;
    // de cima
    g.player.x = e.x;
    g.player.y = e.y - g.player.h - 2;
    g.player.vy = 200;
    g.update(DT, pad.frame());
    expect(e.alive).toBe(false);
    // de lado
    const e2 = g.enemies[1];
    e2.speed = 0;
    g.player.x = e2.x;
    g.player.y = e2.y;
    g.player.vy = 0;
    g.invulnerable = 0;
    g.update(DT, pad.frame());
    expect(g.lives).toBe(2);
  });

  it('cair no buraco tira vida e sem vidas é fim de jogo', () => {
    const { env } = testEnv();
    const g = new PixelAdventure(env).init();
    const pad = new PadDriver();
    g.update(DT, pad.frame({ yellow: true }));
    for (let life = 0; life < 3; life++) {
      g.player.x = 20 * TILE;
      g.player.y = 160;
      g.invulnerable = 0;
      for (let i = 0; i < 200 && g.status === 'playing'; i++) g.update(DT, pad.frame());
    }
    expect(g.status).toBe('gameover');
  });

  it('chegar à bandeira completa a fase e leva à próxima', () => {
    const { env } = testEnv();
    const g = new PixelAdventure(env).init();
    const pad = new PadDriver();
    g.update(DT, pad.frame({ yellow: true }));
    const flagCol = LEVELS[0].tiles[GROUND - 1].indexOf('F');
    g.player.x = (flagCol - 1) * TILE;
    for (let i = 0; i < 60 && g.status === 'playing'; i++) g.update(DT, pad.frame({ x: 1 }));
    expect(g.status).toBe('levelclear');
    for (let i = 0; i < 150; i++) g.update(DT, pad.frame());
    expect(g.levelIndex).toBe(1);
  });
});

// ---------------------------------------------------------------- todos os jogos

describe('Biblioteca', () => {
  it('tem os quatro jogos e cada um inicia, pausa, continua e sai', () => {
    expect(CATALOG.map((c) => c.id)).toEqual(['pixel-adventure', 'space-defender', 'snake-classic', 'brick-breaker']);
    for (const entry of CATALOG) {
      const { env } = testEnv(7);
      const g = entry.create(env);
      const pad = new PadDriver();
      expect(g.status).toBe('title');
      g.update(DT, pad.frame({ start: true }));
      expect(g.status).toBe('playing');
      // joga com entradas aleatórias por alguns segundos sem quebrar
      const rng = mulberry32(5);
      for (let i = 0; i < 300 && g.status === 'playing'; i++) {
        g.update(DT, pad.frame({ x: rng() * 2 - 1, y: rng() * 2 - 1, blue: rng() < 0.5, yellow: rng() < 0.2 }));
      }
      if (g.status === 'playing') {
        g.update(DT, pad.frame({ start: true }));
        expect(g.status).toBe('paused');
        g.update(DT, pad.frame());
        g.update(DT, pad.frame({ yellow: true }));
        expect(g.status).toBe('playing');
        g.update(DT, pad.frame({ red: true }));
        expect(g.status).toBe('paused');
        g.update(DT, pad.frame());
      }
      g.update(DT, pad.frame());
      for (let i = 0; i < 60; i++) g.update(DT, pad.frame());
      g.update(DT, pad.frame({ red: true }));
      expect(g.exitRequested || g.status === 'levelclear').toBe(true);
    }
  });
});
