import type { ContinentId, RegionId, StatItem } from './types';

/** Configurações editáveis do site. Troque aqui sem mexer nos componentes. */
export const SITE = {
  brand: { first: 'NOVA', second: 'DIGITAL' },
  /** E-mail que recebe as mensagens do formulário quando não há endpoint configurado. */
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || 'contato@novadigital.example',
  /** Endpoint opcional (POST JSON) para o formulário de contato. */
  contactEndpoint: import.meta.env.VITE_CONTACT_ENDPOINT || '',
};

export const NAV_LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'experience', label: 'Experience' },
  { id: 'technology', label: 'Technology' },
  { id: 'network', label: 'Network' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
] as const;

/**
 * Indicadores da seção "One planet". São EXEMPLOS de interface, não estatísticas reais.
 * Troque pelos números confirmados da empresa antes de publicar.
 */
export const NETWORK_STATS: { demo: boolean; items: StatItem[] } = {
  demo: true,
  items: [
    { value: 120, suffix: '+', label: 'cidades conectadas' },
    { value: 48, label: 'países alcançados' },
    { value: 99.9, decimals: 1, suffix: '%', label: 'de disponibilidade' },
  ],
};

export const CONTINENTS: Record<ContinentId, { label: string; lat: number; lon: number }> = {
  'north-america': { label: 'América do Norte', lat: 42, lon: -100 },
  'south-america': { label: 'América do Sul', lat: -16, lon: -60 },
  europe: { label: 'Europa', lat: 50, lon: 14 },
  africa: { label: 'África', lat: 3, lon: 20 },
  asia: { label: 'Ásia', lat: 34, lon: 92 },
  oceania: { label: 'Oceania', lat: -26, lon: 140 },
  antarctica: { label: 'Antártida', lat: -78, lon: 20 },
};

export const REGIONS: Record<RegionId, string> = {
  amer: 'Américas',
  emea: 'Europa, Oriente Médio e África',
  apac: 'Ásia-Pacífico',
};
