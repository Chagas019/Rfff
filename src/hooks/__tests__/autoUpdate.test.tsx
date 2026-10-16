import { act, render, screen } from '@testing-library/react';
import { useAsync } from '../useAsync';
import { LiveBadge } from '../../components/LiveBadge';

function Probe({ fn }: { fn: () => Promise<number> }) {
  const { state, updatedAt } = useAsync(() => fn(), [], { refreshMs: 1000 });
  return <p>{state.status === 'success' ? `valor ${state.data}` : state.status}{updatedAt ? ' ok' : ''}</p>;
}

describe('atualização automática', () => {
  afterEach(() => vi.useRealTimers());

  it('busca dados novos sozinho sem voltar ao estado de carregamento', async () => {
    vi.useFakeTimers();
    let n = 0;
    const fn = vi.fn(() => Promise.resolve(++n));
    render(<Probe fn={fn} />);
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByText('valor 1 ok')).toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(1000); await Promise.resolve(); await Promise.resolve(); });
    expect(screen.getByText('valor 2 ok')).toBeInTheDocument();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('mantém os dados na tela se uma atualização falhar', async () => {
    vi.useFakeTimers();
    const fn = vi.fn().mockResolvedValueOnce(7).mockRejectedValue(new Error('offline'));
    render(<Probe fn={fn} />);
    await act(async () => { await Promise.resolve(); });
    await act(async () => { vi.advanceTimersByTime(1000); await Promise.resolve(); await Promise.resolve(); });
    expect(screen.getByText('valor 7 ok')).toBeInTheDocument();
  });

  it('o selo mostra há quanto tempo os dados foram atualizados', () => {
    const onRefresh = vi.fn();
    render(<LiveBadge updatedAt={new Date(Date.now() - 5 * 60_000)} onRefresh={onRefresh} />);
    expect(screen.getByText(/há 5 min/)).toBeInTheDocument();
    screen.getByRole('button', { name: 'Atualizar agora' }).click();
    expect(onRefresh).toHaveBeenCalled();
  });
});
