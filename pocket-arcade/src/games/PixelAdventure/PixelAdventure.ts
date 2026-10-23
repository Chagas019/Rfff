import { BaseGame, SCREEN_H, SCREEN_W } from '../engine/BaseGame';
import { drawText } from '../engine/pixelFont';
import type { GameInput } from '../engine/types';
import { LEVELS, LEVEL_ROWS, TILE, cloneTiles, isSolid, type LevelData } from './levels';
import { PHYS, moveBody, rectsOverlap, tileAt, type Body } from './physics';

const VIEW_ROWS_OFFSET = SCREEN_H - LEVEL_ROWS * TILE; // 20 px de HUD em cima
const PLAYER = { w: 7, h: 11 };

interface Walker extends Body {
  dir: number;
  speed: number;
  alive: boolean;
  squash: number;
}

const THEMES = {
  forest: { sky: ['#7cc4e8', '#c9eaf3'], hill: '#4f9a5a', hill2: '#3b7f4a', ground: '#7a4a2c', top: '#5cbf4a', brick: '#b5683c' },
  ruins: { sky: ['#f2b07a', '#fbe1b8'], hill: '#b07c5a', hill2: '#8d5f45', ground: '#6d5546', top: '#9fae5a', brick: '#a88a72' },
  falls: { sky: ['#4a7bb8', '#a7d3e6'], hill: '#2f6f6a', hill2: '#24585a', ground: '#4d4a5c', top: '#6fcf8a', brick: '#6a7f9c' },
} as const;

export class PixelAdventure extends BaseGame {
  readonly id = 'pixel-adventure' as const;
  readonly title = 'PIXEL ADVENTURE';
  protected readonly accent = '#f4c22e';
  protected readonly instructions = ['JOYSTICK  ANDA', 'AMARELO  PULA', 'AZUL  CORRE (SEGURE)', 'PULE NOS INIMIGOS!'];

  levelIndex = 0;
  level!: LevelData;
  tiles!: string[][];
  player!: Body;
  enemies: Walker[] = [];
  lives = 3;
  coins = 0;
  facing = 1;
  invulnerable = 0;
  camX = 0;
  private coyote = 0;
  private jumpBuffer = 0;
  private dying = 0;
  private sparkles: Array<{ x: number; y: number; life: number }> = [];

  protected resetGame() {
    this.levelIndex = 0;
    this.lives = 3;
    this.coins = 0;
    this.loadLevel();
  }

  loadLevel(index = this.levelIndex) {
    this.levelIndex = index;
    this.level = LEVELS[index];
    this.tiles = cloneTiles(this.level);
    this.enemies = this.level.enemies.map((e) => ({
      x: e.col * TILE + 1,
      y: (e.row + 1) * TILE - 8,
      w: 9,
      h: 8,
      vx: -e.speed,
      vy: 0,
      onGround: false,
      dir: -1,
      speed: e.speed,
      alive: true,
      squash: 0,
    }));
    this.respawn();
  }

  private respawn() {
    const s = this.level.start;
    this.player = { x: s.col * TILE, y: (s.row + 1) * TILE - PLAYER.h, w: PLAYER.w, h: PLAYER.h, vx: 0, vy: 0, onGround: false };
    this.dying = 0;
    this.camX = 0;
  }

  protected step(dt: number, input: GameInput) {
    if (this.status === 'levelclear') {
      if (this.stateTime > 2) {
        this.loadLevel(this.levelIndex + 1);
        this.setStatus('playing');
      }
      return;
    }
    // subpassos para não atravessar tiles em quedas rápidas
    const n = Math.ceil(dt / (1 / 120));
    for (let i = 0; i < n && this.status === 'playing'; i++) this.tick(dt / n, input, i === 0);
    this.sparkles = this.sparkles.filter((s) => (s.life -= dt) > 0);
  }

