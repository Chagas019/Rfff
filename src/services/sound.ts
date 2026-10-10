import { readStorage, writeStorage } from './storage';

/**
 * Som de carro de F1 passando, tocado na troca de páginas.
 * Arquivo sintetizado para o projeto (public/sounds/f1-pass.mp3): motor V6 em
 * alta rotação com efeito Doppler e panorâmica esquerda → direita.
 */
const KEY = 'gridf1:sound';
const SRC = '/sounds/f1-pass.mp3';
let audio: HTMLAudioElement | null = null;
const listeners = new Set<(on: boolean) => void>();

function getAudio() {
  if (typeof Audio === 'undefined') return null;
  if (!audio) {
    audio = new Audio(SRC);
    audio.preload = 'auto';
    audio.volume = 0.55;
  }
  return audio;
}

export const isSoundOn = () => readStorage<boolean>(KEY, true);

export function setSoundOn(on: boolean) {
  writeStorage(KEY, on);
  listeners.forEach((fn) => fn(on));
}

export function onSoundChange(fn: (on: boolean) => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** Carrega o arquivo com antecedência (sem tocar). */
export function preloadPassSound() { getAudio()?.load(); }

/** Toca o som de passagem (o navegador só permite após um clique/toque do usuário). */
export function playPassSound() {
  if (!isSoundOn()) return;
  const a = getAudio();
  if (!a) return;
  try {
    a.currentTime = 0;
    void a.play().catch(() => { /* bloqueado pelo navegador: ignora */ });
  } catch { /* ignora */ }
}
