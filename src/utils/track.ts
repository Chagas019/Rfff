/**
 * Converte pontos em um caminho SVG fechado e suave (Catmull-Rom → Bézier).
 */
export function trackPath(points: [number, number][], tension = 0.5): string {
  const n = points.length;
  if (n < 3) return '';
  const p = (i: number) => points[(i + n) % n];
  let d = `M ${p(0)[0]} ${p(0)[1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = p(i - 1), p1 = p(i), p2 = p(i + 1), p3 = p(i + 2);
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension * 2;
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension * 2;
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension * 2;
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension * 2;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0]} ${p2[1]}`;
  }
  return `${d} Z`;
}

/** Ângulo (graus) entre dois vetores. */
function turnAngle(ax: number, ay: number, bx: number, by: number) {
  const a = Math.atan2(ay, ax);
  const b = Math.atan2(by, bx);
  let d = Math.abs(b - a);
  if (d > Math.PI) d = 2 * Math.PI - d;
  return (d * 180) / Math.PI;
}

/**
 * Trechos de curva (onde a pista vira mais que `minDeg` numa janela curta), como polylines
 * abertas — usados para desenhar as zebras vermelhas e brancas só nas curvas.
 */
export function cornerSegments(points: [number, number][], minDeg = 32, window = 2): string[] {
  const n = points.length;
  if (n < 5) return [];
  const p = (i: number) => points[(i + n) % n];
  const corner = points.map((_, i) => {
    const a = p(i - window), b = p(i), c = p(i + window);
    return turnAngle(b[0] - a[0], b[1] - a[1], c[0] - b[0], c[1] - b[1]) >= minDeg;
  });
  const out: string[] = [];
  let i = 0;
  // começa num ponto que não é curva para não cortar um trecho ao meio
  const start = corner.findIndex((v) => !v);
  if (start < 0) return [];
  while (i < n) {
    const idx = (start + i) % n;
    if (!corner[idx]) { i++; continue; }
    const run: [number, number][] = [p(idx - 1)];
    while (i < n && corner[(start + i) % n]) { run.push(p((start + i) % n)); i++; }
    run.push(p((start + i) % n));
    if (run.length >= 3) out.push(run.map(([x, y]) => `${x},${y}`).join(' '));
  }
  return out;
}

/** Retângulo que envolve o traçado. */
export function trackBounds(points: [number, number][]) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}
