import { findPhoto, type PhotoQuery } from '../services/carPhotos';
import { useAsync } from './useAsync';

export function useCarPhoto(key: string, query: PhotoQuery) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useAsync((signal) => findPhoto(key, query, signal), [key]);
}
