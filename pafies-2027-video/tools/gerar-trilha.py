#!/usr/bin/env python3
"""Trilha original e efeitos sonoros do vídeo PAFIES 2027.

Tudo é sintetizado aqui (NumPy/SciPy), sem amostras de terceiros, então a
música é original do projeto e livre para uso. Os tempos das cenas vêm de
roteiro.json, o mesmo arquivo que o Remotion lê.

Gera:
  public/audio/trilha.wav   música (o ducking sob a voz é feito no Remotion)
  public/audio/efeitos.wav  impactos, brilhos e subidas sincronizados às cenas
"""
import json
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

RAIZ = Path(__file__).resolve().parent.parent
SR = 44100
ROTEIRO = json.loads((RAIZ / "roteiro.json").read_text())
DUR = ROTEIRO["duracao"]
CENA = {c["id"]: c for c in ROTEIRO["cenas"]}
N = int(DUR * SR)
rng = np.random.default_rng(2027)

BPM = 120  # o "relógio" bate a cada meio segundo, como o número da contagem
BEAT = 60 / BPM
# Trailer em ré menor: drone em Ré e "braams" sobre Ré, Si bemol e Fá
BRAAMS = {"Dm": [26, 38, 45, 50], "Bb": [22, 34, 41, 46], "F": [29, 41, 48, 53]}


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def t_(n):
    return np.arange(n) / SR


def lowpass(x, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x)


def highpass(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)


