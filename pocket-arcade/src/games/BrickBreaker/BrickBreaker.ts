import { BaseGame, SCREEN_H, SCREEN_W } from '../engine/BaseGame';
import { drawText } from '../engine/pixelFont';
import type { GameInput } from '../engine/types';
import {
  BALL_R,
  BRICK,
  FIELD,
  LEVELS,
  PADDLE,
  ballSpeedFor,
  buildBricks,
  remainingBreakable,
  stepBall,
  type Ball,
  type Brick,
} from './brickLogic';

const HP_COLORS = ['', '#f4c22e', '#e2402c', '#2c57d6'];

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export class BrickBreaker extends BaseGame {
  readonly id = 'brick-breaker' as const;
  readonly title = 'BRICK BREAKER';
  protected readonly accent = '#ff7a52';
  protected readonly instructions = ['JOYSTICK  MOVE A RAQUETE', 'AZUL OU AMARELO  LANÇA A BOLA', `${LEVELS.length} FASES, 3 VIDAS`];

  level = 1;
  lives = 3;
  paddleX = (FIELD.w - PADDLE.w) / 2;
  ball!: Ball;
  bricks: Brick[] = [];
  private sparks: Spark[] = [];

  protected resetGame() {
    this.level = 1;
    this.lives = 3;
    this.loadLevel();
  }

  private loadLevel() {
    this.bricks = buildBricks(this.level);
    this.paddleX = (FIELD.w - PADDLE.w) / 2;
    this.resetBall();
  }

  private resetBall() {
    this.ball = { x: this.paddleX + PADDLE.w / 2, y: PADDLE.y - BALL_R - 1, vx: 0, vy: 0, stuck: true };
  }

  launch() {
    if (!this.ball.stuck) return;
    const speed = ballSpeedFor(this.level);
    const angle = (this.rng() - 0.5) * 0.8;
    this.ball.vx = Math.sin(angle) * speed;
    this.ball.vy = -Math.cos(angle) * speed;
    this.ball.stuck = false;
    this.sfx('shoot');
  }

  protected step(dt: number, input: GameInput) {
    if (this.status === 'levelclear') {
      if (this.stateTime > 1.6) {
        this.level++;
        this.loadLevel();
        this.setStatus('playing');
      }
      this.updateSparks(dt);
      return;
    }
    // raquete: analógico proporcional (joystick) ou digital (teclado)
    const axis = Math.abs(input.x) > 0.15 ? input.x : 0;
    this.paddleX = Math.max(0, Math.min(FIELD.w - PADDLE.w, this.paddleX + axis * PADDLE.speed * dt));
    if (this.ball.stuck) {
      this.ball.x = this.paddleX + PADDLE.w / 2;
      if (input.pressed.blue || input.pressed.yellow) this.launch();
    }

    const ev = stepBall(this.ball, this.paddleX, this.bricks, dt);
    if (ev.paddle) this.sfx('bounce');
    else if (ev.wall) this.sfx('step');
    for (const b of ev.bricksHit) {
      if (b.metal) this.sfx('hit');
    }
    for (const b of ev.bricksBroken) {
      this.addScore(10 * this.level + (b.y < 50 ? 5 : 0));
      this.burst(b.x + BRICK.w / 2, b.y + BRICK.h / 2, HP_COLORS[1]);
      this.sfx('brick');
    }
    if (ev.bricksHit.some((b) => !b.metal && b.hp > 0)) this.sfx('bounce');

    if (ev.lost) {
      this.lives--;
      this.sfx('hit');
      if (this.lives <= 0) {
        this.finish(false);
        return;
      }
      this.resetBall();
    }

    if (remainingBreakable(this.bricks) === 0) {
      this.addScore(100 * this.level);
      if (this.level >= LEVELS.length) this.finish(true);
      else {
        this.setStatus('levelclear');
        this.sfx('powerup');
      }
    }
    this.updateSparks(dt);
  }

  private burst(x: number, y: number, color: string) {
    for (let i = 0; i < 8; i++) {
      const a = this.rng() * Math.PI * 2;
      const s = 30 + this.rng() * 60;
      this.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.4 + this.rng() * 0.3, color });
    }
  }

  private updateSparks(dt: number) {
    for (const p of this.sparks) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 160 * dt;
      p.life -= dt;
    }
    this.sparks = this.sparks.filter((p) => p.life > 0);
  }

  protected draw(ctx: CanvasRenderingContext2D) {
    const g = ctx.createLinearGradient(0, 0, 0, SCREEN_H);
    g.addColorStop(0, '#1a1438');
    g.addColorStop(1, '#2b1d3f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let x = 0; x < SCREEN_W; x += 20) ctx.fillRect(x, FIELD.top, 1, SCREEN_H);

    for (const b of this.bricks) {
      if (b.hp <= 0) continue;
      if (b.metal) {
        ctx.fillStyle = '#8d8f9c';
        ctx.fillRect(b.x, b.y, BRICK.w, BRICK.h);
        ctx.fillStyle = '#c8cad4';
        ctx.fillRect(b.x, b.y, BRICK.w, 2);
        ctx.fillStyle = '#5c5e6a';
        ctx.fillRect(b.x, b.y + BRICK.h - 2, BRICK.w, 2);
        continue;
      }
      ctx.fillStyle = HP_COLORS[Math.min(3, b.hp)];
      ctx.fillRect(b.x, b.y, BRICK.w, BRICK.h);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(b.x, b.y, BRICK.w, 2);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(b.x, b.y + BRICK.h - 2, BRICK.w, 2);
    }

    // raquete com as três cores dos botões
    const px = Math.round(this.paddleX);
    const third = PADDLE.w / 3;
    ctx.fillStyle = '#2c57d6';
    ctx.fillRect(px, PADDLE.y, third, PADDLE.h);
    ctx.fillStyle = '#f4c22e';
    ctx.fillRect(px + third, PADDLE.y, third, PADDLE.h);
    ctx.fillStyle = '#e2402c';
    ctx.fillRect(px + 2 * third, PADDLE.y, PADDLE.w - 2 * third, PADDLE.h);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(px, PADDLE.y, PADDLE.w, 1);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.round(this.ball.x - BALL_R), Math.round(this.ball.y - BALL_R), BALL_R * 2, BALL_R * 2);

    for (const p of this.sparks) {
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    }

    this.drawHud(ctx, `PONTOS ${this.score}  FASE ${this.level}  ${'♥'.repeat(Math.max(0, this.lives))}`);
    if (this.status === 'playing' && this.ball.stuck) {
      drawText(ctx, 'AZUL OU AMARELO PARA LANÇAR', SCREEN_W / 2, 150, { align: 'center', color: '#f2f0fa' });
    }
    if (this.status === 'levelclear') {
      drawText(ctx, `FASE ${this.level} COMPLETA!`, SCREEN_W / 2, 110, { scale: 2, align: 'center', color: this.accent, shadow: '#000' });
    }
  }
}
