import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BOLLARDS, BOUNDARY, GRASSES, PALMS, PAVING, SHRUBS, STEPPING_STONES, TERRAIN, TREES, type Plant } from '../../data/landscape';
import { QUALITY } from '../../config/quality';
import { TILE, useMaterials } from '../../materials/library';
import { useExperience } from '../../store/useExperience';
import { applyWorldUV, subtractRects } from '../../utils/geometry';
import { POOL } from '../../data/plan';
import { B, Cyl } from '../furniture/primitives';
import { grassClumpGeometry, palmGeometry, shrubGeometry, treeGeometry } from './vegetationGeometry';

/**
 * Paisagismo e implantação: platô gramado, terraço inferior e falésia sobre o
 * mar, pisos em travertino e pedra, pisantes, muros, portões automáticos,
 * rua, colinas ao fundo e vegetação instanciada.
 */
export function Landscape() {
  return (
    <group name="Landscape">
      <Terrain />
      <Paving />
      <BoundaryWalls />
      <Gates />
      <Vegetation />
      <ExteriorLights />
    </group>
  );
}

function worldBox(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, tile: number) {
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return applyWorldUV(g, tile);
}

function Terrain() {
  const m = useMaterials();
  const geos = useMemo(() => {
    const L = { x0: -400, x1: 400 };
    return {
      plateau: mergeAll(
        subtractRects({ x0: L.x0, x1: L.x1, z0: TERRAIN.edgeZ, z1: 400 }, [{ x0: POOL.x0, x1: POOL.x1, z0: TERRAIN.edgeZ, z1: POOL.z1 }]).map((r) =>
          worldBox(r.x0, r.x1, -6, TERRAIN.plateauTop, r.z0, r.z1, TILE.grass),
        ),
      ),
      lower: worldBox(L.x0, L.x1, -9, TERRAIN.lowerTop, TERRAIN.cliffZ, TERRAIN.edgeZ, TILE.grass),
      retaining: worldBox(L.x0, L.x1, TERRAIN.lowerTop - 0.1, TERRAIN.plateauTop + 0.02, TERRAIN.edgeZ - 0.4, TERRAIN.edgeZ, TILE.travertine),
      cliff: worldBox(L.x0 - 40, L.x1 + 40, -14, TERRAIN.lowerTop - 0.4, TERRAIN.cliffZ - 1.2, TERRAIN.cliffZ, 6),
      street: worldBox(-90, 90, -0.2, -0.1, 31.0, 41.0, 4),
      sidewalk: worldBox(-90, 90, -0.2, -0.04, 30.6, 31.0, 2),
    };
  }, []);
  const asphalt = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2b2c2e', roughness: 0.92, normalMap: m.concrete.normalMap, normalScale: new THREE.Vector2(1.5, 1.5) }), [m]);
  const rock = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6d665c', roughness: 0.95, map: m.stoneDark.map, normalMap: m.travertine.normalMap, normalScale: new THREE.Vector2(2, 2) }), [m]);
  return (
    <group name="Terrain">
      <mesh geometry={geos.plateau} material={m.grass} receiveShadow />
      <mesh geometry={geos.lower} material={m.grass} receiveShadow />
      <mesh geometry={geos.retaining} material={m.travertine} receiveShadow castShadow />
      <mesh geometry={geos.cliff} material={rock} receiveShadow />
      <mesh geometry={geos.street} material={asphalt} receiveShadow />
      <mesh geometry={geos.sidewalk} material={m.pavers} receiveShadow />
      {[-12, 12].map((x) => (
        <B key={x} s={[50, 0.004, 0.12]} p={[x * 3, -0.098, 36]} m={m.lacquerWhite} shadow={false} />
      ))}
      <Sea />
    </group>
  );
}

/** Mar ao norte: plano extenso com normais animadas (reflete o céu de cada horário). */
function Sea() {
  const m = useMaterials();
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(4000, 2000);
    g.rotateX(-Math.PI / 2);
    g.translate(0, TERRAIN.seaY, TERRAIN.cliffZ - 1000);
    const uv = g.getAttribute('uv') as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 400, uv.getY(i) * 200);
    return g;
  }, []);
  useFrame((_, dt) => {
    const nm = m.sea.normalMap;
    if (nm) {
      nm.offset.x += dt * 0.004;
      nm.offset.y += dt * 0.006;
    }
  });
  return <mesh geometry={geo} material={m.sea} receiveShadow />;
}

