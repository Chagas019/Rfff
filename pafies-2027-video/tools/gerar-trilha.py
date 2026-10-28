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

BPM = 96
BEAT = 60 / BPM
# I–V–vi–IV em ré maior: esperança e celebração
ACORDES = [
    [50, 57, 62, 66, 69],  # D
    [45, 57, 61, 64, 69],  # A
    [47, 54, 59, 62, 66],  # Bm
    [43, 55, 59, 62, 67],  # G
]


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
def pad(freqs, dur, brilho=1800):
    n = int(dur * SR)
    t = t_(n)
    s = np.zeros(n)
    for f in freqs:
        for d in (-0.08, 0.0, 0.08):
            ff = f * 2 ** (d / 12)
            ph = rng.uniform(0, 1)
            s += 2 * ((t * ff + ph) % 1) - 1  # serra
    s = lowpass(s / (len(freqs) * 3), brilho)
    return s * env(n, min(1.2, dur / 3), min(1.0, dur / 3))


def piano(f, dur=2.6):
    n = int(dur * SR)
    t = t_(n)
    s = sum(np.sin(2 * np.pi * f * k * t) * a * np.exp(-t * (1.6 + k * 1.1))
            for k, a in ((1, 1.0), (2, 0.45), (3, 0.2), (4, 0.1)))
    s += 0.25 * np.sin(2 * np.pi * f * 1.003 * t) * np.exp(-t * 2.0)
    return s * env(n, 0.004, 0.3)


def tom(f0=70, dur=0.9):
    n = int(dur * SR)
    t = t_(n)
    f = f0 * (1 + 1.2 * np.exp(-t * 18))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4.5)
    s += lowpass(rng.standard_normal(n), 900) * np.exp(-t * 30) * 0.5
    return s


def kick(dur=0.5):
    n = int(dur * SR)
    t = t_(n)
    f = 48 * (1 + 3 * np.exp(-t * 35))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)


def clap(dur=0.35):
    n = int(dur * SR)
    t = t_(n)
    return bandpass(rng.standard_normal(n), 900, 4000) * np.exp(-t * 16)


def hat(dur=0.08):
    n = int(dur * SR)
    return highpass(rng.standard_normal(n), 7000) * np.exp(-t_(n) * 60)


def impacto(dur=3.5):
    n = int(dur * SR)
    t = t_(n)
    f = 38 * (1 + 2.5 * np.exp(-t * 6))
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.2)
    ruido = lowpass(rng.standard_normal(n), 2500) * np.exp(-t * 5) * 0.6
    return np.tanh((sub + ruido) * 1.5)


def brilho(dur=1.6):
    n = int(dur * SR)
    t = t_(n)
    s = np.zeros(n)
    for k, m in enumerate((86, 90, 93, 98, 102)):
        s += np.sin(2 * np.pi * hz(m) * t) * np.exp(-np.maximum(t - k * 0.06, 0) * 3) * (t > k * 0.06)
    return s * 0.25


def subida(dur=2.5):
    n = int(dur * SR)
    t = t_(n)
    ruido = rng.standard_normal(n)
    out = np.zeros(n)
    passos = 40
    for i in range(passos):  # filtro que abre aos poucos
        a, b = i * n // passos, (i + 1) * n // passos
        f = 300 + 7000 * (i / passos) ** 2
        out[a:b] = lowpass(ruido[a:b], f, 1)
    return out * (t / dur) ** 2


def quique(dur=0.35):
    """Bola de basquete batendo no chão: grave curto com estalo de borracha."""
    n = int(dur * SR)
    t = t_(n)
    f = 95 * (1 + 0.8 * np.exp(-t * 40))
    corpo = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 18)
    estalo = bandpass(rng.standard_normal(n), 600, 2500) * np.exp(-t * 90) * 0.5
    return corpo + estalo


def raquetada(dur=0.12):
    """Bolinha de pingue-pongue na raquete: 'toc' curto e agudo."""
    n = int(dur * SR)
    t = t_(n)
    tom_ = np.sin(2 * np.pi * 1850 * t) * 0.6 + np.sin(2 * np.pi * 3100 * t) * 0.3
    return (tom_ + bandpass(rng.standard_normal(n), 2000, 6000) * 0.4) * np.exp(-t * 70)


def whoosh(dur=0.8):
    n = int(dur * SR)
    t = t_(n)
    s = bandpass(rng.standard_normal(n), 400, 5000)
    return s * np.sin(np.pi * t / dur) ** 2


# ---------------------------------------------------------------- música
musica = np.zeros((2, N))
fim = DUR

# pads em toda a música, progressão a cada 4 tempos
t0 = 0.0
i = 0
while t0 < fim:
    d = BEAT * 4
    put(musica, t0, pad([hz(m) for m in ACORDES[i % 4]], d + 0.6), 0.22, pan=-0.15)
    put(musica, t0, pad([hz(ACORDES[i % 4][0] - 12)], d + 0.6, 400), 0.35)
    t0 += d
    i += 1

# piano: suave na abertura, volta no momento de gratidão e no final
def arpejo(ini, fim_, vel=0.5, passo=BEAT / 2):
    t = ini
    k = 0
    while t < fim_:
        acorde = ACORDES[int(t / (BEAT * 4)) % 4]
        nota = acorde[[1, 2, 3, 4, 3, 2][k % 6]] + 12
        put(musica, t, piano(hz(nota)), vel, pan=0.3 if k % 2 else -0.3)
        t += passo
        k += 1


arpejo(0.6, CENA["gincana"]["inicio"], 0.32, BEAT)
arpejo(CENA["gincana"]["inicio"], CENA["contagem"]["inicio"], 0.22)
arpejo(CENA["aviso"]["inicio"] + 1, CENA["aviso"]["fim"], 0.14, BEAT)
arpejo(CENA["gratidao"]["inicio"], fim - 1.5, 0.3)

