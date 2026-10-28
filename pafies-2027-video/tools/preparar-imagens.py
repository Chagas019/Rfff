#!/usr/bin/env python3
"""Recorta o logotipo oficial do PAFIES e remove o fundo dos elementos 3D laranja.

Uso: python3 tools/preparar-imagens.py <print-do-logo.png> <no-3d.jpg> <raio-3d.jpg>
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SAIDA = Path(__file__).resolve().parent.parent / "public" / "imagens"
SAIDA.mkdir(parents=True, exist_ok=True)
logo_src, no_src, raio_src = sys.argv[1:4]

# Logotipo: o círculo azul ocupa o centro do print do perfil.
img = Image.open(logo_src).convert("RGB")
a = np.asarray(img).astype(int)
azul = (a[..., 2] > 130) & (a[..., 0] < 40) & (a[..., 1] < 80)
# varre só a linha e a coluna que passam perto do centro do print
h, w = azul.shape
linha = np.nonzero(azul[int(h * 0.445)])[0]
cx = (linha.min() + linha.max()) / 2
coluna = np.nonzero(azul[:, int(cx)])[0]
cy = (coluna.min() + coluna.max()) / 2
r = min(linha.max() - linha.min(), coluna.max() - coluna.min()) / 2 - 3
caixa = (int(cx - r), int(cy - r), int(cx + r), int(cy + r))
logo = img.crop(caixa).resize((1024, 1024), Image.LANCZOS).convert("RGBA")
mask = Image.new("L", (4096, 4096), 0)
ImageDraw.Draw(mask).ellipse((0, 0, 4095, 4095), fill=255)
logo.putalpha(mask.resize((1024, 1024), Image.LANCZOS))
logo.save(SAIDA / "logo-pafies.png")

# Nó laranja: fundo cinza-escuro liso vira transparente.
no = np.asarray(Image.open(no_src).convert("RGB")).astype(float)
fundo = np.median(no[:20, :20].reshape(-1, 3), axis=0)
dist = np.linalg.norm(no - fundo, axis=-1)
alpha = np.clip((dist - 12) / 40, 0, 1)
Image.fromarray(np.dstack([no, alpha * 255]).astype(np.uint8)).save(SAIDA / "no-laranja.png")

# Raio: o "xadrez" claro de fundo tem pouca saturação; o raio é laranja/vermelho.
raio = np.asarray(Image.open(raio_src).convert("RGB")).astype(float)
mx, mn = raio.max(-1), raio.min(-1)
sat = (mx - mn) / (mx + 1e-6)
alpha = np.clip((sat - 0.12) / 0.25, 0, 1)
# o núcleo do neon é amarelo-claro: pouca saturação, mas bem mais vermelho que azul
alpha = np.maximum(alpha, np.clip((raio[..., 0] - raio[..., 2] - 10) / 30, 0, 1))
# fecha os furinhos finos do brilho central (dilata e depois erode)
m = Image.fromarray((alpha * 255).astype(np.uint8))
alpha = np.asarray(m.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(9))) / 255
Image.fromarray(np.dstack([raio, alpha * 255]).astype(np.uint8)).save(SAIDA / "raio-laranja.png")
print("ok", caixa)
