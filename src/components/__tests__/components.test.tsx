import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { races } from '../../data/calendar2026';
import { FavoritesProvider, toggleInList } from '../../hooks/useFavorites';
import { ToastProvider } from '../../hooks/useToast';
import { FavoriteButton } from '../FavoriteButton';
import { RaceCountdown } from '../RaceCountdown';

const wrap = (ui: React.ReactNode) => render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><FavoritesProvider><ToastProvider>{ui}</ToastProvider></FavoritesProvider></MemoryRouter>);

describe('favoritos', () => {
  beforeEach(() => localStorage.clear());

  it('toggleInList adiciona e remove', () => {
    expect(toggleInList(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleInList(['a', 'b'], 'a')).toEqual(['b']);
  });

  it('o botão alterna o estado e salva no localStorage', () => {
    wrap(<FavoriteButton kind="driver" id="norris" label="Lando Norris" />);
    const btn = screen.getByRole('button', { name: /Adicionar aos favoritos: Lando Norris/ });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(JSON.parse(localStorage.getItem('gridf1:favorites')!).driver).toEqual(['norris']);
    fireEvent.click(btn);
    expect(JSON.parse(localStorage.getItem('gridf1:favorites')!).driver).toEqual([]);
  });
});

describe('RaceCountdown', () => {
  afterEach(() => vi.useRealTimers());
  const race = races.find((r) => r.id === 'united-states')!; // largada 25/10/2026 19:00 UTC

  it('mostra o tempo restante e atualiza a cada segundo', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-24T19:00:00Z'));
    wrap(<RaceCountdown race={race} />);
    expect(screen.getByRole('timer')).toHaveAccessibleName(/Faltam 1 dias, 0 horas, 0 minutos e 0 segundos/);
    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.getByRole('timer')).toHaveAccessibleName(/0 dias, 23 horas, 59 minutos e 55 segundos/);
  });

  it('não exibe valores negativos depois da corrida', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-12-01T00:00:00Z'));
    wrap(<RaceCountdown race={race} />);
    expect(screen.queryByRole('timer')).toBeNull();
    expect(screen.getByText('Corrida encerrada')).toBeInTheDocument();
  });
});
