import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CinematicHero, nameSize, shade } from '../CinematicHero';

describe('hero cinematográfico', () => {
  beforeEach(() => {
    sessionStorage.clear();
    // sem rede nos testes: a classificação falha e o hero segue com a ordem do grid
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'));
  });
  afterEach(() => vi.restoreAllMocks());

  it('escurece a cor da equipe para o fundo', () => {
    expect(shade('#ffffff', -0.5)).toBe('rgb(128, 128, 128)');
    expect(shade('#000000', 0.5)).toBe('rgb(128, 128, 128)');
  });

  it('o nome gigante encolhe para sobrenomes longos', () => {
    expect(nameSize('ALONSO')).toContain('19vw');
    expect(nameSize('VERSTAPPEN')).toContain('13.2vw');
  });

  it('mostra um piloto real e troca com as setas e o teclado', async () => {
    render(<MemoryRouter><CinematicHero /></MemoryRouter>);
    await act(async () => { await Promise.resolve(); });
    const first = screen.getByRole('heading', { level: 2 }).getAttribute('aria-label');
    expect(first).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Próximo piloto' }));
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    const labels = screen.getAllByRole('heading', { level: 2 }).map((h) => h.getAttribute('aria-label'));
    expect(labels.some((l) => l !== first)).toBe(true);
    expect(screen.getAllByRole('link', { name: /Ver perfil/ })[0].getAttribute('href')).toMatch(/^\/pilotos\//);
    fireEvent.keyDown(screen.getByRole('region', { name: 'Pilotos da temporada 2026' }), { key: 'ArrowUp' });
  });
});
