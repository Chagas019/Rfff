import { drawText } from './pixelFont';
import type { Rng } from './random';
import type { Game, GameEnv, GameId, GameInput, GameStatus, SfxName } from './types';

export const SCREEN_W = 300;
export const SCREEN_H = 200;

/**
 * Comportamento comum dos jogos: tela de título, pausa real, fim de jogo/vitória,
 * reinício, recorde local e retorno à biblioteca.
 *
 * Controles comuns:
 *  - Título: amarelo, azul ou Start começam; vermelho volta para a biblioteca.
 *  - Jogando: Start ou vermelho pausam.
 *  - Pausa: amarelo/Start continuam, azul reinicia, vermelho sai.
 *  - Fim: amarelo/azul/Start jogam de novo, vermelho sai.
 */
export abstract class BaseGame implements Game {
  abstract readonly id: GameId;
  abstract readonly title: string;
  /** Cor de destaque nas telas do jogo. */
  protected abstract readonly accent: string;
  /** Linhas de instrução mostradas no título. */
  protected abstract readonly instructions: string[];

  status: GameStatus = 'title';
  score = 0;
  best = 0;
  exitRequested = false;
  /** Tempo no estado atual (s). */
  protected stateTime = 0;
  protected time = 0;
  protected rng: Rng;
  private env: GameEnv;
  private newRecord = false;

  constructor(env: GameEnv) {
    this.env = env;
    this.rng = env.rng;
  }

  /** Carrega o recorde salvo (chamado logo depois da construção). */
  init() {
    this.best = this.env.highscores.get(this.id);
    this.resetGame();
    return this;
  }

  protected sfx(name: SfxName) {
    this.env.sfx(name);
  }

  protected setStatus(s: GameStatus) {
    this.status = s;
    this.stateTime = 0;
  }

  start() {
    this.score = 0;
    this.newRecord = false;
    this.resetGame();
    this.setStatus('playing');
    this.sfx('start');
  }

  togglePause() {
    if (this.status === 'playing') {
      this.setStatus('paused');
      this.sfx('pause');
    } else if (this.status === 'paused') {
      this.setStatus('playing');
      this.sfx('confirm');
    }
  }

  protected addScore(n: number) {
    this.score += n;
  }

  /** Termina a partida (derrota ou vitória) e grava o recorde. */
  protected finish(won: boolean) {
    this.setStatus(won ? 'victory' : 'gameover');
    this.sfx(won ? 'win' : 'lose');
    if (this.score > this.best) {
      this.best = this.score;
      this.newRecord = true;
      this.env.highscores.set(this.id, this.score);
    }
  }

  update(dt: number, input: GameInput) {
    this.time += dt;
    this.stateTime += dt;
    const p = input.pressed;
    switch (this.status) {
      case 'title':
        this.updateTitle(dt, input);
        if (p.yellow || p.blue || p.start) this.start();
        else if (p.red) this.exit();
        break;
      case 'playing':
        if (p.start || p.red) {
          this.togglePause();
          break;
        }
        this.step(dt, input);
        break;
      case 'paused':
        if (p.yellow || p.start) this.togglePause();
        else if (p.blue) this.start();
        else if (p.red) this.exit();
        break;
      case 'levelclear':
        this.step(dt, input);
        break;
      case 'gameover':
      case 'victory':
        if (this.stateTime < 0.7) break; // evita reiniciar sem querer
        if (p.yellow || p.blue || p.start) this.start();
        else if (p.red) this.exit();
        break;
    }
  }

  protected exit() {
    this.exitRequested = true;
    this.sfx('back');
  }

  render(ctx: CanvasRenderingContext2D) {
    this.draw(ctx);
    if (this.status === 'title') this.drawTitle(ctx);
    else if (this.status === 'paused') this.drawPanel(ctx, 'PAUSADO', ['AMARELO  CONTINUAR', 'AZUL  REINICIAR', 'VERMELHO  SAIR']);
    else if (this.status === 'gameover')
      this.drawPanel(ctx, 'FIM DE JOGO', [`PONTOS ${this.score}`, this.newRecord ? 'NOVO RECORDE!' : `RECORDE ${this.best}`, '', 'AMARELO  JOGAR DE NOVO', 'VERMELHO  SAIR']);
    else if (this.status === 'victory')
      this.drawPanel(ctx, 'VITÓRIA!', [`PONTOS ${this.score}`, this.newRecord ? 'NOVO RECORDE!' : `RECORDE ${this.best}`, '', 'AMARELO  JOGAR DE NOVO', 'VERMELHO  SAIR']);
  }

  protected drawTitle(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'rgba(8,10,20,0.72)';
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    drawText(ctx, this.title, SCREEN_W / 2, 30, { scale: 2, align: 'center', color: this.accent, shadow: '#000' });
    this.instructions.forEach((line, i) => drawText(ctx, line, SCREEN_W / 2, 74 + i * 12, { align: 'center', color: '#e8e6f0' }));
    drawText(ctx, `RECORDE ${this.best}`, SCREEN_W / 2, 150, { align: 'center', color: '#f4c22e' });
    if (Math.floor(this.time * 2.5) % 2 === 0) drawText(ctx, 'AMARELO PARA COMEÇAR', SCREEN_W / 2, 172, { align: 'center', color: '#ffffff' });
    drawText(ctx, 'VERMELHO  VOLTAR', SCREEN_W / 2, 186, { align: 'center', color: '#9a98a8' });
  }

  protected drawPanel(ctx: CanvasRenderingContext2D, title: string, lines: string[]) {
    const h = 44 + lines.length * 12;
    const y = Math.round((SCREEN_H - h) / 2);
    ctx.fillStyle = 'rgba(8,10,20,0.8)';
    ctx.fillRect(40, y, SCREEN_W - 80, h);
    ctx.fillStyle = this.accent;
    ctx.fillRect(40, y, SCREEN_W - 80, 2);
    ctx.fillRect(40, y + h - 2, SCREEN_W - 80, 2);
    drawText(ctx, title, SCREEN_W / 2, y + 10, { scale: 2, align: 'center', color: this.accent, shadow: '#000' });
    lines.forEach((l, i) => drawText(ctx, l, SCREEN_W / 2, y + 36 + i * 12, { align: 'center', color: '#f2f0fa' }));
  }

  /** Placar comum no topo. */
  protected drawHud(ctx: CanvasRenderingContext2D, left: string, right = `REC ${Math.max(this.best, this.score)}`) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, SCREEN_W, 12);
    drawText(ctx, left, 4, 3, { color: '#ffffff' });
    drawText(ctx, right, SCREEN_W - 4, 3, { color: '#f4c22e', align: 'right' });
  }

  protected updateTitle(_dt: number, _input: GameInput) {}
  protected abstract resetGame(): void;
  protected abstract step(dt: number, input: GameInput): void;
  protected abstract draw(ctx: CanvasRenderingContext2D): void;
}
