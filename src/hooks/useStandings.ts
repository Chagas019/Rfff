import { SEASON } from '../data/calendar2026';
import { LIVE_REFRESH_MS, fetchConstructorStandings, fetchDriverStandings, fetchPodiumHistory } from '../services/f1Api';
import { useAsync } from './useAsync';

/** Classificação de pilotos ao vivo (cache compartilhado entre os componentes). */
export const useDriverStandings = () => useAsync((s) => fetchDriverStandings(SEASON, s), [], { refreshMs: LIVE_REFRESH_MS });
export const useConstructorStandings = () => useAsync((s) => fetchConstructorStandings(SEASON, s), [], { refreshMs: LIVE_REFRESH_MS });
export const usePodiumHistory = () => useAsync((s) => fetchPodiumHistory(SEASON, s), [], { refreshMs: LIVE_REFRESH_MS });
