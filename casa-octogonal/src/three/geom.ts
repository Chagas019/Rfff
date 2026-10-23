import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Gap, V2 } from '../data/plan';

/**
 * Construção de geometria em metros. As UVs também ficam em metros (u ao
 * longo da face, v na altura), então a escala real de cada textura é dada
 * pelo `repeat` do material.
 */
export class Bucket {
  pos: number[] = [];
  nor: number[] = [];
  uv: number[] = [];

  /** Quadrilátero plano a-b-c-d com normal n (a ordem é corrigida se preciso). */
  quad(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, n: THREE.Vector3, uva: number[], uvb: number[], uvc: number[], uvd: number[]) {
    const e1 = new THREE.Vector3().subVectors(b, a);
    const e2 = new THREE.Vector3().subVectors(c, a);
    const flip = new THREE.Vector3().crossVectors(e1, e2).dot(n) < 0;
    const tri = flip ? [a, c, b, a, d, c] : [a, b, c, a, c, d];
    const tuv = flip ? [uva, uvc, uvb, uva, uvd, uvc] : [uva, uvb, uvc, uva, uvc, uvd];
    tri.forEach((p, i) => {
      this.pos.push(p.x, p.y, p.z);
      this.nor.push(n.x, n.y, n.z);
      this.uv.push(tuv[i][0], tuv[i][1]);
    });
  }

  /**
   * Prisma vertical sobre um quadrilátero em planta (x, z), de y0 a y1.
   * `faces` escolhe as faces: laterais, topo e base.
   */
  prism(q: V2[], y0: number, y1: number, faces: { sides?: boolean; top?: boolean; bottom?: boolean } = {}) {
    const { sides = true, top = true, bottom = false } = faces;
    const cx = q.reduce((s, p) => s + p[0], 0) / q.length;
    const cz = q.reduce((s, p) => s + p[1], 0) / q.length;
    if (sides) {
      for (let i = 0; i < q.length; i++) {
        const p = q[i];
        const r = q[(i + 1) % q.length];
        const dx = r[0] - p[0];
        const dz = r[1] - p[1];
        const len = Math.hypot(dx, dz);
        if (len < 1e-5) continue;
        let n = new THREE.Vector3(dz / len, 0, -dx / len);
        const mx = (p[0] + r[0]) / 2 - cx;
        const mz = (p[1] + r[1]) / 2 - cz;
        if (n.x * mx + n.z * mz < 0) n = n.negate();
        // u contínuo ao longo da direção da face (sem emenda entre peças)
        const ux = dx / len;
        const uz = dz / len;
        const u0 = p[0] * ux + p[1] * uz;
        const u1 = r[0] * ux + r[1] * uz;
        this.quad(new THREE.Vector3(p[0], y0, p[1]), new THREE.Vector3(r[0], y0, r[1]), new THREE.Vector3(r[0], y1, r[1]), new THREE.Vector3(p[0], y1, p[1]), n, [u0, y0], [u1, y0], [u1, y1], [u0, y1]);
      }
    }
    const cap = (y: number, up: boolean) => {
      const n = new THREE.Vector3(0, up ? 1 : -1, 0);
      const v = q.map((p) => new THREE.Vector3(p[0], y, p[1]));
      const uvs = q.map((p) => [p[0], p[1]]);
      for (let i = 1; i < q.length - 1; i++) this.quad(v[0], v[i], v[i + 1], v[i + 1], n, uvs[0], uvs[i], uvs[i + 1], uvs[i + 1]);
    };
    if (top) cap(y1, true);
    if (bottom) cap(y0, false);
  }

  geometry(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.computeBoundingSphere();
    return g;
  }
}

const lerp2 = (a: V2, b: V2, t: number): V2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

export interface Piece {
  t0: number;
  t1: number;
  y0: number;
  y1: number;
}

/** Divide uma parede (0..1 ao longo, y0..y1) em blocos maciços ao redor dos vãos. */
export function solidPieces(gaps: Gap[], y0: number, y1: number): Piece[] {
  const out: Piece[] = [];
  const sorted = [...gaps].sort((a, b) => a.t0 - b.t0);
  let cur = 0;
  for (const g of sorted) {
    if (g.t0 > cur + 1e-6) out.push({ t0: cur, t1: g.t0, y0, y1 });
    if (g.y0 > y0 + 1e-6) out.push({ t0: g.t0, t1: g.t1, y0, y1: g.y0 });
    if (g.y1 < y1 - 1e-6) out.push({ t0: g.t0, t1: g.t1, y0: g.y1, y1 });
    cur = Math.max(cur, g.t1);
  }
  if (cur < 1 - 1e-6) out.push({ t0: cur, t1: 1, y0, y1 });
  return out;
}

/**
 * Parede entre duas linhas paralelas (ou semelhantes): a linha interna I0→I1
 * e a externa O0→O1. Peças que chegam ao topo geram a "tampa" de corte.
 */
export function buildWall(body: Bucket, caps: Bucket | null, I: [V2, V2], O: [V2, V2], gaps: Gap[], y0: number, y1: number, capY = y1) {
  for (const p of solidPieces(gaps, y0, y1)) {
    const q: V2[] = [lerp2(I[0], I[1], p.t0), lerp2(I[0], I[1], p.t1), lerp2(O[0], O[1], p.t1), lerp2(O[0], O[1], p.t0)];
    body.prism(q, p.y0, p.y1, { top: p.y1 < capY - 1e-6 || !caps, bottom: p.y0 > y0 + 1e-6 });
    if (caps && p.y1 >= capY - 1e-6) caps.prism(q, p.y1, p.y1 + 0.004, { sides: false });
  }
}

/** Forma octogonal (anel opcional) para Shape/Extrude, com y da forma = −z do mundo. */
export function octShape(pts: V2[], hole?: V2[]): THREE.Shape {
  const s = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  if (hole) s.holes.push(new THREE.Path(hole.map(([x, z]) => new THREE.Vector2(x, -z))));
  return s;
}

/** Laje/plataforma: extrusão vertical da forma de y0 até y1. */
export function slab(shape: THREE.Shape, y0: number, y1: number, curveSegments = 1): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false, curveSegments });
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0, 0);
  return g;
}

/** Barra fina (caixa) entre dois pontos 3D. */
export function bar(a: THREE.Vector3, b: THREE.Vector3, w: number, d = w): THREE.BufferGeometry {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const g = new THREE.BoxGeometry(w, len, d);
  const m = new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()), new THREE.Vector3(1, 1, 1));
  g.applyMatrix4(m);
  return g;
}

export function merge(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const clean = list.map((g) => (g.index ? g.toNonIndexed() : g));
  for (const g of clean) {
    if (!g.getAttribute('uv')) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.getAttribute('position').count * 2), 2));
  }
  return mergeGeometries(clean, false)!;
}
