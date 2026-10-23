import { useMemo } from 'react';
import * as THREE from 'three';
import {
  A_CORE,
  A_IN,
  A_OUT,
  CORE_GAPS,
  EAVE,
  H,
  OUTER_GAPS,
  RADIAL_GAPS,
  ROOF_T,
  ROOMS,
  T_CORE,
  T_RADIAL,
  T_STONE,
  faceEnds,
  octagon,
  vertex,
  type Gap,
  type V2,
} from '../data/plan';
import { useMaterials } from '../materials/materials';
import { useStore } from '../store';
import { Bucket, bar, buildWall, merge, octShape, slab } from './geom';

/** Níveis da sala rebaixada central (degraus octogonais até o fosso). */
export const PIT_STEPS = [
  { ap: 3.95, y: 0 },
  { ap: 3.35, y: -0.17 },
  { ap: 2.75, y: -0.34 },
];
export const PIT_Y = -0.51;

const lerp2 = (a: V2, b: V2, t: number): V2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

function useShell() {
  return useMemo(() => {
    const stone = new Bucket();
    const plaster = new Bucket();
    const caps = new Bucket();
    for (let k = 0; k < 8; k++) {
      // parede externa: pele de pedra (desce abaixo do terreno) + reboco interno
      buildWall(stone, caps, faceEnds(A_OUT - T_STONE, k), faceEnds(A_OUT, k), OUTER_GAPS[k], -0.6, H);
      buildWall(plaster, caps, faceEnds(A_IN, k), faceEnds(A_OUT - T_STONE, k), OUTER_GAPS[k], 0, H);
      // octógono central
      buildWall(plaster, caps, faceEnds(A_CORE - T_CORE / 2, k), faceEnds(A_CORE + T_CORE / 2, k), CORE_GAPS[k], PIT_STEPS[0].y, H);
      // paredes radiais
      const gaps = RADIAL_GAPS[k];
      if (gaps) {
        const a = vertex(A_CORE + T_CORE / 2, k);
        const b = vertex(A_IN, k);
        const dx = b[0] - a[0];
        const dz = b[1] - a[1];
        const len = Math.hypot(dx, dz);
        const nx = (-dz / len) * (T_RADIAL / 2);
        const nz = (dx / len) * (T_RADIAL / 2);
        buildWall(
          plaster,
          caps,
          [
            [a[0] - nx, a[1] - nz],
            [b[0] - nx, b[1] - nz],
          ],
          [
            [a[0] + nx, a[1] + nz],
            [b[0] + nx, b[1] + nz],
          ],
          gaps,
          0,
          H,
        );
      }
    }
    return { stone: stone.geometry(), plaster: plaster.geometry(), caps: caps.geometry() };
  }, []);
}

function useFloors() {
  return useMemo(() => {
    const ring = slab(octShape(octagon(A_IN + 0.05), octagon(A_CORE)), -0.3, 0, 1);
    const bathK = ROOMS.findIndex((r) => r.kind === 'bath');
    const [i0, i1] = faceEnds(A_CORE + T_CORE / 2, bathK);
    const [o0, o1] = faceEnds(A_IN, bathK);
    const bath = slab(octShape([i0, i1, o1, o0]), 0, 0.006);
    const terraces = PIT_STEPS.map((s, i) => slab(octShape(octagon(i === 0 ? A_CORE : PIT_STEPS[i - 1].ap), octagon(s.ap)), -0.7, s.y));
    const pit = slab(octShape(octagon(PIT_STEPS[2].ap)), -0.7, PIT_Y);
    return { ring, bath, terraces: merge(terraces), pit };
  }, []);
}

function useRoof() {
  return useMemo(() => {
    const roof = slab(octShape(octagon(A_OUT + EAVE), octagon(A_CORE - T_CORE / 2)), H, H + ROOF_T);
    const ceilShape = new THREE.Shape(octagon(A_IN + 0.05).map(([x, z]) => new THREE.Vector2(x, z)));
    ceilShape.holes.push(new THREE.Path(octagon(A_CORE).map(([x, z]) => new THREE.Vector2(x, z))));
    const ceiling = new THREE.ShapeGeometry(ceilShape);
    ceiling.rotateX(Math.PI / 2);
    ceiling.translate(0, H - 0.002, 0);
    // reboco na borda interna da laje (vista de dentro da sala central)
    const band = new Bucket();
    for (let k = 0; k < 8; k++) buildWall(band, null, faceEnds(A_CORE - T_CORE / 2 - 0.01, k), faceEnds(A_CORE - T_CORE / 2 + 0.02, k), [], H - 0.01, H + ROOF_T - 0.02);
    // claraboia: tronco de pirâmide octogonal em vidro com montantes de aço
    const y0 = H + ROOF_T + 0.04;
    const y1 = y0 + 1.15;
    const apB = A_CORE - T_CORE / 2;
    const apT = 1.35;
    const B = octagon(apB).map(([x, z]) => new THREE.Vector3(x, y0, z));
    const T = octagon(apT).map(([x, z]) => new THREE.Vector3(x, y1, z));
    const glass = new Bucket();
    const ex = new THREE.Vector3();
    for (let k = 0; k < 8; k++) {
      const a = B[(k + 7) % 8];
      const b = B[k];
      const c = T[k];
      const d = T[(k + 7) % 8];
      const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(d, a)).normalize();
      if (n.y < 0) n.negate();
      glass.quad(a, b, c, d, n, [0, 0], [1, 0], [1, 1], [0, 1]);
    }
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 1; i < 7; i++) glass.quad(T[0], T[i], T[i + 1], T[i + 1], up, [0, 0], [0, 0], [0, 0], [0, 0]);
    const bars: THREE.BufferGeometry[] = [];
    const W = 0.07;
    for (let k = 0; k < 8; k++) {
      const kp = (k + 7) % 8;
      bars.push(bar(B[k], T[k], W));
      bars.push(bar(B[kp], B[k], W));
      bars.push(bar(T[kp], T[k], W));
      // montante central de cada pano e travessa a meia altura
      const mB = ex.clone().addVectors(B[kp], B[k]).multiplyScalar(0.5);
      const mT = new THREE.Vector3().addVectors(T[kp], T[k]).multiplyScalar(0.5);
      bars.push(bar(mB, mT, W * 0.7));
      const hA = new THREE.Vector3().lerpVectors(B[kp], T[kp], 0.5);
      const hB = new THREE.Vector3().lerpVectors(B[k], T[k], 0.5);
      bars.push(bar(hA, hB, W * 0.7));
      // vigas radiais do pano superior
      bars.push(bar(T[k], new THREE.Vector3(0, y1, 0), W * 0.7));
    }
    return { roof, ceiling, band: band.geometry(), glass: glass.geometry(), mullions: merge(bars) };
  }, []);
}

