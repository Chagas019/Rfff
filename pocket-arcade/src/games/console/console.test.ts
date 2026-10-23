import { describe, expect, it } from 'vitest';
import { ArcadeConsole } from './ArcadeConsole';
import { ScreenSurface } from './ScreenSurface';
import { testEnv } from '../../test/helpers';
import { EMPTY_PAD, makeInput, type PadState } from '../engine/types';
import { hasGlyph } from '../engine/pixelFont';
import { CATALOG } from '../catalog';

const DT = 1 / 60;

function tap(c: ArcadeConsole, p: Partial<PadState>) {
  c.update(DT, { ...EMPTY_PAD, ...p });
  c.update(DT, { ...EMPTY_PAD });
}

describe('Console (abertura → biblioteca → jogo)', () => {
  it('navega pela biblioteca, abre um jogo e volta', () => {
    const { env } = testEnv();
    const c = new ArcadeConsole(new ScreenSurface(), env);
    expect(c.mode).toBe('boot');
    tap(c, { start: true });
    expect(c.mode).toBe('library');
    tap(c, { y: -1 });
    tap(c, { y: -1 });
    expect(c.selected).toBe(2);
    tap(c, { yellow: true });
    expect(c.mode).toBe('game');
    expect(c.game?.id).toBe(CATALOG[2].id);
    tap(c, { yellow: true }); // começa
    expect(c.game?.status).toBe('playing');
    tap(c, { red: true }); // pausa
    expect(c.game?.status).toBe('paused');
    tap(c, { red: true }); // sai
    expect(c.mode).toBe('library');
  });

  it('pausa pela interface (botão Pausar) e avisa a mudança', () => {
    const { env } = testEnv();
    const c = new ArcadeConsole(new ScreenSurface(), env);
    const seen: string[] = [];
    c.subscribe((s) => seen.push(`${s.mode}:${s.status}`));
    c.launch('brick-breaker');
    tap(c, { blue: true });
    c.togglePause();
    expect(c.game?.status).toBe('paused');
    expect(seen).toContain('game:paused');
  });
});

describe('Entrada e fonte', () => {
  it('detecta "acabou de apertar" só no primeiro quadro', () => {
    const a = makeInput({ ...EMPTY_PAD, blue: true }, EMPTY_PAD);
    const b = makeInput({ ...EMPTY_PAD, blue: true }, { ...EMPTY_PAD, blue: true });
    expect(a.pressed.blue).toBe(true);
    expect(b.pressed.blue).toBe(false);
    expect(makeInput({ ...EMPTY_PAD, x: -0.9 }, EMPTY_PAD).pressed.left).toBe(true);
  });

  it('a fonte pixelada cobre todos os textos dos jogos', () => {
    const texts = [
      'ESCOLHA O JOGO',
      'PAUSADO',
      'FIM DE JOGO',
      'VITÓRIA!',
      'NOVO RECORDE!',
      'AMARELO PARA COMEÇAR',
      'FASE COMPLETA!',
      'CARTUCHO REMOVIDO',
      'PRÓXIMA: RUÍNAS',
      '▲▼ ▶ ◀ ♥ ●',
      ...CATALOG.map((c) => `${c.title} ${c.cartridgeLabel}`),
    ];
    for (const t of texts) {
      for (const ch of t.toUpperCase().normalize('NFD')) {
        if (/[̀-ͯ]/.test(ch)) continue;
        expect(hasGlyph(ch), `"${ch}" em "${t}"`).toBe(true);
      }
    }
  });
});
