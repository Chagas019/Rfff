#!/usr/bin/env python3
"""Recorta o logotipo oficial do PAFIES do print do perfil.

Uso: python3 tools/preparar-imagens.py <print-do-logo.png>
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

SAIDA = Path(__file__).resolve().parent.parent / "public" / "imagens"
SAIDA.mkdir(parents=True, exist_ok=True)
logo_src = sys.argv[1]

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
