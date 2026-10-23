import { BaseGame, SCREEN_H, SCREEN_W } from '../engine/BaseGame';
import { drawText } from '../engine/pixelFont';
import type { GameInput } from '../engine/types';
import { ENEMY_SPEC, moveEnemy, overlaps, spawnEnemy, waveSpec, type Box, type Bullet, type Enemy } from './spaceLogic';

const TOP = 12;
const SHIP = { w: 13, h: 11, speed: 140, minY: 100, maxY: SCREEN_H - 14 };
const FIRE_DELAY = 0.17;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export class SpaceDefender extends BaseGame {
  readonly id = 'space-defender' as const;
  readonly title = 'SPACE DEFENDER';
  protected readonly accent = '#6fc3ff';
  protected readonly instructions = ['JOYSTICK  MOVE A NAVE', 'AZUL  ATIRA (SEGURE)', 'AMARELO  BOMBA (3 POR PARTIDA)', 'SOBREVIVA ÀS ONDAS'];

  ship: Box = { x: 0, y: 0, w: SHIP.w, h: SHIP.h };
  enemies: Enemy[] = [];
  shots: Bullet[] = [];
  enemyShots: Bullet[] = [];
  lives = 3;
  bombs = 3;
  wave = 1;
  invulnerable = 0;
  private toSpawn = 0;
  private spawnIn = 0;
  private fireCooldown = 0;
  private banner = 0;
  private flash = 0;
  private particles: Particle[] = [];
  private stars: Array<{ x: number; y: number; s: number }> = [];

  protected resetGame() {
    this.ship = { x: (SCREEN_W - SHIP.w) / 2, y: SHIP.maxY - 6, w: SHIP.w, h: SHIP.h };
    this.enemies = [];
    this.shots = [];
    this.enemyShots = [];
    this.particles = [];
    this.lives = 3;
    this.bombs = 3;
    this.wave = 0;
    this.invulnerable = 0;
    this.nextWave();
    if (!this.stars.length) {
      for (let i = 0; i < 60; i++) this.stars.push({ x: this.rng() * SCREEN_W, y: this.rng() * SCREEN_H, s: 0.3 + this.rng() * 1.2 });
    }
  }

  private nextWave() {
    this.wave++;
    this.toSpawn = waveSpec(this.wave).count;
    this.spawnIn = 1.2;
    this.banner = 1.6;
  }

  protected step(dt: number, input: GameInput) {
    const spec = waveSpec(this.wave);
    // nave
    const ax = Math.abs(input.x) > 0.15 ? input.x : 0;
    const ay = Math.abs(input.y) > 0.15 ? input.y : 0;
    this.ship.x = Math.max(2, Math.min(SCREEN_W - SHIP.w - 2, this.ship.x + ax * SHIP.speed * dt));
    this.ship.y = Math.max(SHIP.minY, Math.min(SHIP.maxY, this.ship.y - ay * SHIP.speed * dt));
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.banner = Math.max(0, this.banner - dt);
    this.flash = Math.max(0, this.flash - dt);

    this.fireCooldown -= dt;
    if (input.blue && this.fireCooldown <= 0) {
      this.fireCooldown = FIRE_DELAY;
      this.shots.push({ x: this.ship.x + SHIP.w / 2 - 1, y: this.ship.y - 4, w: 2, h: 5, vx: 0, vy: -280 });
      this.sfx('shoot');
    }
    if (input.pressed.yellow) this.bomb();

    // surgimento progressivo
    if (this.toSpawn > 0) {
      this.spawnIn -= dt;
      if (this.spawnIn <= 0) {
        const kind = spec.kinds[Math.floor(this.rng() * spec.kinds.length)];
        this.enemies.push(spawnEnemy(kind, this.rng, SCREEN_W, TOP, spec.speedMul));
        this.toSpawn--;
        this.spawnIn = spec.interval;
      }
    } else if (this.enemies.length === 0) {
      this.addScore(200 * this.wave);
      this.sfx('powerup');
      this.nextWave();
    }

    const center = { x: this.ship.x + SHIP.w / 2, y: this.ship.y };
    for (const e of this.enemies) {
      moveEnemy(e, dt, center, SCREEN_W);
      if (e.kind === 'gunner') {
        e.fireIn -= dt;
        if (e.fireIn <= 0) {
          e.fireIn = 1.4 + this.rng() * 1.2;
          const dx = center.x - (e.x + e.w / 2);
          const dy = center.y - (e.y + e.h);
          const len = Math.hypot(dx, dy) || 1;
          this.enemyShots.push({ x: e.x + e.w / 2 - 1, y: e.y + e.h, w: 3, h: 3, vx: (dx / len) * 95, vy: (dy / len) * 95 });
        }
      }
    }

    for (const b of this.shots) b.y += b.vy * dt;
    for (const b of this.enemyShots) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }

    // tiros × inimigos
    for (const b of this.shots) {
      for (const e of this.enemies) {
        if (e.hp > 0 && overlaps(b, e)) {
          e.hp--;
          b.y = -100;
          if (e.hp <= 0) this.kill(e);
          else this.sfx('hit');
          break;
        }
      }
    }

    // inimigos/tiros × nave
    if (this.invulnerable <= 0) {
      const hitbox = { x: this.ship.x + 2, y: this.ship.y + 2, w: SHIP.w - 4, h: SHIP.h - 3 };
      const enemyHit = this.enemies.find((e) => e.hp > 0 && overlaps(hitbox, e));
      const shotHit = this.enemyShots.find((b) => overlaps(hitbox, b));
      if (enemyHit || shotHit) {
        if (enemyHit) this.kill(enemyHit, false);
        if (shotHit) shotHit.y = SCREEN_H + 100;
        this.damage();
      }
    }

    // inimigos que passaram pela base
    for (const e of this.enemies) {
      if (e.hp > 0 && e.y > SCREEN_H) {
        e.hp = 0;
        this.addScore(-20);
        this.score = Math.max(0, this.score);
      }
    }

    this.enemies = this.enemies.filter((e) => e.hp > 0);
    this.shots = this.shots.filter((b) => b.y > -10);
    this.enemyShots = this.enemyShots.filter((b) => b.y < SCREEN_H + 10 && b.y > -10 && b.x > -10 && b.x < SCREEN_W + 10);
    this.updateParticles(dt);
  }

  private kill(e: Enemy, scored = true) {
    e.hp = 0;
    if (scored) this.addScore(ENEMY_SPEC[e.kind].score);
    this.explode(e.x + e.w / 2, e.y + e.h / 2, e.kind === 'gunner' ? '#ff9d3a' : '#ffd84a');
    this.sfx('explode');
  }

  private damage() {
    this.lives--;
    this.invulnerable = 2;
    this.flash = 0.25;
    this.explode(this.ship.x + SHIP.w / 2, this.ship.y + SHIP.h / 2, '#6fc3ff');
    this.sfx('hit');
    if (this.lives <= 0) this.finish(false);
  }

  bomb() {
    if (this.bombs <= 0) return;
    this.bombs--;
    this.flash = 0.35;
    this.enemyShots = [];
    for (const e of this.enemies) {
      e.hp -= 2;
      if (e.hp <= 0) this.kill(e);
    }
    this.sfx('explode');
  }

  private explode(x: number, y: number, color: string) {
    for (let i = 0; i < 14; i++) {
      const a = this.rng() * Math.PI * 2;
      const s = 20 + this.rng() * 80;
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.3 + this.rng() * 0.4, color: i % 3 ? color : '#ffffff' });
    }
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  protected draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#05061a';
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    const scroll = this.time * 20;
    for (const s of this.stars) {
      const y = (s.y + scroll * s.s) % SCREEN_H;
      ctx.fillStyle = s.s > 1 ? '#ffffff' : '#7f86b8';
      ctx.fillRect(Math.round(s.x), Math.round(y), 1, 1);
    }

    for (const e of this.enemies) this.drawEnemy(ctx, e);

    ctx.fillStyle = '#ffe680';
    for (const b of this.shots) ctx.fillRect(Math.round(b.x), Math.round(b.y), b.w, b.h);
    ctx.fillStyle = '#ff5a8a';
    for (const b of this.enemyShots) ctx.fillRect(Math.round(b.x), Math.round(b.y), b.w, b.h);

    if (this.status !== 'gameover' && (this.invulnerable <= 0 || Math.floor(this.time * 12) % 2 === 0)) this.drawShip(ctx);

    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    }
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flash})`;
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    }
    this.drawHud(ctx, `PONTOS ${this.score}  ${'♥'.repeat(Math.max(0, this.lives))}  BOMBAS ${this.bombs}`);
    if (this.banner > 0 && this.status === 'playing') {
      drawText(ctx, `ONDA ${this.wave}`, SCREEN_W / 2, 80, { scale: 2, align: 'center', color: this.accent, shadow: '#000' });
    }
  }

  private drawShip(ctx: CanvasRenderingContext2D) {
    const x = Math.round(this.ship.x);
    const y = Math.round(this.ship.y);
    // nave original: casco claro, cabine azul, propulsores amarelo/vermelho
    ctx.fillStyle = '#e9e4f2';
    ctx.fillRect(x + 5, y, 3, 2);
    ctx.fillRect(x + 4, y + 2, 5, 3);
    ctx.fillRect(x + 1, y + 5, 11, 3);
    ctx.fillRect(x, y + 7, 13, 2);
    ctx.fillStyle = '#2c57d6';
    ctx.fillRect(x + 5, y + 3, 3, 3);
    ctx.fillStyle = '#e2402c';
    ctx.fillRect(x, y + 5, 2, 2);
    ctx.fillRect(x + 11, y + 5, 2, 2);
    ctx.fillStyle = Math.floor(this.time * 20) % 2 ? '#f4c22e' : '#ff8a3a';
    ctx.fillRect(x + 3, y + 9, 2, 2);
    ctx.fillRect(x + 8, y + 9, 2, 2);
  }

  private drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy) {
    const x = Math.round(e.x);
    const y = Math.round(e.y);
    if (e.kind === 'drone') {
      ctx.fillStyle = '#b07cff';
      ctx.fillRect(x + 2, y, 8, 2);
      ctx.fillRect(x, y + 2, 12, 4);
      ctx.fillRect(x + 1, y + 6, 2, 3);
      ctx.fillRect(x + 9, y + 6, 2, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 3, y + 3, 2, 2);
      ctx.fillRect(x + 7, y + 3, 2, 2);
    } else if (e.kind === 'diver') {
      ctx.fillStyle = '#ff6a5a';
      ctx.fillRect(x + 4, y, 3, 11);
      ctx.fillRect(x, y + 3, 11, 3);
      ctx.fillRect(x + 2, y + 7, 7, 2);
      ctx.fillStyle = '#ffd0c8';
      ctx.fillRect(x + 5, y + 4, 1, 1);
    } else {
      ctx.fillStyle = e.hp >= 3 ? '#4fd3a5' : e.hp === 2 ? '#e6c84a' : '#ff8a5a';
      ctx.fillRect(x, y + 2, 16, 5);
      ctx.fillRect(x + 3, y, 10, 2);
      ctx.fillRect(x + 6, y + 7, 4, 3);
      ctx.fillStyle = '#10221c';
      ctx.fillRect(x + 3, y + 3, 2, 2);
      ctx.fillRect(x + 11, y + 3, 2, 2);
    }
  }
}