  private tick(dt: number, input: GameInput, firstSubstep: boolean) {
    const p = this.player;
    if (this.dying > 0) {
      this.dying += dt;
      p.vy += PHYS.gravity * dt;
      p.y += p.vy * dt;
      if (this.dying > 1.4) {
        if (this.lives <= 0) this.finish(false);
        else {
          this.respawn();
          this.invulnerable = 1.5;
        }
      }
      return;
    }
    this.invulnerable = Math.max(0, this.invulnerable - dt);

    // movimento horizontal com aceleração
    const axis = input.left ? -1 : input.right ? 1 : Math.abs(input.x) > 0.25 ? Math.sign(input.x) : 0;
    const maxSpeed = input.blue ? PHYS.runSpeed : PHYS.walkSpeed;
    const target = axis * maxSpeed;
    const dv = PHYS.accel * dt;
    p.vx = p.vx < target ? Math.min(target, p.vx + dv) : Math.max(target, p.vx - dv);
    if (axis) this.facing = axis;

    // pulo com tolerância ("coyote time") e pulo antecipado
    if (firstSubstep && input.pressed.yellow) this.jumpBuffer = PHYS.jumpBuffer;
    else this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    this.coyote = p.onGround ? PHYS.coyote : Math.max(0, this.coyote - dt);
    if (this.jumpBuffer > 0 && this.coyote > 0) {
      p.vy = -PHYS.jumpVelocity;
      this.jumpBuffer = 0;
      this.coyote = 0;
      this.sfx('jump');
    }
    // soltar o botão cedo = pulo mais baixo
    if (!input.yellow && p.vy < -120) p.vy = -120;

    p.vy = Math.min(PHYS.maxFall, p.vy + PHYS.gravity * dt);
    moveBody(p, this.tiles, dt);

    this.collectAndHazards();
    this.updateEnemies(dt);

    if (p.y > LEVEL_ROWS * TILE + 20) this.die();

    // câmera
    const maxCam = this.level.width * TILE - SCREEN_W;
    const desired = p.x - SCREEN_W * 0.4;
    this.camX = Math.max(0, Math.min(maxCam, this.camX + (desired - this.camX) * Math.min(1, dt * 8)));
  }