# pulsação e percussão crescendo
def bateria(ini, fim_, nivel):
    t = ini
    k = 0
    while t < fim_:
        if k % 2 == 0:
            put(musica, t, kick(), 0.55 * nivel)
        if k % 4 == 2:
            put(musica, t, clap(), 0.18 * nivel, pan=0.1)
        put(musica, t + BEAT / 2, hat(), 0.06 * nivel, pan=0.4)
        t += BEAT
        k += 1


bateria(CENA["gincana"]["inicio"], CENA["contagem"]["inicio"], 0.7)
bateria(CENA["contagem"]["inicio"], CENA["aviso"]["inicio"], 1.0)
bateria(CENA["gratidao"]["inicio"] + BEAT * 4, CENA["encerramento"]["inicio"], 0.6)
bateria(CENA["encerramento"]["inicio"], fim - 2.0, 1.0)

# tambores épicos na contagem regressiva
t = CENA["contagem"]["inicio"]
k = 0
while t < CENA["aviso"]["inicio"] - 0.2:
    for off, f, g in ((0, 70, 0.5), (BEAT * 0.75, 95, 0.32), (BEAT * 1.5, 82, 0.4)):
        put(musica, t + off, tom(f), g, pan=[-0.4, 0.4, 0][k % 3])
    t += BEAT * 2
    k += 1
t = CENA["encerramento"]["inicio"]
while t < fim - 2.2:
    put(musica, t, tom(65), 0.5, pan=-0.3)
    put(musica, t + BEAT, tom(90), 0.35, pan=0.3)
    t += BEAT * 2

# dinâmica geral: começa baixa, cresce, recua no aviso, emociona no fim
musica *= curva([
    (0, 0.0), (0.4, 0.35), (CENA["gincana"]["inicio"], 0.6),
    (CENA["contagem"]["inicio"], 0.85), (CENA["aviso"]["inicio"] - 0.2, 1.0),
    (CENA["aviso"]["inicio"] + 0.4, 0.45), (CENA["aviso"]["fim"] - 0.5, 0.45),
    (CENA["gratidao"]["inicio"], 0.7), (CENA["encerramento"]["inicio"], 0.95),
    (fim - 2.4, 1.0), (fim, 0.0),
])

# ---------------------------------------------------------------- efeitos
fx = np.zeros((2, N))
put(fx, 0.15, impacto(4.0), 0.55)  # grave suave da abertura
put(fx, 2.0, brilho(), 0.35, pan=0.3)
put(fx, CENA["gincana"]["inicio"] - 2.4, subida(2.4), 0.12)
put(fx, CENA["gincana"]["inicio"], impacto(), 0.7)
put(fx, CENA["gincana"]["inicio"] + 0.1, brilho(), 0.3, pan=-0.3)
put(fx, CENA["gincana"]["inicio"] + 4.2, whoosh(), 0.14, pan=0.5)
put(fx, CENA["contagem"]["inicio"] - 2.0, subida(2.0), 0.14)
put(fx, CENA["contagem"]["inicio"], impacto(), 0.75)
for k in range(3):  # um toque para cada dígito que entra
    put(fx, CENA["contagem"]["inicio"] + 0.5 + k * 0.35, tom(110 + k * 20, 0.5), 0.25)
put(fx, CENA["contagem"]["inicio"] + 4.2, whoosh(), 0.14, pan=-0.5)
put(fx, CENA["contagem"]["inicio"] + 4.5, impacto(2.5), 0.45)
put(fx, CENA["aviso"]["inicio"], impacto(2.2), 0.6)  # corte para o aviso
put(fx, CENA["aviso"]["inicio"] + 0.05, brilho(1.2), 0.25)
put(fx, CENA["gratidao"]["inicio"], whoosh(1.2), 0.12)
put(fx, CENA["encerramento"]["inicio"] - 1.8, subida(1.8), 0.16)
put(fx, CENA["encerramento"]["inicio"], impacto(4.5), 0.85)  # explosão de luz
put(fx, CENA["encerramento"]["inicio"] + 0.1, brilho(2.0), 0.4)
put(fx, fim - 2.3, impacto(2.3), 0.75)  # golpe final

# Esportes animados (src/componentes/Esportes.tsx): um toque por tempo da música.
def batidas(cena, marca, ate):
    t = CENA[cena]["inicio"] + CENA[cena]["marcas"][marca]
    while t < ate:
        yield t
        t += BEAT


lado = -1
for t in batidas("gincana", "rally", CENA["gincana"]["fim"] - 0.2):
    put(fx, t, raquetada(), 0.16, pan=0.5 * lado)  # alterna esquerda/direita
    lado = -lado
for t in batidas("contagem", "basquete", CENA["contagem"]["fim"] - 0.2):
    put(fx, t, quique(), 0.22, pan=-0.4)
for t in batidas("encerramento", "basquete", fim - 0.5):
    put(fx, t, quique(), 0.16, pan=-0.5)

fx *= curva([(0, 1), (fim - 0.4, 1), (fim, 0)])


def salvar(buf, nome, pico):
    buf = buf / (np.max(np.abs(buf)) + 1e-9) * pico
    out = RAIZ / "public" / "audio" / nome
    out.parent.mkdir(parents=True, exist_ok=True)
    wavfile.write(out, SR, (buf.T * 32767).astype(np.int16))
    print("gerado:", out.relative_to(RAIZ))


salvar(musica, "trilha.wav", 0.89)
salvar(fx, "efeitos.wav", 0.89)
