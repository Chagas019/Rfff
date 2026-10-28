#!/usr/bin/env python3
"""Trilha original do trailer "PAFIES 2027 — faltam 86 dias".

Tudo é sintetizado aqui (NumPy/SciPy): nenhuma amostra de terceiros, então a
música é do próprio projeto. Os impactos caem nos frames de src/tempos.json,
o mesmo arquivo que o Remotion usa para as animações.

Gera public/audio/trilha.wav (música + efeitos já mixados).
"""
import json
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

RAIZ = Path(__file__).resolve().parent.parent
TEMPOS = json.loads((RAIZ / "src" / "tempos.json").read_text())
FPS = TEMPOS["fps"]
DUR = TEMPOS["frames"] / FPS
M = {k: v / FPS for k, v in TEMPOS["marcas"].items()}
C = {k: (a / FPS, b / FPS) for k, (a, b) in TEMPOS["cenas"].items()}
SR = 44100
N = int(DUR * SR)
rng = np.random.default_rng(86)
BEAT = 0.5  # 120 BPM: um tempo = 15 frames


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def t_(n):
    return np.arange(n) / SR


def filtro(x, tipo, f, ordem=2):
    return sosfilt(butter(ordem, f, tipo, fs=SR, output="sos"), x)


def env(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def put(buf, inicio, sinal, ganho=1.0, pan=0.0):
    i = int(inicio * SR)
    if i >= N or i + len(sinal) <= 0:
        return
    if i < 0:
        sinal, i = sinal[-i:], 0
    sinal = sinal[: N - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[0, i : i + len(sinal)] += sinal * ganho * l * 1.414
    buf[1, i : i + len(sinal)] += sinal * ganho * r * 1.414


def curva(pontos):
    xs, ys = zip(*pontos)
    return np.interp(t_(N), xs, ys)


# ------------------------------------------------------------------ timbres
def serras(notas, dur, desafino=(-0.15, 0.0, 0.15)):
    n = int(dur * SR)
    t = t_(n)
    s = np.zeros(n)
    for m in notas:
        for d in desafino:
            s += 2 * ((t * hz(m) * 2 ** (d / 12) + rng.uniform(0, 1)) % 1) - 1
    return s / (len(notas) * len(desafino))


def braam(notas, dur=3.0):
    """Metais graves de trailer, com filtro que abre no ataque e fecha devagar."""
    s = serras(notas, dur)
    n = len(s)
    out = np.zeros(n)
    for b in range(60):
        a_, z = b * n // 60, (b + 1) * n // 60
        tb = a_ / SR
        out[a_:z] = filtro(s[a_:z], "low", 180 + 2400 * np.exp(-tb * 1.5) * min(1, tb / 0.06), 1)
    return np.tanh(out * 2.4) * env(n, 0.02, dur * 0.6)


def drone(notas, dur):
    n = int(dur * SR)
    t = t_(n)
    s = sum(np.sin(2 * np.pi * hz(m) * 2 ** (d / 12) * t + rng.uniform(0, 6)) for m in notas for d in (-0.06, 0.06))
    return s / (len(notas) * 2) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.13 * t)) * env(n, 1.5, 1.5)


def coral(notas, dur):
    """Pad de "vozes" (senos com vibrato) para a revelação."""
    n = int(dur * SR)
    t = t_(n)
    s = np.zeros(n)
    for m in notas:
        vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t + rng.uniform(0, 6))
        for h, a in ((1, 1), (2, 0.35), (3, 0.15)):
            s += np.sin(2 * np.pi * hz(m) * h * np.cumsum(vib) / SR) * a
    return s / (len(notas) * 1.5) * env(n, 0.6, 1.2)


def taiko(dur=1.6, f0=55):
    n = int(dur * SR)
    t = t_(n)
    f = f0 * (1 + 1.5 * np.exp(-t * 25))
    corpo = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.5)
    pele = filtro(rng.standard_normal(n), "low", 1200) * np.exp(-t * 35) * 0.6
    return np.tanh((corpo + pele) * 1.8)


def bumbo(dur=0.45):
    n = int(dur * SR)
    t = t_(n)
    f = 48 * (1 + 3 * np.exp(-t * 35))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8)