function Paving() {
  const m = useMaterials();
  const groups = useMemo(() => {
    const byMat: Record<string, THREE.BufferGeometry[]> = { travertine: [], driveway: [], pavers: [] };
    for (const p of PAVING) {
      const tile = p.mat === 'travertine' ? TILE.travertine : p.mat === 'driveway' ? TILE.driveway : TILE.pavers;
      byMat[p.mat].push(worldBox(p.x0, p.x1, -0.2, 0, p.z0, p.z1, tile));
    }
    for (const s of STEPPING_STONES) byMat.travertine.push(worldBox(s.x - s.w / 2, s.x + s.w / 2, -0.15, -0.03, s.z - s.d / 2, s.z + s.d / 2, TILE.travertine));
    return Object.entries(byMat).map(([mat, list]) => {
      const merged = list.length === 1 ? list[0] : mergeAll(list);
      return { mat, geo: merged };
    });
  }, []);
  return (
    <group name="Paving">
      {groups.map(({ mat, geo }) => (
        <mesh key={mat} geometry={geo} material={m[mat as 'travertine' | 'driveway' | 'pavers']} receiveShadow />
      ))}
    </group>
  );
}

function mergeAll(list: THREE.BufferGeometry[]) {
  // mesclagem simples de caixas (mesmos atributos)
  const total = list.reduce((s, g) => s + g.getAttribute('position').count, 0);
  const idxTotal = list.reduce((s, g) => s + (g.index?.count ?? 0), 0);
  const pos = new Float32Array(total * 3);
  const nor = new Float32Array(total * 3);
  const uv = new Float32Array(total * 2);
  const idx = new Uint32Array(idxTotal);
  let vo = 0;
  let io = 0;
  for (const g of list) {
    const p = g.getAttribute('position') as THREE.BufferAttribute;
    pos.set(p.array as Float32Array, vo * 3);
    nor.set((g.getAttribute('normal') as THREE.BufferAttribute).array as Float32Array, vo * 3);
    uv.set((g.getAttribute('uv') as THREE.BufferAttribute).array as Float32Array, vo * 2);
    const gi = g.index!;
    for (let i = 0; i < gi.count; i++) idx[io + i] = gi.getX(i) + vo;
    vo += p.count;
    io += gi.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  out.computeBoundingSphere();
  return out;
}

/** Muros de divisa: frente em travertino (com vãos dos portões) e laterais em concreto. */
function BoundaryWalls() {
  const m = useMaterials();
  const { frontZ, height, westX, eastX, streetGate, pedGate } = BOUNDARY;
  const geos = useMemo(() => {
    const front: THREE.BufferGeometry[] = [];
    const segs: [number, number][] = [
      [westX, streetGate.x0],
      [streetGate.x1, pedGate.x0],
      [pedGate.x1, eastX],
    ];
    for (const [a, b] of segs) front.push(worldBox(a, b, -0.1, height, frontZ - 0.15, frontZ + 0.15, TILE.travertine));
    // pilares dos portões (mais altos)
    for (const x of [streetGate.x0, streetGate.x1, pedGate.x0, pedGate.x1]) front.push(worldBox(x - 0.25, x + 0.25, -0.1, height + 0.4, frontZ - 0.25, frontZ + 0.25, TILE.travertine));
    const sides = [worldBox(westX - 0.15, westX + 0.15, -0.1, height, TERRAIN.edgeZ, frontZ, TILE.concrete), worldBox(eastX - 0.15, eastX + 0.15, -0.1, height, TERRAIN.edgeZ, frontZ, TILE.concrete)];
    return { front: mergeAll(front), sides: mergeAll(sides) };
  }, [frontZ, height, westX, eastX, streetGate, pedGate]);
  return (
    <group name="BoundaryWalls">
      <mesh geometry={geos.front} material={m.travertine} castShadow receiveShadow />
      <mesh geometry={geos.sides} material={m.concrete} castShadow receiveShadow />
      {/* guarda-corpo de vidro na borda do platô (fora da piscina) */}
      {[
        [westX, -2.2],
        [22.6, eastX],
      ].map(([a, b]) => (
        <mesh key={a} position={[(a + b) / 2, TERRAIN.plateauTop + 0.55, TERRAIN.edgeZ + 0.1]} material={m.glassGuard} renderOrder={2}>
          <boxGeometry args={[b - a, 1.1, 0.02]} />
        </mesh>
      ))}
      {/* número e placa da casa */}
      <B s={[0.8, 0.3, 0.02]} p={[-3.2, 1.6, frontZ + 0.16]} m={m.brass} />
    </group>
  );
}

/** Portão deslizante de duas folhas (veículos) e portão social de giro, em ripas de teca. */
function Gates() {
  const m = useMaterials();
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const ped = useRef<THREE.Group>(null);
  const t = useRef({ street: 0, ped: 0 });
  const { frontZ, streetGate, pedGate } = BOUNDARY;
  const half = (streetGate.x1 - streetGate.x0) / 2;
  useFrame((_, dt) => {
    const doors = useExperience.getState().doors;
    const k = Math.min(dt, 0.05);
    t.current.street = THREE.MathUtils.damp(t.current.street, doors.streetGate ? 1 : 0, 1.2, k);
    t.current.ped = THREE.MathUtils.damp(t.current.ped, doors.pedestrianGate ? 1 : 0, 2.5, k);
    if (left.current) left.current.position.x = streetGate.x0 + half / 2 - t.current.street * (half - 0.2);
    if (right.current) right.current.position.x = streetGate.x1 - half / 2 + t.current.street * (half - 0.2);
    if (ped.current) ped.current.rotation.y = -t.current.ped * 1.5;
  });
  const toggle = useExperience((s) => s.toggleDoor);
  const leaf = (w: number) => (
    <group>
      <B s={[w, 0.08, 0.08]} p={[0, 0.12, 0]} m={m.frame} />
      <B s={[w, 0.08, 0.08]} p={[0, 2.2, 0]} m={m.frame} />
      {Array.from({ length: Math.floor(w / 0.16) }, (_, i) => (
        <B key={i} s={[0.11, 2.0, 0.05]} p={[-w / 2 + 0.08 + i * 0.16, 1.16, 0]} m={m.teak} tile={TILE.teak} />
      ))}
    </group>
  );
  return (
    <group name="Gates">
      <group ref={left} position={[streetGate.x0 + half / 2, 0, frontZ - 0.35]} onClick={(e) => (e.stopPropagation(), toggle('streetGate'))}>
        {leaf(half)}
      </group>
      <group ref={right} position={[streetGate.x1 - half / 2, 0, frontZ - 0.35]} onClick={(e) => (e.stopPropagation(), toggle('streetGate'))}>
        {leaf(half)}
      </group>
      <group ref={ped} position={[pedGate.x0 + 0.05, 0, frontZ]} onClick={(e) => (e.stopPropagation(), toggle('pedestrianGate'))}>
        <group position={[(pedGate.x1 - pedGate.x0 - 0.1) / 2, 0, 0]}>{leaf(pedGate.x1 - pedGate.x0 - 0.1)}</group>
      </group>
    </group>
  );
}

// ------------------------------------------------------------------ vegetação instanciada
function useInstances(ref: React.RefObject<THREE.InstancedMesh | null>, list: Plant[], scaleMode: 'uniform' | 'none' = 'uniform') {
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    list.forEach((p, i) => {
      o.position.set(p.x, p.y ?? TERRAIN.plateauTop, p.z);
      o.rotation.set(0, p.rot, 0);
      const s = scaleMode === 'uniform' ? p.s : 1;
      o.scale.set(s, s, s);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.count = list.length;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [ref, list, scaleMode]);
}

function thin<T>(list: T[], keep: number): T[] {
  if (keep >= 1) return list;
  const step = 1 / Math.max(keep, 0.05);
  return list.filter((_, i) => Math.floor(i % step) === 0);
}

function Vegetation() {
  const quality = useExperience((s) => s.quality);
  const density = QUALITY[quality].vegetation;
  return (
    <group name="Vegetation">
      <Palms />
      <Trees />
      <Shrubs density={density} />
      <Grasses density={density} />
    </group>
  );
}

function PalmVariant({ list, v }: { list: Plant[]; v: number }) {
  const m = useMaterials();
  const geo = useMemo(() => palmGeometry(1, 0.08 + v * 0.05, 11 + v * 7), [v]);
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const crownRef = useRef<THREE.InstancedMesh>(null);
  // a altura vem da escala vertical; as folhas mantêm tamanho real
  const items = useMemo(() => list.filter((p) => p.v === v), [list, v]);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    items.forEach((p, i) => {
      o.position.set(p.x, p.y ?? TERRAIN.plateauTop, p.z);
      o.rotation.set(0, p.rot, 0);
      o.scale.set(1, p.s, 1);
      o.updateMatrix();
      trunkRef.current?.setMatrixAt(i, o.matrix);
      // copa: posiciona no topo do tronco (curva com inclinação proporcional)
      const lean = 0.08 + v * 0.05;
      const top = new THREE.Vector3(lean, p.s, lean * 0.15).applyEuler(new THREE.Euler(0, p.rot, 0));
      o.position.set(p.x + top.x, (p.y ?? TERRAIN.plateauTop) + top.y - 1, p.z + top.z);
      o.scale.set(1, 1, 1);
      o.updateMatrix();
      crownRef.current?.setMatrixAt(i, o.matrix);
    });
    for (const r of [trunkRef, crownRef]) {
      if (r.current) {
        r.current.count = items.length;
        r.current.instanceMatrix.needsUpdate = true;
        r.current.computeBoundingSphere();
      }
    }
  }, [items, v]);
  const crownGeo = useMemo(() => {
    const g = geo.crown.clone();
    g.translate(-0.08 - v * 0.05, 0, -(0.08 + v * 0.05) * 0.15);
    return g;
  }, [geo, v]);
  if (!items.length) return null;
  return (
    <>
      <instancedMesh ref={trunkRef} args={[geo.trunk, m.bark, items.length]} castShadow receiveShadow />
      <instancedMesh ref={crownRef} args={[crownGeo, m.frond, items.length]} castShadow />
    </>
  );
}

