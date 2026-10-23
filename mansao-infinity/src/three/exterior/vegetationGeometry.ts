import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Gerador pseudoaleatório determinístico (mesma paisagem a cada carregamento). */
export function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Folha de palmeira: plano curvado para baixo ao longo do comprimento, com leve torção. */
function frondGeometry(length: number, width: number, droop: number) {
  const g = new THREE.PlaneGeometry(width, length, 2, 10);
  g.translate(0, length / 2, 0);
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const x = pos.getX(i);
    const t = y / length;
    // arco: sobe e depois cai; as bordas descem um pouco (forma de "V")
    pos.setZ(i, -droop * t * t * length + Math.abs(x) * 0.25);
    pos.setY(i, y * (1 - 0.25 * t * t));
  }
  g.rotateX(-Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

export interface PalmGeometry {
  trunk: THREE.BufferGeometry;
  crown: THREE.BufferGeometry;
}

/** Palmeira imperial/coqueiro estilizado: tronco curvo afunilado e copa de folhas. */
export function palmGeometry(height: number, lean: number, seed: number): PalmGeometry {
  const r = rng(seed);
  const pts = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(lean * 0.15, height * 0.35, 0),
    new THREE.Vector3(lean * 0.55, height * 0.7, lean * 0.1),
    new THREE.Vector3(lean, height, lean * 0.15),
  ];
  const curve = new THREE.CatmullRomCurve3(pts);
  const trunk = new THREE.TubeGeometry(curve, 24, 0.17, 10, false);
  // afunila o tronco em direção ao topo e alarga a base
  const pos = trunk.getAttribute('position') as THREE.BufferAttribute;
  const uv = trunk.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const t = uv.getX(i);
    const c = curve.getPoint(t);
    const k = 1.25 - 0.55 * t + (t < 0.06 ? (0.06 - t) * 6 : 0);
    pos.setXYZ(i, c.x + (pos.getX(i) - c.x) * k, pos.getY(i), c.z + (pos.getZ(i) - c.z) * k);
    uv.setXY(i, uv.getY(i), t * height);
  }
  trunk.computeVertexNormals();
  const top = curve.getPoint(1);
  const fronds: THREE.BufferGeometry[] = [];
  const n = 14;
  for (let i = 0; i < n; i++) {
    const len = 2.6 + r() * 1.1;
    const f = frondGeometry(len, 0.9, 0.45 + r() * 0.35);
    f.rotateX(0.15 + r() * 0.5);
    f.rotateY((i / n) * Math.PI * 2 + r() * 0.3);
    f.translate(top.x, top.y, top.z);
    fronds.push(f);
  }
  // núcleo da copa
  const core = new THREE.SphereGeometry(0.28, 10, 8);
  core.scale(1, 0.8, 1);
  core.translate(top.x, top.y + 0.05, top.z);
  const coreUV = core.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < coreUV.count; i++) coreUV.setXY(i, 0.5, 0.02);
  const crown = mergeGeometries([...fronds.map((g) => g.toNonIndexed()), core.toNonIndexed()], false)!;
  return { trunk, crown };
}

export interface TreeGeometry {
  trunk: THREE.BufferGeometry;
  canopy: THREE.BufferGeometry;
}

