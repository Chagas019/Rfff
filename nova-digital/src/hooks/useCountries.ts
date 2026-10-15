import { useEffect, useState } from 'react';
import { loadCountries, type CountryFeature } from '../lib/continents';

/** Fronteiras dos países, carregadas sob demanda (null enquanto carrega ou se falhar). */
export function useCountries(enabled = true): CountryFeature[] | null {
  const [countries, setCountries] = useState<CountryFeature[] | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    loadCountries()
      .then((c) => alive && setCountries(c))
      .catch((err) => console.warn('[geo] Não foi possível carregar as fronteiras:', err));
    return () => {
      alive = false;
    };
  }, [enabled]);
  return countries;
}
