import { useCallback, useState } from 'react';
import { readStorage, writeStorage } from '../services/storage';

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readStorage(key, initial));
  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        writeStorage(key, v);
        return v;
      });
    },
    [key],
  );
  return [value, update] as const;
}