/** Árvore de copa larga: tronco com galhos e nuvem de cartões de folhas (atlas 2×2). */
export function treeGeometry(height: number, spread: number, seed: number): TreeGeometry {
  const r = rng(seed);
  const parts: THREE.BufferGeometry[] = [];
  const trunkH = height * 0.45;
  const t = new THREE.CylinderGeometry(0.16, 0.26, trunkH, 10);
  t.translate(0, trunkH / 2, 0);
  parts.push(t);
  for (let i = 0; i < 4; i++) {
    const b = new THREE.CylinderGeometry(0.05, 0.11, height * 0.38, 7);
    b.translate(0, height * 0.19, 0);
    b.rotateZ(0.5 + r() * 0.4);
    b.rotateY((i / 4) * Math.PI * 2 + r());
    b.translate(0, trunkH * 0.85, 0);
    parts.push(b);
  }
  const trunk = mergeGeometries(parts.map((p) => p.toNonIndexed()), false)!;
  const cards: THREE.BufferGeometry[] = [];
  const count = 78;
  for (let i = 0; i < count; i++) {
    const size = 1.5 + r() * 1.2;
    const c = new THREE.PlaneGeometry(size, size);
    const q = Math.floor(r() * 4);
    const uv = c.getAttribute('uv') as THREE.BufferAttribute;
    for (let k = 0; k < uv.count; k++) uv.setXY(k, (q % 2) * 0.5 + uv.getX(k) * 0.5, (1 - Math.floor(q / 2)) * 0.5 + uv.getY(k) * 0.5);
    c.rotateX((r() - 0.5) * 1.4);
    c.rotateY(r() * Math.PI);
    const a = r() * Math.PI * 2;
    const rad = Math.sqrt(r()) * spread;
    const y = trunkH + 0.4 + r() * (height - trunkH - 0.6) * (1 - (rad / spread) * 0.4);
    c.translate(Math.cos(a) * rad, y, Math.sin(a) * rad * 0.9);
    // normais "esféricas" para a copa ter volume na iluminação
    const pos = c.getAttribute('position') as THREE.BufferAttribute;
    const nor = c.getAttribute('normal') as THREE.BufferAttribute;
    const cy = trunkH + (height - trunkH) * 0.5;
    for (let k = 0; k < pos.count; k++) {
      const v = new THREE.Vector3(pos.getX(k), pos.getY(k) - cy, pos.getZ(k)).normalize();
      nor.setXYZ(k, v.x, v.y * 0.8 + 0.2, v.z);
    }
    cards.push(c);
  }
  const canopy = mergeGeometries(cards, false)!;
  return { trunk, canopy };
}

/** Arbusto: aglomerado de cartões de folhas próximo ao chão. */
export function shrubGeometry(size: number, seed: number) {
  const r = rng(seed);
  const cards: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 9; i++) {
    const s = size * (0.7 + r() * 0.5);
    const c = new THREE.PlaneGeometry(s, s * 0.85);
    const q = Math.floor(r() * 4);
    const uv = c.getAttribute('uv') as THREE.BufferAttribute;
    for (let k = 0; k < uv.count; k++) uv.setXY(k, (q % 2) * 0.5 + uv.getX(k) * 0.5, (1 - Math.floor(q / 2)) * 0.5 + uv.getY(k) * 0.5);
    c.rotateX((r() - 0.5) * 0.6);
    c.rotateY(r() * Math.PI);
    c.translate((r() - 0.5) * size * 0.6, s * 0.4, (r() - 0.5) * size * 0.6);
    const nor = c.getAttribute('normal') as THREE.BufferAttribute;
    const pos = c.getAttribute('position') as THREE.BufferAttribute;
    for (let k = 0; k < pos.count; k++) {
      const v = new THREE.Vector3(pos.getX(k), pos.getY(k) - size * 0.2, pos.getZ(k)).normalize();
      nor.setXYZ(k, v.x, Math.abs(v.y) * 0.7 + 0.3, v.z);
    }
    cards.push(c);
  }
  return mergeGeometries(cards, false)!;
}

/** Touceira de capim ornamental: lâminas finas que se abrem em leque. */
export function grassClumpGeometry(height: number, seed: number) {
  const r = rng(seed);
  const pos: number[] = [];
  const nor: number[] = [];
  const blades = 40;
  for (let i = 0; i < blades; i++) {
    const a = r() * Math.PI * 2;
    const tilt = 0.15 + r() * 0.5;
    const h = height * (0.6 + r() * 0.5);
    const bx = Math.cos(a) * 0.04;
    const bz = Math.sin(a) * 0.04;
    const tx = bx + Math.cos(a) * Math.sin(tilt) * h;
    const tz = bz + Math.sin(a) * Math.sin(tilt) * h;
    const ty = Math.cos(tilt) * h;
    const w = 0.012;
    const px = -Math.sin(a) * w;
    const pz = Math.cos(a) * w;
    pos.push(bx - px, 0, bz - pz, bx + px, 0, bz + pz, tx, ty, tz);
    for (let k = 0; k < 3; k++) nor.push(Math.cos(a) * 0.3, 0.9, Math.sin(a) * 0.3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return g;
}
