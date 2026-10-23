export const FIELD = { w: 300, h: 200, top: 14 };
export const PADDLE = { w: 46, h: 5, y: 186, speed: 230 };
export const BALL_R = 3;
export const BRICK = { w: 26, h: 9, gap: 2, cols: 10, x0: 11, y0: 28 };

/**
 * Fases: cada caractere é um bloco. '1'–'3' = resistência, 'X' = metal (indestrutível),
 * '.' = vazio. A dificuldade sobe com mais resistência, metal e bola mais rápida.
 */
export const LEVELS: string[][] = [
  ['1111111111', '1111111111', '1111111111', '1111111111'],
  ['2222222222', '1111111111', '1.1.1.1.1.', '.1.1.1.1.1', '1111111111'],
  ['3..3333..3', '2222222222', '1X1111111X', '2222222222', '1111111111'],
  ['....33....', '...2222...', '..111111..', '.22222222.', '3X3X33X3X3', '1111111111'],
  ['3333333333', '2X22222X22', '1111111111', '2222222222', '1X1X11X1X1', '3333333333'],
];

export interface Brick {
  x: number;
  y: number;
  hp: number;
  metal: boolean;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  stuck: boolean;
}

export function buildBricks(level: number): Brick[] {
  const rows = LEVELS[(level - 1) % LEVELS.length];
  const bricks: Brick[] = [];
  rows.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      if (ch === '.') return;
      bricks.push({
        x: BRICK.x0 + c * (BRICK.w + BRICK.gap),
        y: BRICK.y0 + r * (BRICK.h + BRICK.gap),
        hp: ch === 'X' ? Infinity : Number(ch),
        metal: ch === 'X',
      });
    });
  });
  return bricks;
}

export const ballSpeedFor = (level: number) => 150 + (level - 1) * 20;

/** Ângulo de saída da raquete: quanto mais na ponta, mais inclinado (até 60°). */
export function paddleBounce(ball: Ball, paddleX: number) {
  const speed = Math.hypot(ball.vx, ball.vy);
  const offset = Math.max(-1, Math.min(1, (ball.x - (paddleX + PADDLE.w / 2)) / (PADDLE.w / 2)));
  const angle = offset * (Math.PI / 3);
  ball.vx = Math.sin(angle) * speed;
  ball.vy = -Math.abs(Math.cos(angle) * speed);
}

export interface StepEvents {
  wall: boolean;
  paddle: boolean;
  bricksHit: Brick[];
  bricksBroken: Brick[];
  lost: boolean;
}

/** Interseção círculo × retângulo. */
export function circleRect(cx: number, cy: number, r: number, x: number, y: number, w: number, h: number) {
  const nx = Math.max(x, Math.min(cx, x + w));
  const ny = Math.max(y, Math.min(cy, y + h));
  return (cx - nx) ** 2 + (cy - ny) ** 2 <= r * r;
}

/**
 * Move a bola em subpassos de no máximo 2 px (sem atravessar blocos) e resolve colisões
 * com paredes, raquete e blocos.
 */
export function stepBall(ball: Ball, paddleX: number, bricks: Brick[], dt: number): StepEvents {
  const ev: StepEvents = { wall: false, paddle: false, bricksHit: [], bricksBroken: [], lost: false };
  if (ball.stuck) return ev;
  const dist = Math.hypot(ball.vx, ball.vy) * dt;
  const n = Math.max(1, Math.ceil(dist / 2));
  const sdt = dt / n;
  for (let i = 0; i < n; i++) {
    const px = ball.x;
    const py = ball.y;
    ball.x += ball.vx * sdt;
    ball.y += ball.vy * sdt;

    if (ball.x < BALL_R) {
      ball.x = BALL_R;
      ball.vx = Math.abs(ball.vx);
      ev.wall = true;
    } else if (ball.x > FIELD.w - BALL_R) {
      ball.x = FIELD.w - BALL_R;
      ball.vx = -Math.abs(ball.vx);
      ev.wall = true;
    }
    if (ball.y < FIELD.top + BALL_R) {
      ball.y = FIELD.top + BALL_R;
      ball.vy = Math.abs(ball.vy);
      ev.wall = true;
    }

    if (ball.vy > 0 && circleRect(ball.x, ball.y, BALL_R, paddleX, PADDLE.y, PADDLE.w, PADDLE.h) && py <= PADDLE.y) {
      ball.y = PADDLE.y - BALL_R;
      paddleBounce(ball, paddleX);
      ev.paddle = true;
    }

    for (const b of bricks) {
      if (b.hp <= 0) continue;
      if (!circleRect(ball.x, ball.y, BALL_R, b.x, b.y, BRICK.w, BRICK.h)) continue;
      // de que lado veio? se antes já estava na faixa horizontal do bloco, bateu em cima/embaixo
      const wasInsideX = px + BALL_R > b.x && px - BALL_R < b.x + BRICK.w;
      const wasInsideY = py + BALL_R > b.y && py - BALL_R < b.y + BRICK.h;
      if (wasInsideX && !wasInsideY) {
        ball.vy = -ball.vy;
        ball.y = py;
      } else if (wasInsideY && !wasInsideX) {
        ball.vx = -ball.vx;
        ball.x = px;
      } else {
        ball.vx = -ball.vx;
        ball.vy = -ball.vy;
        ball.x = px;
        ball.y = py;
      }
      ev.bricksHit.push(b);
      if (!b.metal) {
        b.hp -= 1;
        if (b.hp <= 0) ev.bricksBroken.push(b);
      }
      break; // um bloco por subpasso
    }

    if (ball.y > FIELD.h + BALL_R * 2) {
      ev.lost = true;
      break;
    }
  }
  return ev;
}

export const remainingBreakable = (bricks: Brick[]) => bricks.filter((b) => !b.metal && b.hp > 0).length;
