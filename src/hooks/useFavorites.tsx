import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import type { FavoriteKind, Favorites } from '../types';
import { useLocalStorage } from './useLocalStorage';

const EMPTY: Favorites = { race: [], circuit: [], driver: [], team: [] };

interface FavoritesCtx {
  favorites: Favorites;
  isFavorite: (kind: FavoriteKind, id: string) => boolean;
  toggleFavorite: (kind: FavoriteKind, id: string) => boolean;
  clearFavorites: () => void;
  count: number;
}

const Ctx = createContext<FavoritesCtx | null>(null);

export function toggleInList(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [stored, setFavorites] = useLocalStorage<Favorites>('gridf1:favorites', EMPTY);
  const favorites = useMemo(() => ({ ...EMPTY, ...stored }), [stored]);

  const isFavorite = useCallback((kind: FavoriteKind, id: string) => favorites[kind].includes(id), [favorites]);
  const toggleFavorite = useCallback(
    (kind: FavoriteKind, id: string) => {
      const added = !favorites[kind].includes(id);
      setFavorites((prev) => ({ ...EMPTY, ...prev, [kind]: toggleInList({ ...EMPTY, ...prev }[kind], id) }));
      return added;
    },
    [favorites, setFavorites],
  );
  const clearFavorites = useCallback(() => setFavorites(EMPTY), [setFavorites]);
  const count = favorites.race.length + favorites.circuit.length + favorites.driver.length + favorites.team.length;

  const value = useMemo(() => ({ favorites, isFavorite, toggleFavorite, clearFavorites, count }), [favorites, isFavorite, toggleFavorite, clearFavorites, count]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFavorites() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useFavorites precisa estar dentro de FavoritesProvider');
  return ctx;
}