  private collectAndHazards() {
    const p = this.player;
    const c0 = Math.floor(p.x / TILE);
    const c1 = Math.floor((p.x + p.w) / TILE);
    const r0 = Math.floor(p.y / TILE);
    const r1 = Math.floor((p.y + p.h) / TILE);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const t = tileAt(this.tiles, c, r);
        if (t === 'o') {
          this.tiles[r][c] = '.';
          this.coins++;
          this.addScore(10);
          this.sparkles.push({ x: c * TILE + 5, y: r * TILE + 5, life: 0.4 });
          this.sfx('coin');
        } else if (t === '^') {
          // espinhos ocupam a metade de baixo do tile
          if (rectsOverlap(p, { x: c * TILE + 1, y: r * TILE + 5, w: TILE - 2, h: 5 })) this.die();
        } else if (t === 'F') {
          this.completeLevel();
          return;
        }
      }
    }
  }

  private updateEnemies(dt: number) {
    const p = this.player;
    for (const e of this.enemies) {
      if (!e.alive) {
        e.squash += dt;
        continue;
      }
      e.vx = e.dir * e.speed;
      e.vy = Math.min(PHYS.maxFall, e.vy + PHYS.gravity * dt);
      const prevX = e.x;
      moveBody(e, this.tiles, dt);
      // vira na parede ou na beira do buraco
      const aheadX = e.dir > 0 ? e.x + e.w + 1 : e.x - 1;
      const ahead = tileAt(this.tiles, Math.floor(aheadX / TILE), Math.floor((e.y + e.h + 2) / TILE));
      if (e.x === prevX || (e.onGround && !isSolid(ahead))) e.dir = -e.dir;

      if (!rectsOverlap(p, e) || this.dying) continue;
      const stomp = p.vy > 40 && p.y + p.h - e.y < 6;
      if (stomp) {
        e.alive = false;
        p.vy = -220;
        this.addScore(50);
        this.sfx('hit');
      } else if (this.invulnerable <= 0) {
        this.die();
      }
    }
  }

  die() {
    if (this.dying > 0) return;
    this.lives--;
    this.dying = 0.0001;
    this.player.vy = -260;
    this.sfx('lose');
  }

  private completeLevel() {
    this.addScore(250 + this.lives * 50);
    if (this.levelIndex >= LEVELS.length - 1) this.finish(true);
    else {
      this.setStatus('levelclear');
      this.sfx('win');
    }
  }

  // ------------------------------------------------------------------ desenho

  protected draw(ctx: CanvasRenderingContext2D) {
    const th = THEMES[this.level.theme];
    const g = ctx.createLinearGradient(0, 0, 0, SCREEN_H);
    g.addColorStop(0, th.sky[0]);
    g.addColorStop(1, th.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    this.drawBackdrop(ctx, th);

    ctx.save();
    ctx.translate(-Math.round(this.camX), VIEW_ROWS_OFFSET);
    const c0 = Math.max(0, Math.floor(this.camX / TILE) - 1);
    const c1 = Math.min(this.level.width - 1, c0 + SCREEN_W / TILE + 2);
    for (let r = 0; r < LEVEL_ROWS; r++) {
      for (let c = c0; c <= c1; c++) this.drawTile(ctx, this.tiles[r][c], c, r, th);
    }
    for (const e of this.enemies) this.drawEnemy(ctx, e);
    for (const s of this.sparkles) {
      ctx.fillStyle = '#fff6b0';
      const k = Math.round((0.4 - s.life) * 20);
      ctx.fillRect(s.x - k, s.y, 1, 1);
      ctx.fillRect(s.x + k, s.y, 1, 1);
      ctx.fillRect(s.x, s.y - k, 1, 1);
    }
    if (this.invulnerable <= 0 || Math.floor(this.time * 14) % 2 === 0) this.drawPlayer(ctx);
    ctx.restore();

    this.drawHud(ctx, `${this.level.name} ${this.levelIndex + 1}/${LEVELS.length}  ●${this.coins}  ${'♥'.repeat(Math.max(0, this.lives))}`, `PONTOS ${this.score}`);
    if (this.status === 'levelclear') {
      drawText(ctx, 'FASE COMPLETA!', SCREEN_W / 2, 80, { scale: 2, align: 'center', color: this.accent, shadow: '#000' });
      drawText(ctx, `PRÓXIMA: ${LEVELS[this.levelIndex + 1]?.name ?? ''}`, SCREEN_W / 2, 104, { align: 'center', color: '#fff', shadow: '#000' });
    }
  }

  private drawBackdrop(ctx: CanvasRenderingContext2D, th: (typeof THEMES)[keyof typeof THEMES]) {
    // colinas em duas camadas com paralaxe
    const layers: Array<[string, number, number, number]> = [
      [th.hill, 0.2, 120, 34],
      [th.hill2, 0.45, 145, 26],
    ];
    for (const [color, speed, base, amp] of layers) {
      ctx.fillStyle = color;
      const off = this.camX * speed;
      for (let x = 0; x < SCREEN_W; x += 2) {
        const wx = x + off;
        const h = Math.round(Math.sin(wx * 0.02) * amp * 0.5 + Math.sin(wx * 0.047) * amp * 0.3);
        ctx.fillRect(x, base - h, 2, SCREEN_H - base + h);
      }
    }
    if (this.level.theme === 'falls') {
      // cachoeira ao fundo
      const x = Math.round(150 - ((this.camX * 0.3) % 400));
      ctx.fillStyle = '#bfe7f5';
      ctx.fillRect(x, 20, 26, 140);
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 8; i++) ctx.fillRect(x + 3 + ((i * 7) % 22), 20 + ((this.time * 90 + i * 23) % 140), 2, 8);
    }
  }

  private drawTile(ctx: CanvasRenderingContext2D, t: string, c: number, r: number, th: (typeof THEMES)[keyof typeof THEMES]) {
    const x = c * TILE;
    const y = r * TILE;
    switch (t) {
      case '#': {
        const top = !isSolid(this.tiles[r - 1]?.[c]);
        ctx.fillStyle = th.ground;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x + ((c * 7 + r * 3) % 7), y + ((c * 3 + r * 5) % 7), 2, 2);
        if (top) {
          ctx.fillStyle = th.top;
          ctx.fillRect(x, y, TILE, 3);
          ctx.fillRect(x + ((c * 5) % 8), y + 3, 2, 1);
        }
        break;
      }
      case 'B':
        ctx.fillStyle = th.brick;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(x, y + 4, TILE, 1);
        ctx.fillRect(x + (r % 2 ? 3 : 7), y, 1, 4);
        ctx.fillRect(x + (r % 2 ? 7 : 3), y + 5, 1, 5);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(x, y, TILE, 1);
        break;
      case '=':
        ctx.fillStyle = '#8a5a34';
        ctx.fillRect(x, y, TILE, 4);
        ctx.fillStyle = '#c58a52';
        ctx.fillRect(x, y, TILE, 1);
        ctx.fillStyle = '#5a3a20';
        ctx.fillRect(x + 1, y + 4, 1, 2);
        ctx.fillRect(x + 8, y + 4, 1, 2);
        break;
      case 'o': {
        const w = [6, 4, 2, 4][Math.floor(this.time * 8 + c) % 4];
        ctx.fillStyle = '#f4c22e';
        ctx.fillRect(x + 5 - w / 2, y + 2, w, 7);
        ctx.fillStyle = '#fff1a8';
        ctx.fillRect(x + 5 - w / 2, y + 2, Math.max(1, w / 2 - 1), 2);
        break;
      }
      case '^':
        ctx.fillStyle = '#d8d8e2';
        for (let i = 0; i < 3; i++) {
          ctx.fillRect(x + i * 3 + 1, y + 7, 3, 3);
          ctx.fillRect(x + i * 3 + 2, y + 5, 1, 2);
        }
        break;
      case 'F': {
        const isTop = this.tiles[r - 1]?.[c] !== 'F';
        ctx.fillStyle = '#e8e6f0';
        ctx.fillRect(x + 4, y, 2, TILE);
        if (isTop) {
          const wave = Math.floor(this.time * 6) % 2;
          ctx.fillStyle = '#e2402c';
          ctx.fillRect(x + 6, y + 1, 9, 6 - wave);
          ctx.fillStyle = '#f4c22e';
          ctx.fillRect(x + 4, y - 2, 2, 2);
        }
        break;
      }
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D) {
    const p = this.player;
    const x = Math.round(p.x) - 1;
    const y = Math.round(p.y);
    const f = this.facing;
    const run = p.onGround && Math.abs(p.vx) > 5 ? Math.floor(this.time * 12) % 2 : 0;
    const px = (dx: number, dy: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(f > 0 ? x + dx : x + 9 - dx - w, y + dy, w, h);
    };
    // explorador original: chapéu, cachecol laranja, roupa azul
    px(2, 0, 5, 2, '#6b4426');
    px(1, 2, 7, 1, '#6b4426');
    px(2, 3, 5, 3, '#f1c39c');
    px(5, 4, 1, 1, '#1d1a16');
    px(2, 6, 6, 2, '#f06a2c');
    px(1, 8, 6, 2, '#2c57d6');
    px(7, 7, 2, 1, '#f06a2c');
    if (this.dying > 0) {
      px(1, 10, 2, 1, '#3a2a1c');
      px(5, 10, 2, 1, '#3a2a1c');
    } else {
      px(run ? 1 : 2, 10, 2, 1, '#3a2a1c');
      px(run ? 6 : 5, 10, 2, 1, '#3a2a1c');
    }
  }

  private drawEnemy(ctx: CanvasRenderingContext2D, e: Walker) {
    const x = Math.round(e.x);
    const y = Math.round(e.y);
    if (!e.alive) {
      if (e.squash < 0.5) {
        ctx.fillStyle = '#8a4fc2';
        ctx.fillRect(x, y + 6, 9, 2);
      }
      return;
    }
    const step = Math.floor(this.time * 8) % 2;
    ctx.fillStyle = '#8a4fc2';
    ctx.fillRect(x + 1, y, 7, 2);
    ctx.fillRect(x, y + 2, 9, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + (e.dir > 0 ? 5 : 2), y + 2, 2, 2);
    ctx.fillStyle = '#4a2a6a';
    ctx.fillRect(x + (step ? 0 : 1), y + 6, 3, 2);
    ctx.fillRect(x + (step ? 6 : 5), y + 6, 3, 2);
  }
}

