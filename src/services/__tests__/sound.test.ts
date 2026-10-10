import { isSoundOn, onSoundChange, playPassSound, setSoundOn } from '../sound';

describe('som das transições', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('vem ligado por padrão e lembra a escolha', () => {
    expect(isSoundOn()).toBe(true);
    setSoundOn(false);
    expect(isSoundOn()).toBe(false);
  });

  it('avisa quem está ouvindo a mudança', () => {
    const fn = vi.fn();
    const off = onSoundChange(fn);
    setSoundOn(false);
    expect(fn).toHaveBeenCalledWith(false);
    off();
  });

  it('toca só quando ligado', () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    setSoundOn(false);
    playPassSound();
    expect(play).not.toHaveBeenCalled();
    setSoundOn(true);
    playPassSound();
    expect(play).toHaveBeenCalledTimes(1);
  });
});
