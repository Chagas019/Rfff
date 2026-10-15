export type ContinentId = 'africa' | 'europe' | 'asia' | 'north-america' | 'south-america' | 'oceania' | 'antarctica';

export type RegionId = 'amer' | 'emea' | 'apac';

export interface City {
  id: string;
  name: string;
  country: string;
  continent: ContinentId;
  region: RegionId;
  lat: number;
  lon: number;
  /** Fuso horário IANA, usado para mostrar a hora local real. */
  timezone: string;
  /** Papel da cidade na estratégia (dado de demonstração). */
  role: string;
  /** Campanhas ativas (dado de demonstração). */
  campaigns: number;
  /** Taxa média de engajamento em % (dado de demonstração). */
  engagement: number;
}

export interface Route {
  id: string;
  from: string;
  to: string;
  /** Nome da rota exibido no mapa de conexões. */
  label: string;
  /** Alcance diário estimado, em milhares de pessoas (dado de demonstração). */
  reachK: number;
  kind: 'backbone' | 'research' | 'creative';
}

export interface NetworkDataset {
  /** `true` quando os dados são fictícios, para a interface avisar o visitante. */
  demo: boolean;
  source: string;
  cities: City[];
  routes: Route[];
}

export interface StatItem {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
}
