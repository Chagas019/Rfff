"""Gera as texturas PBR procedurais da Mansão Infinity.

Todas as texturas são "tileáveis" (sem emendas) porque o ruído é filtrado no
domínio da frequência (FFT), que é periódico por construção. Cada material
recebe cor (albedo), mapa de normais e rugosidade quando faz sentido.

Uso:  python3 tools/generate_textures.py public/textures
"""
from __future__ import annotations

import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = next((a for a in sys.argv[1:] if not a.startswith("--")), "public/textures")
os.makedirs(OUT, exist_ok=True)


# ---------------------------------------------------------------- utilidades
def rng(seed: int) -> np.random.Generator:
    return np.random.default_rng(seed)


def fnoise(size: int, beta: float = 2.0, seed: int = 0, ax: float = 1.0, ay: float = 1.0, lo: float = 1.0) -> np.ndarray:
    """Ruído fractal periódico (0..1). ax/ay > 1 alongam o ruído no eixo oposto."""
    r = rng(seed)
    white = r.standard_normal((size, size))
    f = np.fft.fft2(white)
    ky = np.fft.fftfreq(size)[:, None] * size
    kx = np.fft.fftfreq(size)[None, :] * size
    k = np.sqrt((kx * ax) ** 2 + (ky * ay) ** 2)
    k[0, 0] = 1.0
    amp = 1.0 / np.maximum(k, lo) ** (beta / 2.0)
    amp[0, 0] = 0.0
    n = np.real(np.fft.ifft2(f * amp))
    n -= n.min()
    n /= n.max() + 1e-9
    return n


def band(size: int, kmin: float, kmax: float, seed: int) -> np.ndarray:
    """Ruído periódico limitado a uma faixa de frequências (0..1)."""
    r = rng(seed)
    f = np.fft.fft2(r.standard_normal((size, size)))
    ky = np.fft.fftfreq(size)[:, None] * size
    kx = np.fft.fftfreq(size)[None, :] * size
    k = np.sqrt(kx**2 + ky**2)
    mask = ((k >= kmin) & (k <= kmax)).astype(float)
    n = np.real(np.fft.ifft2(f * mask))
    n -= n.min()
    n /= n.max() + 1e-9
    return n


def normal_map(h: np.ndarray, strength: float = 2.0) -> np.ndarray:
    dx = (np.roll(h, -1, axis=1) - np.roll(h, 1, axis=1)) * 0.5
    dy = (np.roll(h, -1, axis=0) - np.roll(h, 1, axis=0)) * 0.5
    nx = -dx * strength * h.shape[0] / 64
    ny = dy * strength * h.shape[0] / 64
    nz = np.ones_like(h)
    l = np.sqrt(nx**2 + ny**2 + nz**2)
    n = np.stack([nx / l, ny / l, nz / l], axis=-1)
    return (n * 0.5 + 0.5).clip(0, 1)


def lerp(a, b, t):
    return a + (b - a) * t


def colorize(t: np.ndarray, c0, c1) -> np.ndarray:
    c0 = np.array(c0, dtype=float) / 255.0
    c1 = np.array(c1, dtype=float) / 255.0
    return c0[None, None, :] * (1 - t[..., None]) + c1[None, None, :] * t[..., None]


def save(name: str, arr: np.ndarray, quality: int = 86) -> None:
    a = np.clip(arr, 0, 1)
    if a.ndim == 2:
        img = Image.fromarray((a * 255).astype(np.uint8), "L")
    elif a.shape[2] == 4:
        img = Image.fromarray((a * 255).astype(np.uint8), "RGBA")
    else:
        img = Image.fromarray((a * 255).astype(np.uint8), "RGB")
    path = os.path.join(OUT, name + ".webp")
    img.save(path, "WEBP", quality=quality, method=6)
    print("  ", path, img.size)


def save_set(name: str, color: np.ndarray, height: np.ndarray | None, rough: np.ndarray | None, nstrength: float = 2.0) -> None:
    save(name + "_color", color)
    if height is not None:
        save(name + "_normal", normal_map(height, nstrength), quality=90)
    if rough is not None:
        save(name + "_rough", rough)


