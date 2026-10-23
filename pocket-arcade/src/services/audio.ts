import type { SfxName } from '../games/engine/types';
import { readStorage, writeStorage } from './storage';

type Note = { f: number; t: number; d: number; type?: OscillatorType; v?: number; to?: number };

/**
 * Efeitos sonoros originais, sintetizados na hora com Web Audio (nenhum arquivo externo).
 * O contexto de áudio só é criado depois de um gesto da pessoa, como exigem os navegadores.
 */
const RECIPES: Record<SfxName, { notes?: Note[]; noise?: { t: number; d: number; v: number; hp?: number } }> = {
  button: { notes: [{ f: 880, t: 0, d: 0.035, type: 'square', v: 0.12 }] },
  confirm: { notes: [{ f: 660, t: 0, d: 0.06, type: 'square' }, { f: 990, t: 0.06, d: 0.09, type: 'square' }] },
  back: { notes: [{ f: 520, t: 0, d: 0.06, type: 'square' }, { f: 330, t: 0.06, d: 0.09, type: 'square' }] },
  start: { notes: [523, 659, 784, 1047].map((f, i) => ({ f, t: i * 0.07, d: 0.09, type: 'square' as const })) },
  coin: { notes: [{ f: 988, t: 0, d: 0.05, type: 'square' }, { f: 1319, t: 0.05, d: 0.12, type: 'square' }] },
  jump: { notes: [{ f: 300, to: 720, t: 0, d: 0.13, type: 'square', v: 0.1 }] },
  shoot: { notes: [{ f: 1200, to: 380, t: 0, d: 0.08, type: 'square', v: 0.07 }] },
  hit: { notes: [{ f: 220, to: 90, t: 0, d: 0.12, type: 'sawtooth', v: 0.12 }], noise: { t: 0, d: 0.08, v: 0.12 } },
  explode: { noise: { t: 0, d: 0.35, v: 0.22 }, notes: [{ f: 140, to: 40, t: 0, d: 0.3, type: 'triangle', v: 0.2 }] },
  bounce: { notes: [{ f: 520, t: 0, d: 0.04, type: 'square', v: 0.08 }] },
  brick: { notes: [{ f: 760, t: 0, d: 0.05, type: 'square', v: 0.1 }], noise: { t: 0, d: 0.04, v: 0.06, hp: 2000 } },
  powerup: { notes: [392, 523, 659, 784, 1047].map((f, i) => ({ f, t: i * 0.05, d: 0.07, type: 'triangle' as const, v: 0.16 })) },
  lose: { notes: [494, 440, 392, 330].map((f, i) => ({ f, t: i * 0.13, d: 0.15, type: 'triangle' as const, v: 0.18 })) },
  win: { notes: [523, 659, 784, 659, 784, 1047].map((f, i) => ({ f, t: i * 0.09, d: 0.12, type: 'square' as const, v: 0.1 })) },
  insert: { notes: [{ f: 180, to: 90, t: 0.02, d: 0.09, type: 'triangle', v: 0.25 }], noise: { t: 0, d: 0.05, v: 0.15, hp: 1200 } },
  eject: { noise: { t: 0, d: 0.12, v: 0.1, hp: 3000 }, notes: [{ f: 240, to: 380, t: 0, d: 0.08, type: 'triangle', v: 0.12 }] },
  pause: { notes: [{ f: 784, t: 0, d: 0.06, type: 'square' }, { f: 523, t: 0.07, d: 0.08, type: 'square' }] },
  step: { notes: [{ f: 300, t: 0, d: 0.025, type: 'square', v: 0.05 }] },
};

const MUTE_KEY = 'pocket-arcade:muted';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  muted: boolean;

  constructor() {
    this.muted = readStorage(MUTE_KEY) === '1';
  }

  /** Chamar dentro de um gesto (clique, toque ou tecla). */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    try {
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      const len = Math.floor(this.ctx.sampleRate * 0.5);
      this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    } catch {
      this.ctx = null;
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    writeStorage(MUTE_KEY, m ? '1' : '0');
  }

  play(name: SfxName) {
    if (this.muted || !this.ctx || !this.master || this.ctx.state !== 'running') return;
    const r = RECIPES[name];
    const now = this.ctx.currentTime + 0.005;
    for (const n of r.notes ?? []) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = n.type ?? 'square';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, now + n.t + n.d);
      const v = n.v ?? 0.12;
      g.gain.setValueAtTime(0.0001, now + n.t);
      g.gain.exponentialRampToValueAtTime(v, now + n.t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);
      osc.connect(g).connect(this.master);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.02);
    }
    if (r.noise && this.noiseBuffer) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const g = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = r.noise.hp ?? 200;
      g.gain.setValueAtTime(r.noise.v, now + r.noise.t);
      g.gain.exponentialRampToValueAtTime(0.0001, now + r.noise.t + r.noise.d);
      src.connect(filter).connect(g).connect(this.master);
      src.start(now + r.noise.t);
      src.stop(now + r.noise.t + r.noise.d + 0.02);
    }
  }
}

export const SFX_NAMES = Object.keys(RECIPES) as SfxName[];
