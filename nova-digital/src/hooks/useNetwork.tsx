import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEMO_NETWORK } from '../data/demoNetwork';
import type { City, NetworkDataset } from '../data/types';
import { indexCities, parseDataset } from '../lib/network';

interface NetworkContextValue extends NetworkDataset {
  byId: Map<string, City>;
  /** Mensagem quando a fonte configurada falhou e o site voltou para a demonstração. */
  warning: string | null;
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

/**
 * Fornece as cidades e rotas para todas as seções.
 * Se `VITE_NETWORK_URL` estiver definida, busca o JSON e valida; senão usa a demonstração.
 */
export function NetworkProvider({ children }: { children: ReactNode }) {
  const [dataset, setDataset] = useState<NetworkDataset>(DEMO_NETWORK);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    const url = import.meta.env.VITE_NETWORK_URL;
    if (!url) return;
    const ctrl = new AbortController();
    fetch(url, { signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<unknown>;
      })
      .then((json) => {
        const parsed = parseDataset(json, url);
        if (parsed) setDataset(parsed);
        else setWarning('A fonte de dados configurada é inválida. Exibindo dados de demonstração.');
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        console.warn('[network] Falha ao carregar', url, err);
        setWarning('Não foi possível carregar a fonte de dados. Exibindo dados de demonstração.');
      });
    return () => ctrl.abort();
  }, []);

  const value = useMemo<NetworkContextValue>(() => ({ ...dataset, byId: indexCities(dataset.cities), warning }), [dataset, warning]);

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork(): NetworkContextValue {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error('useNetwork precisa estar dentro de <NetworkProvider>');
  return ctx;
}
