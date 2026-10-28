#!/usr/bin/env python3
"""Recorta a bola de basquete metálica e as raquetes de pingue-pongue.

Uso: python3 tools/preparar-esportes.py <basquete.jpg> <raquetes.jpg>
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

SAIDA = Path(__file__).resolve().parent.parent / "public" / "imagens"
basquete_src, raquetes_src = sys.argv[1:3]

# Bola de basquete: a esfera ocupa o centro da arte (medido no arquivo de 1200 px).
img = Image.open(basquete_src).convert("RGB")
k = img.width / 1200
cx, cy, r = 600 * k, 598 * k, 352 * k
bola = img.crop((int(cx - r), int(cy - r), int(cx + r), int(cy + r))).resize((800, 800), Image.LANCZOS).convert("RGBA")
mask = Image.new("L", (3200, 3200), 0)
ImageDraw.Draw(mask).ellipse((6, 6, 3194, 3194), fill=255)
bola.putalpha(mask.resize((800, 800), Image.LANCZOS))
bola.save(SAIDA / "bola-basquete.png")

# Raquetes: fundo preto vira transparente (brilho → opacidade, cor desmultiplicada).
r_img = np.asarray(Image.open(raquetes_src).convert("RGB")).astype(float)
lum = r_img.max(-1)
alpha = np.clip((lum - 12) / 110, 0, 1)
cor = np.clip(r_img / np.maximum(alpha[..., None], 1e-3), 0, 255)
rgba = np.dstack([cor, alpha * 255]).astype(np.uint8)
objetos = ndimage.label(ndimage.binary_closing(lum > 40, iterations=3))[0]
tamanhos = np.bincount(objetos.ravel())
tamanhos[0] = 0
for nome, rotulo in zip(("raquete-direita", "raquete-esquerda"), np.argsort(tamanhos)[::-1][:2]):
    ys, xs = np.nonzero(objetos == rotulo)
    m = 40
    so_ela = ndimage.binary_dilation(objetos == rotulo, iterations=25)
    parte = rgba.copy()
    parte[..., 3] = parte[..., 3] * so_ela
    caixa = (max(xs.min() - m, 0), max(ys.min() - m, 0), min(xs.max() + m, 1199), min(ys.max() + m, 1199))
    Image.fromarray(parte).crop(caixa).save(SAIDA / f"{nome}.png")

# A bolinha é pequena demais na arte (cerca de 68 px); ela é desenhada em vetor no vídeo.
print("ok")