# ---------------------------------------------------------------- materiais
def concrete(size=1024):
    """Concreto aparente com marcas de fôrma (painéis 1,2 x 2,4 m) e furos de tirante."""
    big = fnoise(size, 2.6, 1)
    mid = fnoise(size, 1.6, 2)
    fine = fnoise(size, 0.6, 3)
    pores = (band(size, 180, 400, 4) > 0.78).astype(float)
    tone = 0.55 * big + 0.3 * mid + 0.15 * fine
    h = 0.6 * mid + 0.4 * fine - 0.5 * pores
    y, x = np.mgrid[0:size, 0:size] / size
    # juntas dos painéis (2 colunas x 1 linha de painéis por tile)
    joint = np.zeros((size, size))
    for jx in (0.0, 0.5):
        joint += np.exp(-(((x - jx + 0.5) % 1 - 0.5) / 0.0016) ** 2)
    joint += np.exp(-(((y + 0.5) % 1 - 0.5) / 0.0016) ** 2)
    joint = joint.clip(0, 1)
    holes = np.zeros((size, size))
    for cx in (0.125, 0.375, 0.625, 0.875):
        for cy in (0.18, 0.5, 0.82):
            d = np.sqrt(((x - cx + 0.5) % 1 - 0.5) ** 2 + ((y - cy + 0.5) % 1 - 0.5) ** 2)
            holes += np.exp(-(d / 0.006) ** 2)
    holes = holes.clip(0, 1)
    col = colorize(tone, (128, 126, 121), (176, 173, 166))
    col *= (1 - 0.18 * joint - 0.45 * holes - 0.25 * pores)[..., None]
    h = h - 0.6 * joint - 1.2 * holes
    rough = (0.78 + 0.12 * fine - 0.1 * big).clip(0, 1)
    save_set("concrete", col, h, rough, 1.6)


def polished_concrete(size=1024):
    big = fnoise(size, 2.8, 11)
    mid = fnoise(size, 1.8, 12)
    speck = (band(size, 200, 500, 13) > 0.8).astype(float)
    y, x = np.mgrid[0:size, 0:size] / size
    cut = np.exp(-(((x + 0.5) % 0.5 - 0.25) / 0.0015) ** 2 * 0) * 0  # sem cortes no tile
    joint = np.exp(-((((x) % 1.0) - 0.0) / 0.0018) ** 2) + np.exp(-((((y) % 1.0) - 0.0) / 0.0018) ** 2)
    joint = joint.clip(0, 1) + cut
    tone = 0.6 * big + 0.4 * mid
    col = colorize(tone, (150, 150, 148), (196, 195, 190))
    col *= (1 - 0.1 * speck - 0.3 * joint)[..., None]
    h = 0.3 * mid - 0.8 * joint
    rough = (0.32 + 0.18 * big).clip(0, 1)
    save_set("polished_concrete", col, h, rough, 0.8)


def travertine(size=1024):
    """Revestimento em placas de travertino 50 x 100 cm, juntas finas (tile = 2 x 2 m)."""
    r = rng(21)
    y, x = np.mgrid[0:size, 0:size] / size
    col = np.zeros((size, size, 3))
    h = np.zeros((size, size))
    rows = [0.0, 0.25, 0.5, 0.75, 1.0]
    pores = fnoise(size, 1.2, 22, ax=5.0, ay=1.0)
    streak = fnoise(size, 2.2, 23, ax=8.0, ay=1.0)
    band = fnoise(size, 2.8, 24, ax=12.0, ay=1.0)
    for i in range(len(rows) - 1):
        y0, y1 = rows[i], rows[i + 1]
        m_row = (y >= y0) & (y < y1)
        offs = r.uniform(0, 1)
        xs = (x + offs) % 1.0
        seg = (xs >= 0.5).astype(int)
        for sgi in range(2):
            m = m_row & (seg == sgi)
            t = r.uniform(0.0, 1.0)
            base = np.array(lerp(np.array([206, 190, 164]), np.array([230, 218, 196]), t)) / 255.0
            col[m] = base
        jy = np.minimum(np.abs(y - y0), np.abs(y - y1))
        jx = np.minimum(np.minimum(xs, np.abs(xs - 0.5)), 1 - xs)
        j = np.minimum(jy, jx)
        joint = np.exp(-(j / 0.0014) ** 2)
        col[m_row] *= (1 - 0.22 * joint[m_row])[..., None]
        h[m_row] -= joint[m_row]
    holes = (pores > 0.74).astype(float) * (pores - 0.74) * 3
    col *= (0.9 + 0.14 * streak)[..., None]
    col *= (0.95 + 0.08 * band)[..., None]
    col *= (1 - 0.3 * holes)[..., None]
    h += 0.25 * streak - holes
    rough = (0.62 + 0.25 * holes + 0.06 * streak).clip(0, 1)
    save_set("travertine", col, h, rough, 1.6)