def caixa(dur=0.3):
    n = int(dur * SR)
    t = t_(n)
    return np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25) * 0.5 + filtro(rng.standard_normal(n), "band", [1500, 8000]) * np.exp(-t * 16)


def chimbal(dur=0.07):
    n = int(dur * SR)
    return filtro(rng.standard_normal(n), "high", 7000) * np.exp(-t_(n) * 60)


def baixo(m, dur):
    n = int(dur * SR)
    t = t_(n)
    s = np.sin(2 * np.pi * hz(m) * t) + 0.4 * np.sin(2 * np.pi * hz(m) * 2 * t)
    return np.tanh(s * 1.6) * env(n, 0.004, 0.05)


def sub_queda(dur=2.4):
    n = int(dur * SR)
    t = t_(n)
    f = 28 + 50 * np.exp(-t * 2.2)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.2)


def estalo(dur=0.25):
    n = int(dur * SR)
    return filtro(rng.standard_normal(n), "high", 1500) * np.exp(-t_(n) * 26)


def brilho(dur=1.8):
    n = int(dur * SR)
    t = t_(n)
    s = np.zeros(n)
    for k, m in enumerate((86, 90, 93, 98, 102)):
        d = k * 0.05
        s += np.sin(2 * np.pi * hz(m) * t) * np.exp(-np.maximum(t - d, 0) * 2.5) * (t > d)
    return s * 0.25


def subida(dur):
    """Ruído que cresce e abre o filtro (riser), cortado seco no impacto."""
    n = int(dur * SR)
    t = t_(n)
    ruido = rng.standard_normal(n)
    out = np.zeros(n)
    for b in range(40):
        a_, z = b * n // 40, (b + 1) * n // 40
        out[a_:z] = filtro(ruido[a_:z], "band", [200 + 3000 * (b / 40) ** 2, 12000], 1)
    return out * (t / dur) ** 2.5


def shepard(dur):
    n = int(dur * SR)
    t = t_(n)
    s = np.zeros(n)
    for k in range(6):
        oit = (k + 1.5 * t / dur) % 6
        amp = np.sin(np.pi * oit / 6) ** 2
        s += np.sin(2 * np.pi * np.cumsum(55 * 2**oit) / SR) * amp
    return s / 3 * (t / dur) ** 1.4


def whoosh(dur=0.7):
    n = int(dur * SR)
    t = t_(n)
    return filtro(rng.standard_normal(n), "band", [400, 6000]) * np.sin(np.pi * t / dur) ** 3


def reverb(x, dur=2.4, mix=0.28):
    n = int(dur * SR)
    ir = filtro(rng.standard_normal(n) * np.exp(-t_(n) * 6.5 / dur), "low", 6000)
    ir /= np.sqrt(np.sum(ir**2))
    molhado = np.stack([fftconvolve(c, ir)[: len(c)] for c in x])
    return x * (1 - mix) + molhado * mix


def golpe(buf, t, forca=1.0, acorde=(26, 38, 45, 50)):
    """Impacto completo: braam + taiko + sub despencando + estalo + brilho."""
    put(buf, t, braam(acorde), 0.5 * forca)
    put(buf, t, taiko(), 0.6 * forca)
    put(buf, t, sub_queda(), 0.8 * forca)
    put(buf, t, estalo(), 0.35 * forca)
    put(buf, t + 0.03, brilho(), 0.3 * forca, pan=0.2)


# ------------------------------------------------------------------ arranjo
mix = np.zeros((2, N))
ini_ener, fim_expec = C["energia"][0], C["expectativa"][1]
ini_corr, fim_corr = C["correcao"]

# Cena 1: escuro, grave ecoando, batimentos e subida até o 86
put(mix, 0.05, taiko(3.0, 40), 0.5)
put(mix, 0.05, drone([26, 38, 45], M["impacto86"] + 0.2), 0.45)
for t in (1.2, 1.9):
    put(mix, t, taiko(0.8, 48), 0.25)
put(mix, M["impacto86"] - 1.6, subida(1.6), 0.28)
put(mix, M["impacto86"] - 0.5, whoosh(0.5), 0.2)

# Cena 2: o golpe do 86
golpe(mix, M["impacto86"], 1.15)

