"""Síntese física de uma passagem de carro de F1 (V6 1.6 turbo híbrido, ~11.500 rpm).

Fonte: trem de pulsos de combustão (6 cilindros, variação por cilindro e jitter)
convoluído com a resposta do escapamento (ressonâncias amortecidas + ruído),
saturação, ruído mecânico modulado, assobio do turbo e do MGU-K.
Propagação: carro passando a ~290 km/h a 10 m do observador — Doppler real
(tempo de emissão), atenuação 1/r, absorção do ar (filtro passa-baixas que
varia com a distância e o ângulo), panorâmica, vento e eco da arquibancada.
"""
import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
DUR_SRC = 2.6          # segundos de sinal de fonte gerado
OUT_DUR = 1.7          # duração do efeito
T_PASS = 0.78          # instante em que o carro passa em frente
V = 80.0               # m/s (~290 km/h)
D = 10.0               # distância lateral (m)
C = 343.0              # velocidade do som
rng = np.random.default_rng(16)

n_src = int(SR * DUR_SRC)
t_src = np.arange(n_src) / SR

# ---------- motor ----------
# rotação subindo levemente (acelerando na reta) e uma troca de marcha antes da passagem
rpm = 11200 + 700 * (t_src / DUR_SRC)
shift_t = 0.55 + D / C  # (em tempo de fonte)
shift = (t_src > shift_t) & (t_src < shift_t + 0.06)
rpm = np.where(t_src >= shift_t, rpm - 1400 * np.exp(-(t_src - shift_t) / 0.18), rpm)
fire_rate = rpm / 60.0 * 3.0          # V6 quatro tempos: 3 explosões por volta
phase = np.cumsum(fire_rate) / SR
fires = np.nonzero(np.diff(np.floor(phase)) > 0)[0]

pulses = np.zeros(n_src)
cyl_gain = np.array([1.0, 0.58, 0.92, 0.5, 0.97, 0.66])   # desequilíbrio forte → ronco/aspereza
for k, i in enumerate(fires):
    j = min(n_src - 1, i + int(rng.normal(0, 1.4)))
    a = cyl_gain[k % 6] * (0.7 + 0.6 * rng.random())
    if shift[j]:
        a *= 0.15                       # corte de ignição na troca de marcha
    pulses[j] += a

# resposta do escapamento: ressonâncias amortecidas + rajada de ruído
L = int(0.012 * SR)
tt = np.arange(L) / SR
ir = np.zeros(L)
for f, q, g in [(310, 7, 1.0), (620, 9, 0.8), (980, 10, 0.55), (1450, 12, 0.45), (2300, 14, 0.3), (3400, 16, 0.18)]:
    ir += g * np.exp(-np.pi * f / q * tt) * np.sin(2 * np.pi * f * tt)
ir += 2.2 * rng.normal(0, 1, L) * np.exp(-tt / 0.0022)   # ruído de combustão
exhaust = signal.fftconvolve(pulses, ir)[:n_src]
exhaust /= np.max(np.abs(exhaust)) + 1e-9
exhaust = np.tanh(3.6 * exhaust)        # aspereza / saturação

# ruído mecânico modulado pela rotação + ronco grave (meia ordem)
mech = signal.lfilter(*signal.butter(2, [900 / (SR / 2), 6000 / (SR / 2)], 'band'), rng.normal(0, 1, n_src))
mech *= 0.5 + 0.5 * np.sin(2 * np.pi * phase)
growl = np.sin(2 * np.pi * phase / 6) * 0.35 + np.sin(2 * np.pi * phase / 3) * 0.25   # ordens do virabrequim (corpo grave)
turbo = 0.05 * np.sin(2 * np.pi * np.cumsum(7800 + 400 * (t_src / DUR_SRC)) / SR)
mguk = 0.04 * np.sin(2 * np.pi * np.cumsum(rpm / 60 * 7.5) / SR)
source = exhaust + 0.09 * mech / (np.std(mech) + 1e-9) + growl * 0.45 + turbo + mguk
source = signal.lfilter(*signal.butter(2, 45 / (SR / 2), 'high'), source)

# ---------- propagação ----------
n_out = int(SR * OUT_DUR)
t_out = np.arange(n_out) / SR
# tempo de emissão te: t = te + r(te)/c  (resolvido por iteração)
te = t_out.copy()
for _ in range(6):
    x = V * (te - T_PASS)
    r = np.sqrt(x * x + D * D)
    te = t_out - r / C
te += 0.6                               # desloca para dentro do sinal de fonte
x = V * (te - 0.6 - T_PASS)
r = np.sqrt(x * x + D * D)
src = np.interp(te, t_src, source)

# absorção do ar / diretividade: mistura entre versão brilhante e abafada
dark = signal.lfilter(*signal.butter(2, 1600 / (SR / 2)), src)
mid = signal.lfilter(*signal.butter(2, 4500 / (SR / 2)), src)
closeness = np.clip(D / r, 0, 1) ** 1.5
behind = 1 / (1 + np.exp(x / 8))      # 1 chegando, 0 indo embora (escape aponta para trás)
bright = closeness
sig = (bright * mid + (1 - bright) * dark)
sig = sig * (0.75 + 0.25 * (1 - behind))  # escape audível depois que passa
amp = (D / r) ** 1.1
sig *= amp

pan = np.clip(x / r, -1, 1)            # -1 esquerda … +1 direita
left = sig * np.sqrt((1 - pan) / 2)
right = sig * np.sqrt((1 + pan) / 2)

# vento / deslocamento de ar
wind = signal.lfilter(*signal.butter(2, [300 / (SR / 2), 2500 / (SR / 2)], 'band'), rng.normal(0, 1, n_out))
wind *= 0.25 * np.exp(-((t_out - T_PASS - D / C) / 0.09) ** 2)
left += wind * np.sqrt((1 - pan) / 2)
right += wind * np.sqrt((1 + pan) / 2)

# eco da arquibancada (reflexão + cauda curta)
def room(xs):
    d1 = int(0.085 * SR)
    out = xs.copy()
    out[d1:] += 0.22 * signal.lfilter(*signal.butter(2, 2500 / (SR / 2)), xs)[:-d1]
    tail_ir = rng.normal(0, 1, int(0.5 * SR)) * np.exp(-np.arange(int(0.5 * SR)) / (0.12 * SR))
    tail = signal.fftconvolve(xs, tail_ir)[: len(xs)]
    return out + 0.012 * tail
left, right = room(left), room(right)

st = np.stack([left, right], axis=1)
fade_in = np.minimum(1, t_out / 0.12)[:, None]
fade_out = np.minimum(1, (OUT_DUR - t_out) / 0.35)[:, None]
st *= fade_in * np.clip(fade_out, 0, 1)
st /= np.max(np.abs(st)) + 1e-9
st *= 0.89
wavfile.write(sys.argv[1], SR, (st * 32767).astype(np.int16))
print('ok', st.shape)
