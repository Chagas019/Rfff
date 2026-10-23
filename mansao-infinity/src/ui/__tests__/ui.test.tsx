import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useExperience } from '../../store/useExperience';
import { FloorPlan } from '../FloorPlan';
import { RoomInfoPanel } from '../RoomInfoPanel';
import { EnvironmentSelector } from '../EnvironmentSelector';
import { OPERABLE_IDS } from '../../data/plan';

const initial = useExperience.getState();

beforeEach(() => {
  act(() => useExperience.setState({ ...initial, started: true, mode: 'exterior', selectedRoom: null, cutLevel: null, doors: {} }, true));
});

describe('estado da experiência', () => {
  it('focar um cômodo abre o corte do pavimento e pede um enquadramento', () => {
    act(() => useExperience.getState().focusRoom('master'));
    const s = useExperience.getState();
    expect(s.selectedRoom).toBe('master');
    expect(s.mode).toBe('interior');
    expect(s.cutLevel).toBe(1);
    expect(s.shot?.position[1]).toBeGreaterThan(4);
  });

  it('abre e fecha todas as esquadrias', () => {
    act(() => useExperience.getState().setAllDoors(true));
    expect(OPERABLE_IDS.every((id) => useExperience.getState().doors[id])).toBe(true);
    expect(OPERABLE_IDS).toContain('garageDoor');
    expect(OPERABLE_IDS).toContain('streetGate');
  });

  it('caminhar num cômodo posiciona no pavimento certo', () => {
    act(() => useExperience.getState().walkInto('bed4'));
    const s = useExperience.getState();
    expect(s.mode).toBe('walk');
    expect(s.walkSpawn?.level).toBe(1);
  });
});

describe('planta baixa', () => {
  it('lista os cômodos do pavimento como botões acessíveis e leva a câmera ao clicar', () => {
    render(<FloorPlan level={0} />);
    const kitchen = screen.getByRole('button', { name: /Cozinha gourmet, 84 m²/ });
    fireEvent.click(kitchen);
    expect(useExperience.getState().selectedRoom).toBe('kitchen');
    expect(screen.queryByRole('button', { name: /Suíte master/ })).toBeNull();
  });

  it('teclado (Enter) também seleciona', () => {
    render(<FloorPlan level={1} />);
    fireEvent.keyDown(screen.getByRole('button', { name: /Suíte master/ }), { key: 'Enter' });
    expect(useExperience.getState().selectedRoom).toBe('master');
  });
});

describe('painéis', () => {
  it('ficha do cômodo mostra área, medidas e alterna a luz', () => {
    act(() => useExperience.getState().selectRoom('living'));
    render(<RoomInfoPanel />);
    expect(screen.getByRole('heading', { name: 'Sala de estar' })).toBeInTheDocument();
    expect(screen.getByText('160 m²')).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /Luz acesa/ });
    fireEvent.click(btn);
    expect(useExperience.getState().lights.living).toBe(false);
  });

  it('seletor de horário troca dia/pôr do sol/noite', () => {
    render(<EnvironmentSelector />);
    fireEvent.click(screen.getByRole('radio', { name: 'Noite' }));
    expect(useExperience.getState().time).toBe('night');
    expect(screen.getByRole('radio', { name: 'Noite' })).toHaveAttribute('aria-checked', 'true');
  });
});
