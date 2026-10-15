/**
 * Valores animados pelo GSAP e lidos pela cena 3D a cada quadro.
 * Ficam fora do React para não causar re-renderizações a 60 fps.
 */
export const introState = {
  /** 0 → 1: partículas surgindo */
  particles: 0,
  /** 0 → 1: globo saindo da escuridão */
  globe: 0,
  /** 0 → 1: atmosfera acendendo */
  atmosphere: 0,
};

export const storyState = {
  /** Progresso (0 → 1) do storytelling do topo da página até o fim da seção Experience. */
  progress: 0,
};

export function completeIntro() {
  introState.particles = 1;
  introState.globe = 1;
  introState.atmosphere = 1;
}
