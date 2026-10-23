import * as THREE from 'three';

/** Retângulo de cantos arredondados centrado na origem. */
export function roundedRect<T extends THREE.Path = THREE.Shape>(w: number, h: number, r: number, shape: T = new THREE.Shape() as unknown as T): T {
  const x = -w / 2;
  const y = -h / 2;
  const rr = Math.min(r, w / 2, h / 2);
  shape.moveTo(x + rr, y);
  shape.lineTo(x + w - rr, y);
  shape.absarc(x + w - rr, y + rr, rr, -Math.PI / 2, 0, false);
  shape.lineTo(x + w, y + h - rr);
  shape.absarc(x + w - rr, y + h - rr, rr, 0, Math.PI / 2, false);
  shape.lineTo(x + rr, y + h);
  shape.absarc(x + rr, y + h - rr, rr, Math.PI / 2, Math.PI, false);
  shape.lineTo(x, y + rr);
  shape.absarc(x + rr, y + rr, rr, Math.PI, Math.PI * 1.5, false);
  return shape;
}

/** Furo circular (sentido horário, como o ExtrudeGeometry espera para furos). */
export function circleHole(cx: number, cy: number, r: number) {
  const p = new THREE.Path();
  p.absarc(cx, cy, r, 0, Math.PI * 2, true);
  return p;
}

/** Cruz arredondada de quatro lóbulos (o elemento azul decorativo). */
export function cloverShape(radius: number, segments = 160) {
  const s = new THREE.Shape();
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    // lóbulos redondos com reentrâncias suaves entre eles
    const lobe = Math.pow(Math.abs(Math.cos(2 * t)), 0.55);
    const r = radius * (0.6 + 0.4 * lobe);
    const x = Math.cos(t) * r;
    const y = Math.sin(t) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  return s;
}

/** Engrenagem serrilhada (seletor metálico recartilhado da lateral). */
export function knurlShape(rOuter: number, rInner: number, teeth: number) {
  const s = new THREE.Shape();
  const steps = teeth * 4;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const phase = i % 4;
    const r = phase === 0 || phase === 1 ? rOuter : rInner;
    const x = Math.cos(t) * r;
    const y = Math.sin(t) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  return s;
}

/** Recalcula as UVs de uma geometria plana (x,y) para o intervalo 0–1 da caixa envolvente. */
export function normalizeUVs(geo: THREE.BufferGeometry) {
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  const pos = geo.getAttribute('position');
  const uv = new Float32Array(pos.count * 2);
  const w = bb.max.x - bb.min.x || 1;
  const h = bb.max.y - bb.min.y || 1;
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - bb.min.x) / w;
    uv[i * 2 + 1] = (pos.getY(i) - bb.min.y) / h;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

export interface ExtrudeOpts {
  depth: number;
  bevel?: number;
  bevelSegments?: number;
  curveSegments?: number;
}

/** Extrusão com chanfro arredondado; a face de trás fica em z=0 e a da frente em z=depth+2·bevel. */
export function extrude(shape: THREE.Shape | THREE.Shape[], o: ExtrudeOpts) {
  const bevel = o.bevel ?? 0;
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: o.depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: 0,
    bevelSegments: o.bevelSegments ?? 3,
    // cada arco recebe 2× este valor em pontos: 5 já fica liso em peças pequenas
    curveSegments: o.curveSegments ?? 5,
  });
  geo.translate(0, 0, bevel);
  return geo;
}

/** Torno: perfil (raio, altura) girado em volta do eixo, depois alinhado ao eixo +Z. */
export function lathe(profile: Array<[number, number]>, segments = 48) {
  const geo = new THREE.LatheGeometry(
    profile.map(([r, h]) => new THREE.Vector2(r, h)),
    segments,
  );
  geo.rotateX(Math.PI / 2);
  return geo;
}

export function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, name: string) {
  const m = new THREE.Mesh(geo, mat);
  m.name = name;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
