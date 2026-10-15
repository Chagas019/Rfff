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
  /** Papel do nó na rede (dado de demonstração). */
  role: string;
  /** Quantidade de nós ativos (dado de demonstração). */
  nodes: number;
  /** Latência média em ms (dado de demonstração). */
  latencyMs: number;
}

export interface Route {
  id: string;
  from: string;
  to: string;
  /** Nome da rota exibido no mapa de conexões. */
  label: string;
  /** Capacidade em Gbps (dado de demonstração). */
  capacityGbps: number;
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
