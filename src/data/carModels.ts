/**
 * MODELOS 3D DOS CARROS 2026
 * Fonte: série "2026 F1" de Tyler_Dave no Sketchfab, licença CC BY 4.0 (uso permitido com crédito).
 * Pinturas e patrocinadores seguem as pinturas oficiais 2026; a carroceria é uma base do
 * regulamento 2026 comum a todos os carros da série (não é a aerodinâmica exata de cada equipe).
 *
 * `file` aponta para o GLB otimizado em /public/models (gerado por tools/fetch-car-models.mjs).
 * Equipes sem modelo licenciado ficam como `pending`: o configurador mostra isso claramente,
 * sem trocar por fotografia.
 */
import { drivers } from './drivers';

export interface CarModel {
  teamId: string;
  status: 'available' | 'pending';
  /** Temporada a que o modelo corresponde (regulamento e pintura). */
  season: number;
  /** Versão do arquivo na biblioteca (aumente ao trocar o modelo). */
  version: number;
  /** Arquivo em /public/models (só quando status = available). */
  file?: string;
  /** Versão mais leve (menos polígonos, texturas menores) para celulares. */
  fileMobile?: string;
  title: string;
  author?: string;
  authorUrl?: string;
  sourceUrl?: string;
  /** UID do modelo no Sketchfab (para baixar com tools/fetch-car-models.mjs). */
  sketchfabUid?: string;
  license?: { label: string; url: string };
  note?: string;
}

const CC_BY = { label: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' };
const AUTHOR = { author: 'Tyler_Dave', authorUrl: 'https://sketchfab.com/Tyler_Dave' };
const sf = (teamId: string, title: string, uid: string): CarModel => ({
  teamId, title, season: 2026, version: 1, status: 'pending', sketchfabUid: uid, sourceUrl: `https://sketchfab.com/3d-models/${uid}`, license: CC_BY, ...AUTHOR,
  note: 'Modelo licenciado selecionado; aguardando o download (token da conta Sketchfab).',
});

export const CAR_MODELS: CarModel[] = [
  sf('mclaren', '2026 McLaren MCL40', '96214ad5624f42a0861f77008f8d29e7'),
  sf('ferrari', '2026 Ferrari SF-26', 'e5ca6cecdc42449283f4bed27360f2a7'),
  sf('red-bull', '2026 Red Bull RB22', '0a3d24a58e0549d591a5a48c22eec383'),
  sf('mercedes', '2026 Mercedes W17', 'b806f1e70aa343219e7158169549b97b'),
  sf('aston-martin', '2026 Aston Martin AMR26', 'a50d1c7bc086455c9412470d93fc3fc7'),
  { teamId: 'alpine', title: 'Alpine A526', season: 2026, version: 0, status: 'pending', note: 'Ainda não existe modelo 3D licenciado e fiel do A526 disponível publicamente.' },
  sf('williams', '2026 Williams FW48', '4efa51e6d64a4192a83418f1b715c671'),
  { teamId: 'racing-bulls', title: 'Racing Bulls VCARB 03', season: 2026, version: 0, status: 'pending', note: 'Ainda não existe modelo 3D licenciado e fiel do VCARB 03 disponível publicamente.' },
  sf('haas', '2026 Haas VF-26', '1f41e03886724bc6acd16c92402989bc'),
  sf('audi', '2026 Audi R26', '32bf228264b047669b100b0f1b8769ac'),
  sf('cadillac', '2026 Cadillac MAC-26', '95bcd37aa7c649779efc33b90b6c023e'),
];

/** Temporadas com modelos catalogados (outras aparecem como indisponíveis). */
export const MODEL_SEASONS = [2026];

/** Pilotos que usam o modelo (os titulares da equipe na temporada). */
export const driversForModel = (m: CarModel) => drivers.filter((d) => d.teamId === m.teamId).map((d) => d.id);

export const modelFor = (teamId: string, season = 2026) => CAR_MODELS.find((m) => m.teamId === teamId && m.season === season);