# ostinato de ação: do 86 até o fim da cena 4 (baixo em colcheias, bateria, taikos)
progressao = [26, 26, 22, 24]  # Ré, Ré, Si♭, Dó (graves)
t = M["impacto86"] + BEAT * 2
k = 0
while t < fim_expec - 0.05:
    compasso = int((t - M["impacto86"]) / (BEAT * 4)) % 4
    tensao = 1.0 if t >= C["expectativa"][0] else 0.75
    put(mix, t, baixo(progressao[compasso] + 12, BEAT / 2 - 0.02), 0.28 * tensao)
    put(mix, t + BEAT / 2, baixo(progressao[compasso] + 12, BEAT / 2 - 0.02), 0.22 * tensao)
    if k % 2 == 0:
        put(mix, t, bumbo(), 0.5 * tensao)
    else:
        put(mix, t, caixa(), 0.2 * tensao, pan=-0.1)
    put(mix, t + BEAT / 2, chimbal(), 0.08, pan=0.4)
    if t >= C["expectativa"][0]:  # na cena 4, semicolcheias aceleram a sensação
        put(mix, t + BEAT / 4, chimbal(0.05), 0.06, pan=-0.4)
        put(mix, t + 3 * BEAT / 4, chimbal(0.05), 0.06, pan=-0.4)
    if k % 4 == 3:
        put(mix, t, taiko(1.0, 70), 0.3, pan=0.3)
    t += BEAT
    k += 1

# Cena 3: um impacto por frase
for chave in ("palavra1", "palavra2", "palavra3"):
    put(mix, M[chave] - 0.35, whoosh(0.4), 0.18, pan=0.3)
    put(mix, M[chave], taiko(1.2, 62), 0.55)
    put(mix, M[chave], braam([38, 45, 50], 1.2), 0.25)
    put(mix, M[chave] + 0.02, estalo(0.15), 0.25)

# Cena 4: túnel — Shepard subindo e o 86 voltando
put(mix, C["expectativa"][0], shepard(fim_expec - C["expectativa"][0]), 0.2)
golpe(mix, M["reaparece86"], 0.7, (22, 34, 41, 46))
put(mix, fim_expec - 1.2, subida(1.2), 0.3)

# Cena da correção: a música abre espaço (pad tenso e pulso leve) para a leitura
golpe(mix, ini_corr, 0.6)
put(mix, ini_corr, drone([26, 33, 38, 45], fim_corr - ini_corr + 1.0), 0.4)
put(mix, ini_corr + 0.2, serras([62, 65, 69], fim_corr - ini_corr) * 0.4, 0.15)
t = ini_corr + 0.5
while t < fim_corr - 0.6:
    put(mix, t, taiko(0.7, 45), 0.18)
    t += 1.0
put(mix, M["quilos"], taiko(1.2, 58), 0.6)
put(mix, M["quilos"], brilho(1.5), 0.25)
put(mix, M["toneladas"] + 0.4, whoosh(0.45), 0.22, pan=-0.4)  # o risco

# Revelação: subida, golpe final em Ré maior e coral até o fim
put(mix, M["revelacao"] - 1.6, shepard(1.6), 0.25)
put(mix, M["revelacao"] - 1.6, subida(1.6), 0.3)
golpe(mix, M["revelacao"], 1.2, (26, 38, 45, 50, 54))
put(mix, M["revelacao"], coral([62, 66, 69, 74], DUR - M["revelacao"]), 0.22)
put(mix, M["revelacao"], drone([26, 38, 45], DUR - M["revelacao"] + 1.5), 0.4)
put(mix, M["assinatura"], brilho(2.0), 0.25, pan=-0.2)

mix = reverb(mix)
mix *= curva([(0, 0.0), (0.05, 1.0), (DUR - 0.5, 1.0), (DUR, 0.0)])
mix = np.tanh(mix / (np.max(np.abs(mix)) + 1e-9) * 1.6) * 0.85  # compressão suave
saida = RAIZ / "public" / "audio" / "trilha.wav"
saida.parent.mkdir(parents=True, exist_ok=True)
wavfile.write(saida, SR, (mix.T * 32767).astype(np.int16))
print("gerado:", saida.relative_to(RAIZ))
