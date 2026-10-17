"""Gera src/data/trackShapes.ts com o traçado REAL de cada circuito.

Fonte: bacinger/f1-circuits (licença MIT), arquivo f1-circuits.geojson
https://github.com/bacinger/f1-circuits

Uso:
    curl -LO https://raw.githubusercontent.com/bacinger/f1-circuits/master/f1-circuits.geojson
    python3 tools/build-track-shapes.py f1-circuits.geojson > src/data/trackShapes.ts

Cada traçado é projetado (equirretangular, norte para cima), encaixado numa caixa 0–100
mantendo a proporção, centralizado e simplificado (Douglas-Peucker) para ficar leve.
O primeiro ponto é a linha de chegada, como no arquivo de origem.
"""
import json
import math
import sys

# id do site -> id no f1-circuits
IDS = {
    'albert-park': 'au-1953', 'shanghai': 'cn-2004', 'suzuka': 'jp-1962', 'bahrain': 'bh-2002',
    'jeddah': 'sa-2021', 'miami': 'us-2022', 'montreal': 'ca-1978', 'monaco': 'mc-1929',
    'catalunya': 'es-1991', 'red-bull-ring': 'at-1969', 'silverstone': 'gb-1948', 'spa': 'be-1925',
    'hungaroring': 'hu-1986', 'zandvoort': 'nl-1948', 'monza': 'it-1922', 'madring': 'es-2026',
    'baku': 'az-2016', 'singapore': 'sg-2008', 'cota': 'us-2012', 'mexico': 'mx-1962',
    'interlagos': 'br-1940', 'las-vegas': 'us-2023', 'lusail': 'qa-2004', 'yas-marina': 'ae-2009',
}
MARGIN = 6.0
TOLERANCE = 0.32


def simplify(pts, tol):
    if len(pts) < 3:
        return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    norm = math.hypot(dx, dy) or 1e-9
    best_i, best_d = 0, -1.0
    for i in range(1, len(pts) - 1):
        x, y = pts[i]
        d = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / norm
        if d > best_d:
            best_i, best_d = i, d
    if best_d <= tol:
        return [pts[0], pts[-1]]
    left = simplify(pts[: best_i + 1], tol)
    right = simplify(pts[best_i:], tol)
    return left[:-1] + right


def shape(coords):
    lat0 = sum(c[1] for c in coords) / len(coords)
    k = math.cos(math.radians(lat0))
    pts = [(lon * k, -lat) for lon, lat in coords]  # norte para cima
    if pts[0] == pts[-1]:
        pts = pts[:-1]
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    w, h = max(xs) - min(xs), max(ys) - min(ys)
    scale = (100 - 2 * MARGIN) / max(w, h)
    ox = (100 - w * scale) / 2 - min(xs) * scale
    oy = (100 - h * scale) / 2 - min(ys) * scale
    pts = [(x * scale + ox, y * scale + oy) for x, y in pts]
    # laço fechado: divide no ponto mais distante da largada e simplifica as duas metades
    far = max(range(len(pts)), key=lambda i: math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]))
    first = simplify(pts[: far + 1], TOLERANCE)
    second = simplify(pts[far:] + [pts[0]], TOLERANCE)
    pts = first[:-1] + second[:-1]
    return [[round(x, 1), round(y, 1)] for x, y in pts]


def main():
    data = json.load(open(sys.argv[1], encoding='utf-8'))
    by_id = {f['properties']['id']: f for f in data['features']}
    out = [
        '/**',
        ' * Traçados REAIS dos circuitos (gerado por tools/build-track-shapes.py — não edite à mão).',
        ' * Fonte: bacinger/f1-circuits (MIT) — https://github.com/bacinger/f1-circuits',
        ' * Coordenadas projetadas numa caixa 0–100 (norte para cima); o primeiro ponto é a linha de chegada.',
        ' */',
        'export const trackShapes: Record<string, [number, number][]> = {',
    ]
    for site_id, src_id in IDS.items():
        pts = shape(by_id[src_id]['geometry']['coordinates'])
        flat = ','.join(f'[{x},{y}]' for x, y in pts)
        out.append(f"  '{site_id}': [{flat}],")
    out.append('};')
    print('\n'.join(out))


if __name__ == '__main__':
    main()