def wood_grain(size, seed, planks_x, planks_y, c0, c1, ring_freq=18.0, name="wood"):
    """Madeira com veios: planks_x colunas (comprimento no eixo x) e planks_y linhas."""
    r = rng(seed)
    y, x = np.mgrid[0:size, 0:size] / size
    grain = fnoise(size, 3.2, seed + 1, ax=6.0, ay=1.0)
    fine = fnoise(size, 1.0, seed + 2, ax=10.0, ay=1.0)
    col = np.zeros((size, size, 3))
    h = np.zeros((size, size))
    rough = np.zeros((size, size))
    ph = 1.0 / planks_y
    for j in range(planks_y):
        offs = r.uniform(0, 1)
        y0, y1 = j * ph, (j + 1) * ph
        m_row = (y >= y0) & (y < y1)
        xs = (x + offs) % 1.0
        pw = 1.0 / planks_x
        idx = np.floor(xs / pw).astype(int)
        for i in range(planks_x):
            m = m_row & (idx == i)
            if not m.any():
                continue
            shift = r.integers(0, size)
            g = np.roll(grain, shift, axis=0)
            rings = 0.5 + 0.5 * np.sin(2 * math.pi * (ring_freq * 0.9 * y + 1.4 * g + r.uniform(0, 1)))
            rings = rings**2.2
            t = r.uniform(0, 1)
            tone = 0.55 * rings + 0.3 * np.roll(fine, shift, axis=0) + 0.15 * t
            c = colorize(tone, c0, c1)
            c *= r.uniform(0.86, 1.08)
            col[m] = c[m]
            h[m] = (0.5 * rings + 0.5 * np.roll(fine, shift, axis=0))[m] * 0.4
            rough[m] = (0.5 + 0.2 * rings)[m]
        jy = np.minimum(np.abs(y - y0), np.abs(y - y1))
        ends = np.minimum(xs % pw, pw - xs % pw)
        j_ = np.minimum(jy, ends)
        joint = np.exp(-(j_ / 0.0016) ** 2)
        col[m_row] *= (1 - 0.3 * joint[m_row])[..., None]
        h[m_row] -= joint[m_row]
    save_set(name, col, h, rough.clip(0, 1), 1.2)


def plain_wood(size, seed, c0, c1, name, freq=10.0):
    """Lâmina de madeira contínua (painéis, móveis): veio vertical sem juntas."""
    grain = fnoise(size, 3.0, seed, ax=1.0, ay=6.0)
    fine = fnoise(size, 0.8, seed + 1, ax=1.0, ay=12.0)
    xx = np.mgrid[0:size, 0:size][1] / size
    rings = (0.5 + 0.5 * np.sin(2 * math.pi * (freq * 2 * xx + 1.2 * grain))) ** 2.0
    tone = 0.7 * rings + 0.3 * fine
    col = colorize(tone, c0, c1)
    h = 0.4 * rings + 0.6 * fine
    rough = (0.45 + 0.2 * rings).clip(0, 1)
    save_set(name, col, h, rough, 0.6)


