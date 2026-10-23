"""Texturas próprias da Casa Octógono (pedra irregular, cascalho e chão de mata).

As demais texturas (madeiras, tecidos, mármore) vêm da Mansão Infinity.
Tudo é periódico (sem emendas): o Voronoi usa pontos replicados nos 8 vizinhos
do quadro e o ruído é filtrado por FFT.

Uso:  python3 tools/generate_textures.py public/textures [--only nome ...]
"""
from __future__ import annotations

import os
import sys

import numpy as np
from PIL import Image

OUT = next((a for a in sys.argv[1:] if not a.startswith("--")), "public/textures")
os.makedirs(OUT, exist_ok=True)


def fnoise(size: int, beta: float, seed: int) -> np.ndarray:
    r = np.random.default_rng(seed)
    f = np.fft.fft2(r.standard_normal((size, size)))
    k = np.sqrt((np.fft.fftfreq(size)[:, None] * size) ** 2 + (np.fft.fftfreq(size)[None, :] * size) ** 2)
    k[0, 0] = 1.0
    amp = 1.0 / k ** (beta / 2.0)
    amp[0, 0] = 0.0
    n = np.real(np.fft.ifft2(f * amp))
    n -= n.min()
    return n / (n.max() + 1e-9)


def normal_map(h: np.ndarray, strength: float) -> np.ndarray:
    dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5
    dy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 0.5
    nx = -dx * strength * h.shape[0] / 64
    ny = dy * strength * h.shape[0] / 64
    l = np.sqrt(nx**2 + ny**2 + 1)
    return (np.stack([nx / l, ny / l, 1 / l], -1) * 0.5 + 0.5).clip(0, 1)


def save(name: str, a: np.ndarray, quality: int = 86) -> None:
    a = (np.clip(a, 0, 1) * 255).astype(np.uint8)
    img = Image.fromarray(a, "L" if a.ndim == 2 else "RGB")
    path = os.path.join(OUT, name + ".webp")
    img.save(path, "WEBP", quality=quality, method=6)
    print("  ", path, img.size)


def voronoi(size: int, nx: int, ny: int, seed: int, jitter: float = 0.85, sx: float = 1.0):
    """Voronoi periódico em grade jitterizada. Retorna (d1, d2, id da célula).

    sx < 1 alarga as células na horizontal (pedras deitadas)."""
    r = np.random.default_rng(seed)
    gx, gy = np.meshgrid((np.arange(nx) + 0.5) / nx, (np.arange(ny) + 0.5) / ny)
    px = (gx + (r.random(gx.shape) - 0.5) * jitter / nx).ravel() % 1
    py = (gy + (r.random(gy.shape) - 0.5) * jitter / ny).ravel() % 1
    y, x = np.mgrid[0:size, 0:size].astype(np.float32) / size
    d1 = np.full((size, size), 9.0, np.float32)
    d2 = np.full((size, size), 9.0, np.float32)
    cid = np.zeros((size, size), np.int32)
    for i, (cx, cy) in enumerate(zip(px, py)):
        dx = np.abs(x - cx)
        dx = np.minimum(dx, 1 - dx) * sx
        dy = np.abs(y - cy)
        dy = np.minimum(dy, 1 - dy)
        d = np.sqrt(dx * dx + dy * dy)
        closer = d < d1
        d2 = np.where(closer, d1, np.minimum(d2, d))
        cid = np.where(closer, i, cid)
        d1 = np.where(closer, d, d1)
    return d1, d2, cid, len(px)


PALETTE = np.array(
    [
        (226, 210, 182),  # creme
        (204, 176, 136),  # areia
        (188, 140, 98),  # ferrugem
        (166, 154, 138),  # cinza quente
        (236, 224, 202),  # bege claro
        (158, 120, 86),  # marrom
        (214, 190, 156),  # caramelo claro
        (176, 166, 150),  # cinza
    ],
    float,
) / 255.0


