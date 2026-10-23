import type { CartridgeSlot } from '../three/ArcadeModel/parts';
import { BrickBreaker } from './BrickBreaker/BrickBreaker';
import type { BaseGame } from './engine/BaseGame';
import type { GameEnv, GameId } from './engine/types';
import { PixelAdventure } from './PixelAdventure/PixelAdventure';
import { SnakeClassic } from './SnakeClassic/SnakeClassic';
import { SpaceDefender } from './SpaceDefender/SpaceDefender';

export interface CatalogEntry {
  id: GameId;
  title: string;
  description: string;
  /** Peça física do aparelho que carrega o jogo (o Snake vem embutido na memória). */
  cartridge: CartridgeSlot | null;
  cartridgeLabel: string;
  color: string;
  controls: string;
  create: (env: GameEnv) => BaseGame;
}

/**
 * Biblioteca de jogos. O aparelho da foto tem três peças removíveis
 * (cartucho amarelo no topo, cartão azul na lateral e peça vermelha na base);
 * cada uma carrega um jogo. O quarto jogo fica na memória interna para não
 * acrescentar ao aparelho uma peça que não existe na referência.
 */
export const CATALOG: CatalogEntry[] = [
  {
    id: 'pixel-adventure',
    title: 'Pixel Adventure',
    description: 'Plataforma em 3 fases: corra, pule, colete moedas e chegue à bandeira.',
    cartridge: 'top',
    cartridgeLabel: 'Cartucho amarelo (topo)',
    color: '#f5c536',
    controls: 'Joystick anda · Amarelo pula · Azul corre',
    create: (env) => new PixelAdventure(env).init(),
  },
  {
    id: 'space-defender',
    title: 'Space Defender',
    description: 'Defenda a base de ondas de naves cada vez mais rápidas.',
    cartridge: 'side',
    cartridgeLabel: 'Cartão azul (lateral)',
    color: '#4a5ee0',
    controls: 'Joystick move · Azul atira · Amarelo bomba',
    create: (env) => new SpaceDefender(env).init(),
  },
  {
    id: 'snake-classic',
    title: 'Snake Classic',
    description: 'A cobra clássica, com velocidade ajustável de 1 a 5.',
    cartridge: null,
    cartridgeLabel: 'Memória interna',
    color: '#7fdc54',
    controls: 'Joystick vira · Azul acelera',
    create: (env) => new SnakeClassic(env).init(),
  },
  {
    id: 'brick-breaker',
    title: 'Brick Breaker',
    description: 'Quebre todos os blocos em 5 fases com a raquete tricolor.',
    cartridge: 'bottom',
    cartridgeLabel: 'Peça vermelha (base)',
    color: '#f0573a',
    controls: 'Joystick move · Azul ou Amarelo lança',
    create: (env) => new BrickBreaker(env).init(),
  },
];

export const gameForCartridge = (slot: CartridgeSlot) => CATALOG.find((c) => c.cartridge === slot) ?? null;
export const catalogEntry = (id: GameId) => CATALOG.find((c) => c.id === id)!;