def marble(size, seed, base0, base1, vein, name, vein_w=0.05, freq=(2, 3)):
    y, x = np.mgrid[0:size, 0:size] / size
    turb = fnoise(size, 4.0, seed) + 0.08 * fnoise(size, 2.6, seed + 5)
    turb2 = fnoise(size, 3.6, seed + 1) + 0.06 * fnoise(size, 2.4, seed + 6)
    cloud = fnoise(size, 2.8, seed + 2)
    p = np.sin(2 * math.pi * (freq[0] * x + freq[1] * y) + 6.0 * turb)
    v1 = np.exp(-((p) / vein_w) ** 2) * (0.55 + 0.45 * fnoise(size, 3.0, seed + 7))
    p2 = np.sin(2 * math.pi * (3 * x - 1 * y) + 9.0 * turb2)
    v2 = np.exp(-((p2) / (vein_w * 0.4)) ** 2) * 0.45
    veins = np.clip(v1 + v2, 0, 1)
    veins = np.asarray(Image.fromarray((veins * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.0))) / 255.0
    base = colorize(cloud, base0, base1)
    vc = np.array(vein, dtype=float) / 255.0
    col = base * (1 - veins[..., None]) + vc[None, None, :] * veins[..., None]
    h = 0.05 * cloud - 0.1 * veins
    rough = (0.12 + 0.08 * veins + 0.05 * cloud).clip(0, 1)
    save_set(name, col, h, rough, 0.4)


def porcelain(size=1024):
    """Porcelanato 1,2 x 1,2 m (tile = 2 x 2 placas), acabamento acetinado."""
    y, x = np.mgrid[0:size, 0:size] / size
    cloud = fnoise(size, 2.6, 41)
    fine = fnoise(size, 0.9, 42)
    col = colorize(0.7 * cloud + 0.3 * fine, (206, 202, 195), (229, 226, 220))
    jd = np.minimum(np.minimum(x % 0.5, 0.5 - x % 0.5), np.minimum(y % 0.5, 0.5 - y % 0.5))
    joint = np.exp(-(jd / 0.0012) ** 2)
    col *= (1 - 0.25 * joint)[..., None]
    h = 0.05 * fine - joint
    rough = (0.28 + 0.1 * fine + 0.3 * joint).clip(0, 1)
    save_set("porcelain", col, h, rough, 0.8)


def grass(size=1024):
    big = fnoise(size, 2.8, 51)
    mid = fnoise(size, 1.8, 52)
    blades = fnoise(size, 0.4, 53, ax=1.0, ay=0.35)
    dry = (fnoise(size, 2.2, 54) > 0.8).astype(float)
    tone = 0.35 * big + 0.25 * mid + 0.4 * blades
    col = colorize(tone, (52, 78, 32), (108, 136, 60))
    # faixas de corte do gramado (2 por tile, transição suave)
    y_, x_ = np.mgrid[0:size, 0:size] / size
    stripe = np.tanh(np.sin(2 * math.pi * 2 * x_) * 6) * 0.5 + 0.5
    col *= (0.95 + 0.06 * stripe)[..., None]
    dcol = np.array([140, 132, 78]) / 255.0
    col = col * (1 - 0.35 * dry[..., None]) + dcol * 0.35 * dry[..., None]
    h = blades
    rough = np.full((size, size), 0.92)
    save_set("grass", col, h, rough, 2.5)


def pavers(size=1024, seed=61, name="pavers", c0=(170, 162, 148), c1=(206, 198, 184), rows=4, cols=2):
    """Placas de pedra natural com juntas (caminhos externos)."""
    r = rng(seed)
    y, x = np.mgrid[0:size, 0:size] / size
    stone = fnoise(size, 1.5, seed + 1)
    big = fnoise(size, 2.6, seed + 2)
    col = np.zeros((size, size, 3))
    h = np.zeros((size, size))
    rh = 1.0 / rows
    for j in range(rows):
        offs = 0.5 / cols if j % 2 else 0.0
        xs = (x + offs) % 1.0
        m_row = (y >= j * rh) & (y < (j + 1) * rh)
        cw = 1.0 / cols
        idx = np.floor(xs / cw).astype(int)
        for i in range(cols):
            m = m_row & (idx == i)
            t = r.uniform(0, 1)
            c = colorize(0.6 * stone + 0.4 * big, c0, c1) * lerp(0.85, 1.1, t)
            col[m] = c[m]
        jy = np.minimum(y - j * rh, (j + 1) * rh - y)
        jx = np.minimum(xs % cw, cw - xs % cw)
        jj = np.minimum(jy, jx)
        joint = np.exp(-(jj / 0.0035) ** 2)
        col[m_row] = col[m_row] * (1 - 0.45 * joint[m_row])[..., None]
        h[m_row] = (0.3 * stone)[m_row] - joint[m_row]
    rough = (0.75 + 0.15 * stone).clip(0, 1)
    save_set(name, col, h, rough, 2.0)


