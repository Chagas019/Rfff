import { BaseGame, SCREEN_H, SCREEN_W } from '../engine/BaseGame';
import { drawText } from '../engine/pixelFont';
import type { GameInput } from '../engine/types';
import { SPEED_STEPS, createSnake, stepSnake, turn, type SnakeState } from './snakeLogic';

const CELL = 10;
const TOP = 14;
const COLS = 30;
const ROWS = 18;

export class SnakeClassic extends BaseGame {
  readonly id = 'snake-classic' as const;
  readonly title = 'SNAKE CLASSIC';
  protected readonly accent = '#8fe36b';
  protected readonly instructions = ['JOYSTICK  MUDA A DIREÇÃO', 'AZUL  ACELERA (SEGURE)', '', '◀ ▶  VELOCIDADE'];

  /** Nível de velocidade escolhido no título (1–5). */
  speedLevel = 2;
  state!: SnakeState;
  private acc = 0;
  private deathFlash = 0;

  protected resetGame() {
    this.state = createSnake(COLS, ROWS, this.rng);
    this.acc = 0;
    this.deathFlash = 0;
  }

  protected updateTitle(_dt: number, input: GameInput) {
    if (input.pressed.left && this.speedLevel > 1) {
      this.speedLevel--;
      this.sfx('button');
    }
    if (input.pressed.right && this.speedLevel < SPEED_STEPS.length) {
      this.speedLevel++;
      this.sfx('button');
    }
  }

  protected step(dt: number, input: GameInput) {
    const s = this.state;
    if (!s.alive) {
      this.deathFlash += dt;
      if (this.deathFlash > 0.6) this.finish(false);
      return;
    }
    if (input.pressed.up) turn(s, 'up');
    else if (input.pressed.down) turn(s, 'down');
    else if (input.pressed.left) turn(s, 'left');
    else if (input.pressed.right) turn(s, 'right');

    const interval = SPEED_STEPS[this.speedLevel - 1] * (input.blue ? 0.55 : 1);
    this.acc += dt;
    while (this.acc >= interval && s.alive) {
      this.acc -= interval;
      const r = stepSnake(s, this.rng);
      if (r === 'ate') {
        this.addScore(10 * this.speedLevel);
        this.sfx('coin');
      } else if (r === 'died') {
        this.sfx('hit');
      } else if (r === 'won') {
        this.addScore(500);
        this.finish(true);
      }
    }
  }

  protected draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#10261a';
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    // tabuleiro quadriculado
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        ctx.fillStyle = (x + y) % 2 ? '#173523' : '#1a3b27';
        ctx.fillRect(x * CELL, TOP + y * CELL, CELL, CELL);
      }
    }
    const s = this.state;
    if (s.food) {
      const pulse = Math.floor(this.time * 4) % 2;
      ctx.fillStyle = '#ff5a4a';
      ctx.fillRect(s.food.x * CELL + 2 - pulse, TOP + s.food.y * CELL + 2 - pulse, 6 + pulse * 2, 6 + pulse * 2);
      ctx.fillStyle = '#ffd4cf';
      ctx.fillRect(s.food.x * CELL + 3, TOP + s.food.y * CELL + 3, 2, 2);
      ctx.fillStyle = '#5fbf3a';
      ctx.fillRect(s.food.x * CELL + 5, TOP + s.food.y * CELL + 1, 2, 2);
    }
    const dead = !s.alive && Math.floor(this.deathFlash * 10) % 2 === 0;
    s.body.forEach((c, i) => {
      ctx.fillStyle = dead ? '#ffffff' : i === 0 ? '#c8ff8a' : i % 2 ? '#7fdc54' : '#6fcc46';
      ctx.fillRect(c.x * CELL + 1, TOP + c.y * CELL + 1, CELL - 2, CELL - 2);
    });
    // olhos
    const h = s.body[0];
    ctx.fillStyle = '#10261a';
    const ex = s.dir === 'left' ? 2 : s.dir === 'right' ? 6 : 3;
    const ey = s.dir === 'up' ? 2 : s.dir === 'down' ? 6 : 3;
    if (s.dir === 'up' || s.dir === 'down') {
      ctx.fillRect(h.x * CELL + 2, TOP + h.y * CELL + ey, 2, 2);
      ctx.fillRect(h.x * CELL + 6, TOP + h.y * CELL + ey, 2, 2);
    } else {
      ctx.fillRect(h.x * CELL + ex, TOP + h.y * CELL + 2, 2, 2);
      ctx.fillRect(h.x * CELL + ex, TOP + h.y * CELL + 6, 2, 2);
    }
    this.drawHud(ctx, `PONTOS ${this.score}   VEL ${this.speedLevel}`);
  }

  protected drawTitle(ctx: CanvasRenderingContext2D) {
    super.drawTitle(ctx);
    const y = 128;
    drawText(ctx, 'VELOCIDADE', SCREEN_W / 2 - 50, y, { color: '#e8e6f0' });
    for (let i = 1; i <= SPEED_STEPS.length; i++) {
      ctx.fillStyle = i <= this.speedLevel ? this.accent : '#3a4a40';
      ctx.fillRect(SCREEN_W / 2 + 20 + i * 8, y + 7 - i, 6, i + 1);
    }
  }
}