def flagstone(size=1024, name="flagstone", nx=7, ny=11, sx=0.62, seed=301, mortar_w=0.0045, nstr=3.2, weights=(0.24, 0.2, 0.08, 0.1, 0.18, 0.05, 0.1, 0.05)):
    """Pedra natural irregular assentada (estilo pedra madeira/arenito), rejunte recuado."""
    d1, d2, cid, n = voronoi(size, nx, ny, seed, 0.9, sx)
    edge = d2 - d1
    r = np.random.default_rng(seed + 1)
    # maioria creme/areia, poucas ferrugem e cinza (como pedra madeira natural)
    pick = r.choice(len(PALETTE), n, p=list(weights))
    shade = 0.88 + 0.2 * r.random(n)
    base = PALETTE[pick][cid] * shade[cid][..., None]
    grain = fnoise(size, 1.2, seed + 2)
    mottle = fnoise(size, 2.6, seed + 3)
    streak = fnoise(size, 1.8, seed + 4)
    col = base * (0.78 + 0.32 * grain[..., None]) * (0.9 + 0.2 * mottle[..., None])
    # manchas de oxidação e líquen discretos
    rust = np.clip((streak - 0.62) * 3, 0, 1)
    col = col * (1 - 0.25 * rust[..., None]) + np.array([0.55, 0.36, 0.22]) * 0.25 * rust[..., None]
    # relevo: cada pedra abaulada, bordas quebradas
    bulge = np.sqrt(np.clip(edge / 0.04, 0, 1))
    chip = fnoise(size, 1.6, seed + 5)
    h = 0.55 * bulge + 0.25 * chip + 0.2 * grain
    mortar = np.clip(1 - (edge - mortar_w * (0.7 + 0.8 * chip)) / 0.0025, 0, 1)
    h = h * (1 - mortar) - 0.25 * mortar
    mortar_col = np.array([0.72, 0.68, 0.61]) * (0.75 + 0.25 * grain[..., None])
    # sombra de contato no rejunte (AO pintado leve)
    ao = np.clip(edge / 0.012, 0, 1) ** 0.5
    col = col * (0.72 + 0.28 * ao[..., None])
    col = col * (1 - mortar[..., None]) + mortar_col * mortar[..., None] * 0.8
    rough = np.clip(0.78 + 0.18 * chip - 0.1 * bulge + 0.1 * mortar, 0, 1)
    save(name + "_color", col)
    save(name + "_normal", normal_map(h, nstr), 90)
    save(name + "_rough", rough)


def gravel(size=1024, seed=331):
    """Cascalho claro (pedrisco) dos caminhos."""
    d1, d2, cid, n = voronoi(size, 90, 90, seed, 1.0)
    edge = d2 - d1
    r = np.random.default_rng(seed + 1)
    tone = r.random(n)
    base = np.array([0.74, 0.69, 0.6])[None, None, :] * (0.7 + 0.45 * tone[cid])[..., None]
    warm = (r.random(n) > 0.7)[cid]
    base[warm] *= np.array([1.05, 0.95, 0.85])
    fine = fnoise(size, 0.8, seed + 2)
    pebble = np.sqrt(np.clip(edge / 0.004, 0, 1))
    col = base * (0.55 + 0.45 * pebble[..., None]) * (0.9 + 0.15 * fine[..., None])
    h = pebble + 0.2 * fine
    save("gravel_color", col)
    save("gravel_normal", normal_map(h, 5.0), 90)
    save("gravel_rough", np.clip(0.85 + 0.1 * fine, 0, 1))


def forest_floor(size=1024, seed=351):
    """Chão de mata: folhas secas, terra e vegetação rasteira."""
    big = fnoise(size, 2.8, seed)
    mid = fnoise(size, 1.6, seed + 1)
    d1, d2, cid, n = voronoi(size, 60, 60, seed + 2, 1.0, 0.7)
    r = np.random.default_rng(seed + 3)
    leaf = r.random(n)[cid]
    leafmask = np.clip((d2 - d1) / 0.004, 0, 1)
    soil = np.array([0.24, 0.19, 0.13])
    green = np.array([0.22, 0.3, 0.14])
    litter = np.array([0.36, 0.27, 0.17])
    col = soil[None, None] * (0.8 + 0.4 * mid[..., None])
    g = np.clip((big - 0.45) * 3, 0, 1)[..., None]
    col = col * (1 - g) + green * (0.7 + 0.5 * mid[..., None]) * g
    lm = 0.75 * (leafmask * (leaf > 0.6))[..., None] * (1 - 0.6 * g)
    col = col * (1 - lm) + litter * (0.7 + 0.6 * leaf[..., None]) * lm
    h = 0.5 * mid + 0.5 * leafmask * (leaf > 0.45)
    save("forest_floor_color", col)
    save("forest_floor_normal", normal_map(h, 2.5), 90)
    save("forest_floor_rough", np.clip(0.9 + 0.08 * mid, 0, 1))


def flagstone_roof():
    """Laje de cobertura: pedras maiores, mais planas e de tom mais uniforme."""
    flagstone(1024, "flagstone_roof", 6, 6, 1.0, 311, 0.004, 2.4, (0.3, 0.22, 0.03, 0.12, 0.22, 0.01, 0.08, 0.02))


def main():
    flagstone()
    flagstone_roof()
    gravel()
    forest_floor()


if __name__ == "__main__":
    if "--only" in sys.argv:
        for nm in sys.argv[sys.argv.index("--only") + 1 :]:
            globals()[nm]()
    else:
        main()
