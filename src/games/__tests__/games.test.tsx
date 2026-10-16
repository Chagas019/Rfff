import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../../hooks/useToast';
import { buildQuiz, rateReaction, scoreAnswer } from '../quiz';
import { ReactionGame } from '../ReactionGame';
import { QuizGame } from '../QuizGame';

const wrap = (el: JSX.Element) => render(<MemoryRouter><ToastProvider>{el}</ToastProvider></MemoryRouter>);

describe('quiz gerado dos dados', () => {
  it('gera 10 perguntas únicas com 4 alternativas distintas e a resposta entre elas', () => {
    for (let run = 0; run < 20; run++) {
      const qs = buildQuiz(10);
      expect(qs).toHaveLength(10);
      expect(new Set(qs.map((q) => q.id)).size).toBe(10);
      for (const q of qs) {
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options).size).toBe(4);
        expect(q.options).toContain(q.answer);
      }
    }
  });

  it('pontua acertos com bônus de rapidez e sequência', () => {
    expect(scoreAnswer(false, 10000, 15000, 3)).toBe(0);
    expect(scoreAnswer(true, 15000, 15000, 0)).toBe(150);
    expect(scoreAnswer(true, 0, 15000, 2)).toBe(120);
  });

  it('o jogo do quiz começa e mostra a primeira pergunta', () => {
    wrap(<QuizGame />);
    fireEvent.click(screen.getByRole('button', { name: 'Começar quiz' }));
    expect(screen.getByText('Pergunta 1 de 10')).toBeInTheDocument();
  });
});

describe('luzes de largada', () => {
  afterEach(() => vi.useRealTimers());

  it('classifica o tempo de reação', () => {
    expect(rateReaction(180).tone).toBe('great');
    expect(rateReaction(400).tone).toBe('slow');
  });

  it('tocar antes das luzes apagarem é queima de largada', () => {
    vi.useFakeTimers();
    wrap(<ReactionGame />);
    const area = screen.getByRole('button', { name: /Área de largada/ });
    fireEvent.pointerDown(area);
    act(() => { vi.advanceTimersByTime(1000); });
    fireEvent.pointerDown(area);
    expect(screen.getByText(/Queimou a largada/)).toBeInTheDocument();
  });

  it('mede a reação depois que as luzes apagam e salva o recorde', () => {
    vi.useFakeTimers();
    wrap(<ReactionGame />);
    const area = screen.getByRole('button', { name: /Área de largada/ });
    fireEvent.pointerDown(area);
    act(() => { vi.advanceTimersByTime(10_000); });
    expect(screen.getByText('VAI!')).toBeInTheDocument();
    fireEvent.pointerDown(area);
    expect(localStorage.getItem('gridf1:game:reaction')).not.toBeNull();
  });
});