def pool_tiles(size=1024):
    """Pastilhas de vidro 2,5 cm (tile = 1 m)."""
    r = rng(71)
    n = 40
    y, x = np.mgrid[0:size, 0:size] / size
    ix = np.floor(x * n).astype(int)
    iy = np.floor(y * n).astype(int)
    tint = r.uniform(0, 1, (n, n))
    t = tint[iy % n, ix % n]
    col = colorize(t, (34, 120, 140), (88, 176, 186))
    fx = (x * n) % 1
    fy = (y * n) % 1
    jd = np.minimum(np.minimum(fx, 1 - fx), np.minimum(fy, 1 - fy))
    joint = np.exp(-(jd / 0.06) ** 2)
    col = col * (1 - joint[..., None]) + np.array([0.86, 0.88, 0.86]) * joint[..., None]
    h = -joint + 0.1 * (1 - np.abs(fx - 0.5) * 2) * (1 - np.abs(fy - 0.5) * 2)
    rough = (0.12 + 0.6 * joint).clip(0, 1)
    save_set("pool_tiles", col, h, rough, 1.4)


def fabric(size=512, name="linen", c0=(205, 198, 186), c1=(228, 222, 210), weave=96, seed=81):
    y, x = np.mgrid[0:size, 0:size] / size
    slub = fnoise(size, 1.2, seed, ax=0.1, ay=1.0)
    slub2 = fnoise(size, 1.2, seed + 1, ax=1.0, ay=0.1)
    wx = np.sin(2 * math.pi * weave * x)
    wy = np.sin(2 * math.pi * weave * y)
    checker = (np.sign(np.sin(math.pi * weave * x)) * np.sign(np.sin(math.pi * weave * y)))
    h = np.where(checker > 0, np.abs(wx), np.abs(wy)) * 0.6 + 0.2 * slub + 0.2 * slub2
    tone = 0.5 * h + 0.25 * slub + 0.25 * slub2
    col = colorize(tone, c0, c1)
    rough = np.full((size, size), 0.95)
    save_set(name, col, h, rough, 3.0)


def rug(size=1024):
    """Tapete de lã com fibras visíveis e borda."""
    fib = fnoise(size, 0.5, 91)
    fib2 = fnoise(size, 0.8, 92, ax=1.0, ay=0.3)
    big = fnoise(size, 2.4, 93)
    y, x = np.mgrid[0:size, 0:size] / size
    border = ((x < 0.04) | (x > 0.96) | (y < 0.04) | (y > 0.96)).astype(float)
    pattern = 0.5 + 0.5 * np.sin(2 * math.pi * 3 * (x + 0.15 * big)) * np.sin(2 * math.pi * 2 * (y + 0.1 * big))
    tone = 0.45 * fib + 0.25 * fib2 + 0.3 * pattern
    col = colorize(tone, (176, 164, 146), (214, 204, 186))
    col = col * (1 - border[..., None] * 0.45)
    h = 0.7 * fib + 0.3 * fib2
    save_set("rug", col, h, np.full((size, size), 0.98), 4.0)


def water_normal(size=512):
    h = 0.6 * fnoise(size, 2.4, 101, lo=3) + 0.4 * fnoise(size, 1.6, 102, lo=6)
    save("water_normal", normal_map(h, 3.5), quality=92)


def bark(size=512):
    """Tronco de palmeira: anéis horizontais com fibras."""
    y, x = np.mgrid[0:size, 0:size] / size
    fib = fnoise(size, 1.2, 111, ax=1.0, ay=0.08)
    ring = np.abs(np.sin(2 * math.pi * 12 * (y + 0.02 * fnoise(size, 2.0, 112)))) ** 3
    tone = 0.5 * fib + 0.5 * (1 - ring)
    col = colorize(tone, (92, 80, 66), (158, 142, 120))
    h = 0.6 * (1 - ring) + 0.4 * fib
    save_set("bark", col, h, np.full((size, size), 0.9), 3.0)