function Palms() {
  return (
    <>
      {[0, 1, 2].map((v) => (
        <PalmVariant key={v} list={PALMS} v={v} />
      ))}
    </>
  );
}

function Trees() {
  const m = useMaterials();
  const geos = useMemo(() => [treeGeometry(7.5, 3.6, 3), treeGeometry(6.5, 4.2, 9)], []);
  return (
    <>
      {geos.map((g, v) => (
        <TreeVariant key={v} geo={g} items={TREES.filter((t) => t.v === v)} trunkMat={m.bark} leafMat={m.leaves} />
      ))}
    </>
  );
}

function TreeVariant({ geo, items, trunkMat, leafMat }: { geo: { trunk: THREE.BufferGeometry; canopy: THREE.BufferGeometry }; items: Plant[]; trunkMat: THREE.Material; leafMat: THREE.Material }) {
  const t = useRef<THREE.InstancedMesh>(null);
  const c = useRef<THREE.InstancedMesh>(null);
  useInstances(t, items);
  useInstances(c, items);
  if (!items.length) return null;
  return (
    <>
      <instancedMesh ref={t} args={[geo.trunk, trunkMat, items.length]} castShadow receiveShadow />
      <instancedMesh ref={c} args={[geo.canopy, leafMat, items.length]} castShadow receiveShadow />
    </>
  );
}

