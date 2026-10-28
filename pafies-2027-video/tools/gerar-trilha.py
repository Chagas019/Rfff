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

BPM = 120  # o mesmo tempo de TEMPO_BATIDA em src/componentes/Esportes.tsx
BEAT = 60 / BPM
# Hino eletrônico esportivo em mi menor: i–VI–III–VII (Em–C–G–D), energia de torcida
ACORDES = [
    [40, 52, 55, 59, 64],  # Em
    [36, 52, 55, 60, 64],  # C
    [43, 55, 59, 62, 67],  # G
    [38, 54, 57, 62, 66],  # D
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


def supersaw(freqs, dur, corte=3500):
    """Acorde largo de serras desafinadas, com 'pump' (sidechain) a cada tempo."""
    n = int(dur * SR)
    t = t_(n)
    s = np.zeros(n)
    for f in freqs:
        for d in (-0.12, -0.05, 0.0, 0.05, 0.12):
            s += 2 * ((t * f * 2 ** (d / 12) + rng.uniform(0, 1)) % 1) - 1
    s = lowpass(s / (len(freqs) * 5), corte)
    bomba = 1 - 0.75 * np.exp(-((t % BEAT) / 0.09))
    return s * bomba * env(n, 0.01, 0.05)


def pluck(f, dur=0.22):
    n = int(dur * SR)
    t = t_(n)
    s = (2 * ((t * f) % 1) - 1) * 0.6 + np.sign(np.sin(2 * np.pi * f * t)) * 0.4
    return lowpass(s, 2600) * np.exp(-t * 16)


def baixo(f, dur):
    n = int(dur * SR)
    t = t_(n)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t)
    return np.tanh(s * 1.4) * env(n, 0.005, 0.04)


def caixa(dur=0.3):
    n = int(dur * SR)
    t = t_(n)
    corpo = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25)
    return corpo * 0.5 + bandpass(rng.standard_normal(n), 1500, 8000) * np.exp(-t * 18)


# ---------------------------------------------------------------- música
musica = np.zeros((2, N))
fim = DUR
aviso_ini, aviso_fim = CENA["aviso"]["inicio"], CENA["aviso"]["fim"]
final = CENA["encerramento"]["inicio"]
COMPASSO = BEAT * 4


def acorde_em(t):
    return ACORDES[int(t / COMPASSO) % 4]


# acordes largos: cheios na contagem e no final, abafados durante o aviso
t = 0.0
while t < fim:
    abafado = aviso_ini <= t < aviso_fim
    put(musica, t, supersaw([hz(m) for m in acorde_em(t)[1:]], COMPASSO + 0.05, 900 if abafado else 3800),
        0.22 if abafado else 0.3, pan=-0.1)
    t += COMPASSO

# arpejo em semicolcheias (o "motor" da trilha)
t = 0.0
k = 0
while t < fim - 0.6:
    acorde = acorde_em(t)
    nota = acorde[1:][[0, 1, 2, 3, 2, 1, 3, 2][k % 8]] + 12
    nivel = 0.07 if aviso_ini <= t < aviso_fim else 0.13
    put(musica, t, pluck(hz(nota)), nivel, pan=0.35 if k % 2 else -0.35)
    t += BEAT / 4
    k += 1

# baixo nos contratempos
t = BEAT / 2
while t < fim - 0.6:
    put(musica, t, baixo(hz(acorde_em(t)[0]), BEAT / 2 - 0.02), 0.32)
    t += BEAT

# bateria: bumbo 4x4, palmas e caixa no 2 e 4, chimbal aberto no contratempo
def bateria(ini, fim_, nivel, com_caixa=True):
    t = ini
    k = 0
    while t < fim_:
        put(musica, t, kick(), 0.7 * nivel)
        if k % 2 == 1:
            put(musica, t, clap(), 0.22 * nivel, pan=0.1)
            if com_caixa:
                put(musica, t, caixa(), 0.18 * nivel, pan=-0.1)
        put(musica, t + BEAT / 2, hat(0.14), 0.09 * nivel, pan=0.4)
        t += BEAT
        k += 1


bateria(BEAT * 4, aviso_ini, 1.0)
bateria(aviso_ini + COMPASSO, aviso_fim - COMPASSO, 0.45, com_caixa=False)
# virada de caixa acelerando antes do final
t = aviso_fim - COMPASSO
passo = BEAT / 2
while t < final - 0.05:
    put(musica, t, caixa(0.18), 0.12 + 0.2 * (t - (aviso_fim - COMPASSO)) / COMPASSO)
    t += passo
    passo = max(BEAT / 8, passo * 0.82)
bateria(final, fim - 1.2, 1.1)

# dinâmica geral
musica *= curva([
    (0, 0.0), (0.3, 0.7), (BEAT * 4, 1.0), (aviso_ini - 0.1, 1.0),
    (aviso_ini + 0.3, 0.6), (aviso_fim - COMPASSO, 0.6), (final, 1.0),
    (fim - 1.4, 1.0), (fim, 0.0),
])

# ---------------------------------------------------------------- efeitos
fx = np.zeros((2, N))
put(fx, 0.0, impacto(3.0), 0.7)  # abertura direto na contagem
put(fx, 0.05, brilho(), 0.3, pan=0.3)
data = CENA["contagem"]["marcas"]["data"]
provas = CENA["contagem"]["marcas"]["provas"]
put(fx, data - 0.8, whoosh(0.8), 0.14, pan=-0.5)
put(fx, data, impacto(2.2), 0.55)
put(fx, provas, brilho(1.2), 0.3, pan=-0.2)
put(fx, aviso_ini - 1.5, subida(1.5), 0.14)
put(fx, aviso_ini, impacto(2.2), 0.65)  # corte para o aviso
put(fx, aviso_ini + 0.05, brilho(1.2), 0.25)
put(fx, aviso_ini + CENA["aviso"]["marcas"]["numero"], impacto(1.8), 0.4)
put(fx, final - 1.8, subida(1.8), 0.16)
put(fx, final, impacto(3.5), 0.85)  # explosão de luz do encerramento
put(fx, final + 0.1, brilho(2.0), 0.4)
put(fx, fim - 1.3, impacto(1.3), 0.7)  # golpe final


# Esportes animados (src/componentes/Esportes.tsx): um toque por tempo da música.
def batidas(cena, marca, ate):
    t = CENA[cena]["inicio"] + CENA[cena]["marcas"][marca]
    while t < ate:
        yield t
        t += BEAT


for t in batidas("contagem", "basquete", CENA["contagem"]["fim"] - 0.2):
    put(fx, t, quique(), 0.2, pan=-0.4)
lado = -1
for t in batidas("encerramento", "rally", fim - 0.5):
    put(fx, t, raquetada(), 0.16, pan=0.5 * lado)  # alterna esquerda/direita
    lado = -lado

fx *= curva([(0, 1), (fim - 0.4, 1), (fim, 0)])


def salvar(buf, nome, pico):
    buf = buf / (np.max(np.abs(buf)) + 1e-9) * pico
    out = RAIZ / "public" / "audio" / nome
    out.parent.mkdir(parents=True, exist_ok=True)
    wavfile.write(out, SR, (buf.T * 32767).astype(np.int16))
    print("gerado:", out.relative_to(RAIZ))


salvar(musica, "trilha.wav", 0.89)
salvar(fx, "efeitos.wav", 0.89)