def leaves_atlas(size=1024):
    """Atlas 2x2 de cachos de folhas com transparência (cards de vegetação)."""
    r = rng(121)
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    half = size // 2
    palettes = [((48, 82, 30), (96, 140, 52)), ((40, 74, 34), (80, 120, 48)), ((60, 92, 36), (120, 150, 60)), ((36, 66, 28), (72, 108, 42))]
    for q in range(4):
        ox, oy = (q % 2) * half, (q // 2) * half
        c0, c1 = palettes[q]
        for _ in range(560):
            cx = ox + half / 2 + r.normal(0, half * 0.19)
            cy = oy + half / 2 + r.normal(0, half * 0.19)
            if not (ox + 20 < cx < ox + half - 20 and oy + 20 < cy < oy + half - 20):
                continue
            L = r.uniform(20, 38)
            W = L * r.uniform(0.35, 0.5)
            a = r.uniform(0, 2 * math.pi)
            t = r.uniform(0, 1)
            col = tuple(int(lerp(c0[k], c1[k], t)) for k in range(3)) + (255,)
            pts = []
            for k in range(14):
                s = k / 13
                w = math.sin(s * math.pi) * W / 2
                pts.append((s * L, w))
            pts += [(p[0], -p[1]) for p in reversed(pts)]
            ca, sa = math.cos(a), math.sin(a)
            poly = [(cx + px * ca - py * sa, cy + px * sa + py * ca) for px, py in pts]
            d.polygon(poly, fill=col)
            d.line([(cx, cy), (cx + L * ca, cy + L * sa)], fill=tuple(int(c * 0.7) for c in col[:3]) + (255,), width=1)
    img = img.filter(ImageFilter.SMOOTH)
    img.save(os.path.join(OUT, "leaves.webp"), "WEBP", quality=88, method=6)
    print("   leaves.webp")


def palm_frond(w=256, h=1024):
    """Folha de palmeira: ráquis central com folíolos pendentes (card RGBA)."""
    r = rng(131)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx = w / 2
    for i in range(110):
        s = i / 110
        y = 20 + s * (h - 40)
        length = (w * 0.48) * math.sin(math.pi * (0.1 + 0.9 * s)) * (1.0 - 0.25 * s)
        for side in (-1, 1):
            ang = math.radians(55 + r.uniform(-8, 8))
            ex = cx + side * length * math.sin(ang)
            ey = y + length * math.cos(ang) * 0.9
            t = r.uniform(0, 1)
            col = (int(lerp(52, 98, t)), int(lerp(92, 140, t)), int(lerp(34, 52, t)), 255)
            d.polygon([(cx, y - 2), (ex, ey), (cx, y + 4)], fill=col)
    d.line([(cx, 0), (cx, h)], fill=(120, 116, 70, 255), width=5)
    img.save(os.path.join(OUT, "palm_frond.webp"), "WEBP", quality=88, method=6)
    print("   palm_frond.webp")


def books(size=512):
    """Lombadas de livros para as estantes (tile = 1 prateleira de 1 m)."""
    r = rng(141)
    img = Image.new("RGB", (size, size), (40, 34, 28))
    d = ImageDraw.Draw(img)
    pal = [(120, 30, 34), (30, 52, 80), (200, 190, 170), (48, 70, 52), (180, 140, 80), (30, 30, 34), (150, 110, 70), (220, 216, 206), (90, 60, 90)]
    for row in range(4):
        y0 = row * size // 4
        x = 0
        while x < size:
            bw = int(r.uniform(6, 18))
            bh = int(r.uniform(0.62, 0.95) * size / 4)
            c = pal[r.integers(0, len(pal))]
            d.rectangle([x, y0 + size // 4 - bh, x + bw - 1, y0 + size // 4], fill=c)
            for k in range(2):
                yy = y0 + size // 4 - bh + int(r.uniform(0.1, 0.8) * bh)
                d.line([x + 1, yy, x + bw - 2, yy], fill=(212, 180, 110), width=1)
            x += bw + (int(r.uniform(4, 30)) if r.uniform() < 0.06 else 0)
    img.save(os.path.join(OUT, "books.webp"), "WEBP", quality=86)
    print("   books.webp")


def artworks(size=512):
    """Três obras abstratas (gerativas) para quadros."""
    for k, pal in enumerate([
        [(234, 228, 216), (40, 40, 44), (176, 120, 80), (120, 134, 128)],
        [(28, 32, 38), (196, 170, 120), (90, 110, 130), (230, 224, 210)],
        [(214, 206, 192), (150, 70, 50), (60, 70, 66), (226, 190, 120)],
    ]):
        r = rng(151 + k)
        img = Image.new("RGB", (size, size), pal[0])
        d = ImageDraw.Draw(img)
        for _ in range(9):
            c = pal[r.integers(1, len(pal))]
            x0, y0 = r.uniform(0, size * 0.8, 2)
            if r.uniform() < 0.5:
                rr = r.uniform(40, 160)
                d.ellipse([x0, y0, x0 + rr, y0 + rr], fill=c)
            else:
                d.rectangle([x0, y0, x0 + r.uniform(20, 200), y0 + r.uniform(10, 120)], fill=c)
        img = img.filter(ImageFilter.GaussianBlur(1.2))
        grain = (fnoise(size, 0.5, 160 + k) - 0.5) * 0.08
        a = np.asarray(img).astype(float) / 255.0 + grain[..., None]
        save(f"art_{k}", a)


def cloud(size=256):
    """Sprite de nuvem: vários "puffs" suaves sobre ruído (canal alfa)."""
    r = rng(181)
    y, x = (np.mgrid[0:size, 0:size] / size - 0.5) * 2
    a = np.zeros((size, size))
    for _ in range(14):
        cx, cy = r.normal(0, 0.28, 2)
        rad = r.uniform(0.22, 0.42)
        a = np.maximum(a, np.clip(1 - ((x - cx) ** 2 + (y - cy) ** 2) / rad**2, 0, 1) ** 1.6)
    n = band(size, 4, 40, 182)
    a = np.clip(a * (0.65 + 0.6 * n) * np.clip(1.2 - np.sqrt(x**2 + y**2), 0, 1), 0, 1)
    img = np.dstack([np.ones_like(a), np.ones_like(a), np.ones_like(a), a])
    save("cloud", img, quality=90)


def stone_dark(size=512):
    """Pedra escura (basalto/granito) para soleiras, bordas e churrasqueira."""
    a = fnoise(size, 1.0, 171)
    b = fnoise(size, 2.4, 172)
    speck = (band(size, 120, 256, 173) > 0.75).astype(float)
    col = colorize(0.6 * a + 0.4 * b, (40, 40, 42), (78, 78, 80))
    col = col * (1 - 0.3 * speck[..., None]) + 0.3 * speck[..., None] * 0.5
    save_set("stone_dark", col, a, (0.35 + 0.2 * b).clip(0, 1), 0.8)


def main():
    print("Gerando texturas em", OUT)
    concrete()
    polished_concrete()
    travertine()
    wood_grain(1024, 31, 3, 10, (138, 98, 62), (186, 140, 94), name="oak_floor")
    plain_wood(1024, 35, (70, 44, 28), (120, 80, 52), "walnut", freq=9)
    plain_wood(512, 37, (120, 80, 50), (170, 120, 76), "teak", freq=7)
    marble(1024, 45, (232, 230, 226), (246, 244, 240), (150, 146, 140), "marble_white", 0.06)
    marble(1024, 47, (18, 18, 20), (34, 33, 35), (200, 196, 190), "marble_black", 0.035, (1, 2))
    porcelain()
    grass()
    pavers()
    pavers(1024, 65, "driveway", (110, 108, 104), (150, 146, 140), rows=8, cols=4)
    pool_tiles()
    fabric(512, "linen", (205, 198, 186), (228, 222, 210), 96, 81)
    fabric(512, "boucle", (226, 220, 208), (244, 240, 232), 140, 85)
    fabric(512, "velvet_dark", (34, 34, 38), (56, 56, 62), 160, 87)
    rug()
    water_normal()
    bark()
    leaves_atlas()
    palm_frond()
    books()
    artworks()
    stone_dark()
    cloud()


if __name__ == "__main__":
    if "--only-leaves" in sys.argv:
        leaves_atlas()
    elif "--only" in sys.argv:
        for name in sys.argv[sys.argv.index("--only") + 1 :]:
            globals()[name]()
    else:
        main()