function Shrubs({ density }: { density: number }) {
  const m = useMaterials();
  const geo = useMemo(() => shrubGeometry(1, 5), []);
  const items = useMemo(() => thin(SHRUBS, Math.min(1, density + 0.2)), [density]);
  const ref = useRef<THREE.InstancedMesh>(null);
  useInstances(ref, items);
  return <instancedMesh key={items.length} ref={ref} args={[geo, m.leaves, items.length]} castShadow receiveShadow />;
}

function Grasses({ density }: { density: number }) {
  const geo = useMemo(() => grassClumpGeometry(0.9, 21), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8f9a5a', roughness: 0.85, side: THREE.DoubleSide }), []);
  const items = useMemo(() => thin(GRASSES, density), [density]);
  const ref = useRef<THREE.InstancedMesh>(null);
  useInstances(ref, items);
  return <instancedMesh key={items.length} ref={ref} args={[geo, mat, items.length]} receiveShadow />;
}

/** Balizadores dos caminhos e arandelas dos pilares (emissivos externos). */
function ExteriorLights() {
  const m = useMaterials();
  return (
    <group name="ExteriorLights">
      {BOLLARDS.map((b, i) => (
        <group key={i} position={[b.x, TERRAIN.plateauTop, b.z]}>
          <Cyl rt={0.07} h={0.6} p={[0, 0.3, 0]} m={m.frame} seg={12} />
          <Cyl rt={0.072} h={0.08} p={[0, 0.52, 0]} m={m.led} seg={12} shadow={false} />
        </group>
      ))}
      {[BOUNDARY.streetGate.x0, BOUNDARY.streetGate.x1, BOUNDARY.pedGate.x0, BOUNDARY.pedGate.x1].map((x) => (
        <B key={x} s={[0.3, 0.06, 0.08]} p={[x, BOUNDARY.height + 0.25, BOUNDARY.frontZ + 0.29]} m={m.led} shadow={false} />
      ))}
    </group>
  );
}