def bandpass(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def put(buf, start, sig, gain=1.0, pan=0.0):
    i = int(start * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[0, i : i + len(sig)] += sig * gain * l * 1.414
    buf[1, i : i + len(sig)] += sig * gain * r * 1.414


def env(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def curva(pontos):
    """Envelope global por pontos (segundos, ganho)."""
    xs, ys = zip(*pontos)
    return np.interp(t_(N), xs, ys)


# ---------------------------------------------------------------- instrumentos
def brilho(dur=1.6):
    n = int(dur * SR)
    t = t_(n)
    s = np.zeros(n)
    for k, m in enumerate((86, 90, 93, 98, 102)):
        s += np.sin(2 * np.pi * hz(m) * t) * np.exp(-np.maximum(t - k * 0.06, 0) * 3) * (t > k * 0.06)
    return s * 0.25


def whoosh(dur=0.8):
    n = int(dur * SR)
    t = t_(n)
    s = bandpass(rng.standard_normal(n), 400, 5000)
    return s * np.sin(np.pi * t / dur) ** 2


def braam(notas, dur=3.2):
    """Metais graves de trailer: serras desafinadas com filtro que abre e fecha."""
    n = int(dur * SR)
    t = t_(n)
    s = np.zeros(n)
    for m in notas:
        for d in (-0.15, 0.0, 0.15):
            s += 2 * ((t * hz(m) * 2 ** (d / 12) + rng.uniform(0, 1)) % 1) - 1
    s /= len(notas) * 3
    # filtro varrendo em blocos: abre rápido, fecha devagar
    out = np.zeros(n)
    blocos = 60
    for b in range(blocos):
        a_, z = b * n // blocos, (b + 1) * n // blocos
        tb = a_ / SR
        corte = 180 + 2200 * np.exp(-tb * 1.6) * min(1, tb / 0.08)
        out[a_:z] = lowpass(s[a_:z], corte, 1)
    return np.tanh(out * 2.2) * env(n, 0.03, dur * 0.6)


def drone(notas, dur):
    n = int(dur * SR)
    t = t_(n)
    s = np.zeros(n)
    for m in notas:
        for d in (-0.06, 0.06):
            s += np.sin(2 * np.pi * hz(m) * 2 ** (d / 12) * t + rng.uniform(0, 6))
    lfo = 0.75 + 0.25 * np.sin(2 * np.pi * 0.11 * t)
    return s / (len(notas) * 2) * lfo * env(n, 2.0, 2.0)


def cordas(notas, dur):
    """Cordas agudas em trêmolo (brilho tenso)."""
    n = int(dur * SR)
    t = t_(n)
    s = np.zeros(n)
    for m in notas:
        for d in (-0.1, 0.0, 0.1):
            s += 2 * ((t * hz(m) * 2 ** (d / 12) + rng.uniform(0, 1)) % 1) - 1
    s = bandpass(s / (len(notas) * 3), 500, 4500)
    tremolo = 0.6 + 0.4 * np.sin(2 * np.pi * 9 * t)
    return s * tremolo * env(n, 1.2, 1.2)


def tique(agudo=True, dur=0.06):
    """Relógio: 'tic' agudo e 'tac' um pouco mais grave."""
    n = int(dur * SR)
    t = t_(n)
    f = 3200 if agudo else 2400
    return (np.sin(2 * np.pi * f * t) + bandpass(rng.standard_normal(n), 2000, 7000) * 0.6) * np.exp(-t * 120)


def tambor(dur=1.8):
    """Taiko/tambor de guerra: grave encorpado com ataque de pele."""
    n = int(dur * SR)
    t = t_(n)
    f = 55 * (1 + 1.5 * np.exp(-t * 25))
    corpo = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2)
    pele = lowpass(rng.standard_normal(n), 1200) * np.exp(-t * 35) * 0.6
    return np.tanh((corpo + pele) * 1.8)


def shepard(dur):
    """Subida infinita (tom de Shepard) para criar tensão antes do final."""
    n = int(dur * SR)
    t = t_(n)
    s = np.zeros(n)
    for k in range(6):
        oit = (k + t / dur) % 6
        f = 55 * 2 ** oit
        amp = np.sin(np.pi * oit / 6) ** 2
        s += np.sin(2 * np.pi * np.cumsum(f) / SR) * amp
    return s / 3 * (t / dur) ** 1.5


def reverb(x, dur=2.6, mix=0.32):
    """Reverberação de sala grande: convolução com ruído decaindo."""
    from scipy.signal import fftconvolve

    n = int(dur * SR)
    ir = rng.standard_normal(n) * np.exp(-t_(n) * 6.5 / dur)
    ir = lowpass(ir, 5000)
    ir /= np.sqrt(np.sum(ir**2))
    molhado = np.stack([fftconvolve(c, ir)[: len(c)] for c in x])
    return x * (1 - mix) + molhado * mix * 0.9


# ---------------------------------------------------------------- música
musica = np.zeros((2, N))
fim = DUR
cont_ini = CENA["contagem"]["inicio"]
aviso_ini, aviso_fim = CENA["aviso"]["inicio"], CENA["aviso"]["fim"]
final = CENA["encerramento"]["inicio"]
mc, ma = CENA["contagem"]["marcas"], CENA["aviso"]["marcas"]

# drone contínuo em Ré, com cordas tensas por cima no aviso
put(musica, 0, drone([26, 38, 45], fim), 0.55)
put(musica, aviso_ini, cordas([74, 77, 81], aviso_fim - aviso_ini + 1.5), 0.12, pan=0.2)
put(musica, final, cordas([74, 78, 81, 86], fim - final), 0.14, pan=-0.2)

# braams + tambores nas viradas de cartela (as mesmas marcas do Remotion)
golpes = [
    (cont_ini + mc["faltam"] + 4 * 0.5, "Dm", 0.9),  # o "86" trava
    (cont_ini + mc["data"], "Bb", 0.8),  # 22 de janeiro
    (aviso_ini, "Dm", 0.9),  # atenção
    (aviso_ini + ma["numero"], "F", 0.85),  # +50.000
    (aviso_ini + ma["toneladas"], "Bb", 0.7),  # e não toneladas
    (final, "Dm", 1.0),  # encerramento
]
for t, acorde, g in golpes:
    put(musica, t, braam(BRAAMS[acorde]), 0.5 * g)
    put(musica, t, tambor(), 0.55 * g)

# tambores em ostinato discreto durante o aviso (pulso de coração)
t = aviso_ini + 1.0
while t < aviso_fim - 2.2:
    put(musica, t, tambor(0.9), 0.16)
    put(musica, t + 0.32, tambor(0.7), 0.09)
    t += 1.0

# tensão antes do final e golpe derradeiro
put(musica, final - 2.2, shepard(2.2), 0.22)
put(musica, fim - 2.6, tambor(2.4), 0.7)
put(musica, fim - 2.6, braam(BRAAMS["Dm"], 2.6), 0.45)

musica = reverb(musica)
musica *= curva([(0, 0.0), (0.6, 1.0), (fim - 1.0, 1.0), (fim, 0.0)])

# ---------------------------------------------------------------- efeitos
fx = np.zeros((2, N))
# relógio durante a contagem; acelera junto com o número 90 → 86
t = cont_ini  # alinhado com o passo de 15 frames do número (Cena1Contagem)
k = 0
while t < aviso_ini - 0.3:
    put(fx, t, tique(k % 2 == 0), 0.22 if k % 2 == 0 else 0.16, pan=0.15)
    t += BEAT
    k += 1
# reflexos de lente e entradas de cartela
for t in (cont_ini + mc["faltam"] + 1.7, cont_ini + mc["data"] - 0.3, aviso_ini + ma["numero"] + 1.1,
          aviso_ini + ma["toneladas"] + 0.9, final):
    put(fx, t, brilho(1.6), 0.18, pan=-0.2)
for t in (cont_ini + mc["data"] - 0.5, aviso_ini - 0.5, aviso_ini + ma["numeroCorreto"] - 0.4,
          aviso_ini + ma["numero"] - 0.4, aviso_ini + ma["toneladas"] - 0.4):
    put(fx, t, whoosh(0.8), 0.1, pan=0.4)
put(fx, aviso_ini + ma["toneladas"] + 0.55, whoosh(0.5), 0.12, pan=-0.4)  # o risco

fx = reverb(fx, 1.8, 0.2)
fx *= curva([(0, 1), (fim - 0.4, 1), (fim, 0)])


def salvar(buf, nome, pico):
    buf = buf / (np.max(np.abs(buf)) + 1e-9) * pico
    out = RAIZ / "public" / "audio" / nome
    out.parent.mkdir(parents=True, exist_ok=True)
    wavfile.write(out, SR, (buf.T * 32767).astype(np.int16))
    print("gerado:", out.relative_to(RAIZ))


salvar(musica, "trilha.wav", 0.89)
salvar(fx, "efeitos.wav", 0.89)