/** Caixilhos, vidros e cortinas das faces externas. */
function Windows() {
  const m = useMaterials();
  const geo = useMemo(() => {
    const frames: THREE.BufferGeometry[] = [];
    const glass = new Bucket();
    const curtains: THREE.BufferGeometry[] = [];
    const ap = A_OUT - T_STONE - 0.04;
    for (let k = 0; k < 8; k++) {
      for (const g of OUTER_GAPS[k] as Gap[]) {
        const [p0, p1] = faceEnds(ap, k);
        const a = lerp2(p0, p1, g.t0);
        const b = lerp2(p0, p1, g.t1);
        const A3 = (p: V2, y: number) => new THREE.Vector3(p[0], y, p[1]);
        const W = 0.06;
        frames.push(bar(A3(a, g.y0), A3(b, g.y0), W, 0.1), bar(A3(a, g.y1), A3(b, g.y1), W, 0.1));
        const panels = g.y0 === 0 ? 4 : 2;
        for (let i = 0; i <= panels; i++) {
          const p = lerp2(a, b, i / panels);
          frames.push(bar(A3(p, g.y0), A3(p, g.y1), W, 0.1));
        }
        const n = new THREE.Vector3(Math.sin(k * Math.PI / 4), 0, Math.cos(k * Math.PI / 4));
        glass.quad(A3(a, g.y0), A3(b, g.y0), A3(b, g.y1), A3(a, g.y1), n, [0, 0], [1, 0], [1, 1], [0, 1]);
        // cortinas de linho recolhidas nas laterais (só nos panos de piso a teto)
        if (g.y0 === 0) {
          const [q0, q1] = faceEnds(A_IN - 0.14, k);
          for (const [t, s] of [
            [g.t0 + 0.02, 1],
            [g.t1 - 0.02, -1],
          ] as const) {
            const c = lerp2(q0, q1, t);
            const dir = new THREE.Vector2(q1[0] - q0[0], q1[1] - q0[1]).normalize();
            const w = 0.75;
            const pg = new THREE.PlaneGeometry(w, H - 0.08, 18, 1);
            const pos = pg.getAttribute('position') as THREE.BufferAttribute;
            for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin((pos.getX(i) / w) * Math.PI * 7) * 0.05);
            pg.computeVertexNormals();
            const ang = Math.atan2(-dir.y, dir.x);
            pg.rotateY(ang);
            pg.translate(c[0] + dir.x * s * (w / 2), (H - 0.08) / 2, c[1] + dir.y * s * (w / 2));
            curtains.push(pg);
          }
        }
      }
    }
    return { frames: merge(frames), glass: glass.geometry(), curtains: merge(curtains) };
  }, []);
  return (
    <group>
      <mesh geometry={geo.frames} material={m.frame} castShadow />
      <mesh geometry={geo.glass} material={m.glass} renderOrder={2} />
      <mesh geometry={geo.curtains} material={m.curtain} castShadow receiveShadow />
    </group>
  );
}

export function House() {
  const m = useMaterials();
  const view = useStore((s) => s.view);
  const shell = useShell();
  const floors = useFloors();
  const roof = useRoof();
  const cut = view === 'corte';
  return (
    <group name="Casa">
      <mesh geometry={shell.stone} material={m.stone} castShadow receiveShadow />
      <mesh geometry={shell.plaster} material={m.plaster} castShadow receiveShadow />
      <mesh geometry={shell.caps} material={m.cap} visible={cut} />
      <mesh geometry={floors.ring} material={m.oak} receiveShadow />
      <mesh geometry={floors.bath} material={m.porcelain} receiveShadow />
      <mesh geometry={floors.terraces} material={m.oakFloorDark} receiveShadow />
      <mesh geometry={floors.pit} material={m.oakFloorDark} receiveShadow />
      <Windows />
      <group visible={!cut}>
        <mesh geometry={roof.roof} material={[m.stoneRoof, m.stone]} castShadow receiveShadow />
        <mesh geometry={roof.ceiling} material={m.ceiling} />
        <mesh geometry={roof.band} material={m.plaster} />
        <mesh geometry={roof.mullions} material={m.blackMetal} castShadow />
        <mesh geometry={roof.glass} material={m.skyGlass} renderOrder={3} />
      </group>
    </group>
  );
}
