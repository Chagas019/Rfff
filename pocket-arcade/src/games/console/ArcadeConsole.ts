import { CATALOG, catalogEntry } from '../catalog';
import { SCREEN_H, SCREEN_W, type BaseGame } from '../engine/BaseGame';
import { drawText } from '../engine/pixelFont';
import { EMPTY_PAD, makeInput, type GameEnv, type GameId, type GameInput, type GameStatus, type PadState } from '../engine/types';
import type { ScreenSurface } from './ScreenSurface';

export type ConsoleMode = 'boot' | 'library' | 'game';

export interface ConsoleSnapshot {
  mode: ConsoleMode;
  gameId: GameId | null;
  status: GameStatus | null;
  selected: number;
  score: number;
}

/**
 * "Sistema operacional" da tela: abertura (a arte original da foto), biblioteca de
 * cartuchos e o jogo em execução. Recebe o estado dos controles a cada quadro.
 */
export class ArcadeConsole {
  mode: ConsoleMode = 'boot';
  game: BaseGame | null = null;
  selected = 0;
  /** Mostra a dica "START" piscando na abertura (só no modo Jogar). */
  showStartHint = false;
  private prev: PadState = { ...EMPTY_PAD };
  private time = 0;
  private message: { text: string; until: number } | null = null;
  private listeners = new Set<(s: ConsoleSnapshot) => void>();
  private lastKey = '';

  constructor(
    private screen: ScreenSurface,
    private env: GameEnv,
    private bootImage: CanvasImageSource | null = null,
  ) {}

  setBootImage(img: CanvasImageSource) {
    this.bootImage = img;
  }

  subscribe(fn: (s: ConsoleSnapshot) => void) {
    this.listeners.add(fn);
    fn(this.snapshot());
    return () => this.listeners.delete(fn);
  }

  snapshot(): ConsoleSnapshot {
    return {
      mode: this.mode,
      gameId: this.game?.id ?? null,
      status: this.game?.status ?? null,
      selected: this.selected,
      score: this.game?.score ?? 0,
    };
  }

  private emit() {
    const s = this.snapshot();
    const key = `${s.mode}|${s.gameId}|${s.status}|${s.selected}`;
    if (key === this.lastKey) return;
    this.lastKey = key;
    this.listeners.forEach((fn) => fn(s));
  }

  flash(text: string, seconds = 2) {
    this.message = { text, until: this.time + seconds };
  }

  launch(id: GameId) {
    this.game = catalogEntry(id).create(this.env);
    this.selected = CATALOG.findIndex((c) => c.id === id);
    this.mode = 'game';
    this.env.sfx('confirm');
    this.emit();
  }

  openLibrary(message?: string) {
    this.game = null;
    this.mode = 'library';
    if (message) this.flash(message);
    this.emit();
  }

  /** Pausa/continua o jogo atual (botão de pausa da interface). */
  togglePause() {
    this.game?.togglePause();
    this.emit();
  }

  /** Pausa sem alternar (ex.: aba em segundo plano, sair do modo Jogar). */
  pause() {
    if (this.game?.status === 'playing') this.togglePause();
  }

  update(dt: number, pad: PadState) {
    this.time += dt;
    const input = makeInput(pad, this.prev);
    this.prev = { ...pad };
    switch (this.mode) {
      case 'boot':
        if (input.pressed.start || input.pressed.yellow || input.pressed.blue) {
          this.env.sfx('confirm');
          this.openLibrary();
        }
        break;
      case 'library':
        this.updateLibrary(input);
        break;
      case 'game':
        if (this.game) {
          this.game.update(dt, input);
          if (this.game.exitRequested) this.openLibrary();
        }
        break;
    }
    this.render();
    this.emit();
  }

  private updateLibrary(input: GameInput) {
    const n = CATALOG.length;
    if (input.pressed.up) {
      this.selected = (this.selected + n - 1) % n;
      this.env.sfx('button');
    } else if (input.pressed.down) {
      this.selected = (this.selected + 1) % n;
      this.env.sfx('button');
    } else if (input.pressed.yellow || input.pressed.blue || input.pressed.start) {
      this.launch(CATALOG[this.selected].id);
    } else if (input.pressed.red) {
      this.mode = 'boot';
      this.env.sfx('back');
    }
  }

  render() {
    const ctx = this.screen.ctx;
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    if (this.mode === 'boot') this.renderBoot(ctx);
    else if (this.mode === 'library') this.renderLibrary(ctx);
    else this.game?.render(ctx);
    if (this.message && this.time < this.message.until) {
      const w = Math.min(SCREEN_W - 20, this.message.text.length * 6 + 16);
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect((SCREEN_W - w) / 2, SCREEN_H - 30, w, 16);
      drawText(ctx, this.message.text, SCREEN_W / 2, SCREEN_H - 26, { align: 'center', color: '#f4c22e' });
    }
    this.screen.present();
  }

  private renderBoot(ctx: CanvasRenderingContext2D) {
    if (this.bootImage) ctx.drawImage(this.bootImage, 0, 0, SCREEN_W, SCREEN_H);
    else {
      ctx.fillStyle = '#0c0c0f';
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    }
    if (this.showStartHint && Math.floor(this.time * 2) % 2 === 0) {
      // no rodapé preto da arte, à esquerda do "MOTION DESIGN 2024"
      drawText(ctx, '▶ START', 8, SCREEN_H - 13, { color: '#ffffff' });
    }
  }

  private renderLibrary(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#14121c';
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    ctx.fillStyle = '#1c1a28';
    for (let y = 0; y < SCREEN_H; y += 4) ctx.fillRect(0, y, SCREEN_W, 1);
    drawText(ctx, 'ESCOLHA O JOGO', SCREEN_W / 2, 10, { scale: 2, align: 'center', color: '#f4c22e', shadow: '#000' });
    CATALOG.forEach((c, i) => {
      const y = 38 + i * 34;
      const sel = i === this.selected;
      ctx.fillStyle = sel ? '#2a2740' : '#1b1926';
      ctx.fillRect(14, y, SCREEN_W - 28, 30);
      if (sel) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(14, y, 2, 30);
        drawText(ctx, '▶', 20, y + 11, { color: '#ffffff' });
      }
      // "etiqueta" do cartucho com a cor da peça física
      ctx.fillStyle = c.color;
      ctx.fillRect(32, y + 6, 14, 18);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(32, y + 6, 14, 3);
      drawText(ctx, c.title, 54, y + 6, { color: sel ? '#ffffff' : '#c9c6d8' });
      drawText(ctx, c.cartridgeLabel, 54, y + 17, { color: '#8a87a0' });
      const best = this.env.highscores.get(c.id);
      drawText(ctx, `REC ${best}`, SCREEN_W - 22, y + 6, { color: '#f4c22e', align: 'right' });
    });
    drawText(ctx, '▲▼ ESCOLHER   AMARELO JOGAR   VERMELHO VOLTAR', SCREEN_W / 2, SCREEN_H - 12, { align: 'center', color: '#8a87a0' });
  }
}
