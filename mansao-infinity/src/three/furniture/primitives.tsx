import { type ReactNode } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { applyWorldUV } from '../../utils/geometry';

/**
 * Primitivas de modelagem com cache de geometria: peças com as mesmas medidas
 * compartilham a mesma geometria na GPU. As UVs ficam em metros, então tecidos,
 * madeiras e pedras mantêm a escala real em qualquer móvel.
 */
const cache = new Map<string, THREE.BufferGeometry>();

function cached(key: string, make: () => THREE.BufferGeometry) {
  let g = cache.get(key);
  if (!g) {
    g = make();
    cache.set(key, g);
  }
  return g;
}

export function boxGeo(w: number, h: number, d: number, tile = 1) {
  return cached(`b|${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}|${tile}`, () => applyWorldUV(new THREE.BoxGeometry(w, h, d), tile));
}

export function roundGeo(w: number, h: number, d: number, radius: number, tile = 1, segments = 3) {
  const r = Math.min(radius, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
  return cached(`r|${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}|${r.toFixed(3)}|${tile}|${segments}`, () =>
    applyWorldUV(new RoundedBoxGeometry(w, h, d, segments, Math.max(0.002, r)), tile),
  );
}

export function cylGeo(rTop: number, rBottom: number, h: number, seg = 24, open = false) {
  return cached(`c|${rTop}|${rBottom}|${h}|${seg}|${open}`, () => new THREE.CylinderGeometry(rTop, rBottom, h, seg, 1, open));
}

export function sphereGeo(r: number, ws = 24, hs = 16) {
  return cached(`s|${r}|${ws}|${hs}`, () => new THREE.SphereGeometry(r, ws, hs));
}

export function torusGeo(r: number, tube: number, rs = 12, ts = 32, arc = Math.PI * 2) {
  return cached(`t|${r}|${tube}|${rs}|${ts}|${arc}`, () => new THREE.TorusGeometry(r, tube, rs, ts, arc));
}

type V3 = [number, number, number];

interface PartProps {
  p?: V3;
  r?: V3;
  m: THREE.Material;
  shadow?: boolean;
}

/** Caixa: tamanho [w, h, d]; posição pelo centro. */
export function B({ s, p, r, m, tile = 1, shadow = true }: PartProps & { s: V3; tile?: number }) {
  return <mesh geometry={boxGeo(s[0], s[1], s[2], tile)} material={m} position={p} rotation={r} castShadow={shadow && Math.max(s[0], s[1], s[2]) >= 0.2} receiveShadow />;
}

/** Caixa com cantos arredondados (estofados, tampos, cantos suaves). */
export function RB({ s, p, r, m, radius = 0.04, tile = 1, shadow = true, seg = 3 }: PartProps & { s: V3; radius?: number; tile?: number; seg?: number }) {
  return <mesh geometry={roundGeo(s[0], s[1], s[2], radius, tile, seg)} material={m} position={p} rotation={r} castShadow={shadow && Math.max(s[0], s[1], s[2]) >= 0.2} receiveShadow />;
}

export function Cyl({ rt, rb, h, p, r, m, seg = 24, shadow = true }: PartProps & { rt: number; rb?: number; h: number; seg?: number }) {
  return <mesh geometry={cylGeo(rt, rb ?? rt, h, seg)} material={m} position={p} rotation={r} castShadow={shadow && Math.max(rt * 2, h) >= 0.2} receiveShadow />;
}

export function Sph({ radius, p, m, shadow = true, scale }: PartProps & { radius: number; scale?: V3 }) {
  return <mesh geometry={sphereGeo(radius)} material={m} position={p} scale={scale} castShadow={shadow && radius >= 0.1} receiveShadow />;
}

/** Posiciona uma peça de mobiliário: centro no piso, rotação em graus. */
export function Place({ x, z, y = 0, rot = 0, children }: { x: number; z: number; y?: number; rot?: number; children: ReactNode }) {
  return (
    <group position={[x, y, z]} rotation={[0, (rot * Math.PI) / 180, 0]}>
      {children}
    </group>
  );
}
