import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { A_OUT } from '../data/plan';
import { useMaterials } from '../materials/materials';

/** UV planar em metros (x, z) para geometrias deitadas no chão. */
function planarUV(g: THREE.BufferGeometry) {
  const p = g.getAttribute('position') as THREE.BufferAttribute;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = p.getX(i);
    uv[i * 2 + 1] = p.getZ(i);
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

function flatRing(r0: number, r1: number, y: number, seg = 96) {
  const g = new THREE.RingGeometry(r0, r1, seg, 1);
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  return planarUV(g);
}

/** Gerador pseudoaleatório determinístico (mesma floresta em toda visita). */
function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Tufo de folhagem: cartões cruzados com o atlas de folhas, normais apontando
 * para fora do centro (sombreamento volumétrico, como uma copa).
 */
function foliageCluster(cards: number, radius: number, size: number, seed: number) {
  const rnd = mulberry(seed);
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const v = new THREE.Vector3();
  for (let i = 0; i < cards; i++) {
    const c = new THREE.Vector3().randomDirection().multiplyScalar(radius * Math.cbrt(rnd()));
    c.y *= 0.75;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI));
    const qa = Math.floor(rnd() * 4);
    const u0 = (qa % 2) * 0.5;
    const v0 = Math.floor(qa / 2) * 0.5;
    const s = size * (0.7 + 0.6 * rnd());
    const corners = [
      [-1, -1, u0, v0],
      [1, -1, u0 + 0.5, v0],
      [1, 1, u0 + 0.5, v0 + 0.5],
      [-1, -1, u0, v0],
      [1, 1, u0 + 0.5, v0 + 0.5],
      [-1, 1, u0, v0 + 0.5],
    ];
    for (const [x, y, uu, vv] of corners) {
      v.set((x * s) / 2, (y * s) / 2, 0).applyQuaternion(q).add(c);
      pos.push(v.x, v.y, v.z);
      const n = v.clone().normalize();
      nor.push(n.x, n.y, n.z);
      uv.push(uu, vv);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

interface Blob {
  m: THREE.Matrix4;
  c: THREE.Color;
}

/** Floresta e arbustos: troncos e copas instanciados. */
function useVegetation() {
  return useMemo(() => {
    const rnd = mulberry(7);
    const trunks: THREE.Matrix4[] = [];
    const crowns: Blob[] = [];
    const shrubs: Blob[] = [];
    const greens = ['#ffffff', '#e4f0d0', '#f4f6dc', '#d2e2b8', '#fff4d6', '#c8d8b0'];
    const tmp = new THREE.Object3D();
    const addTree = (x: number, z: number, big: number) => {
      const h = (6 + rnd() * 6) * big;
      const r = 0.16 + 0.12 * big + rnd() * 0.08;
      tmp.position.set(x, h / 2 - 0.2, z);
      tmp.rotation.set((rnd() - 0.5) * 0.08, rnd() * 6, (rnd() - 0.5) * 0.08);
      tmp.scale.set(r, h, r);
      tmp.updateMatrix();
      trunks.push(tmp.matrix.clone());
      const n = 5 + Math.floor(rnd() * 4);
      const spread = 1.3 + 1.3 * big;
      for (let i = 0; i < n; i++) {
        const a = rnd() * Math.PI * 2;
        const d = i === 0 ? 0 : spread * (0.4 + 0.6 * rnd());
        const s = (1.5 + rnd() * 1.0) * (0.75 + 0.35 * big);
        tmp.position.set(x + Math.cos(a) * d, h - 0.4 - rnd() * h * 0.4 + (i === 0 ? 0.8 : 0), z + Math.sin(a) * d);
        tmp.rotation.set(0, rnd() * 6, 0);
        tmp.scale.setScalar(s);
        tmp.updateMatrix();
        crowns.push({ m: tmp.matrix.clone(), c: new THREE.Color(greens[Math.floor(rnd() * greens.length)]).multiplyScalar(0.85 + rnd() * 0.3) });
      }
    };
    // anéis de mata ao redor da clareira (mais densa longe da casa)
    for (let i = 0; i < 560; i++) {
      const a = rnd() * Math.PI * 2;
      const r = 19 + Math.pow(rnd(), 1.3) * 60;
      const x = Math.sin(a) * r;
      const z = Math.cos(a) * r;
      if (Math.abs(x) < 4 && z > 12) continue; // acesso de entrada
      addTree(x, z, 0.75 + rnd() * 0.6);
    }
    // arbustos: canteiros junto à casa e sub-bosque além do caminho
    const addShrub = (x: number, z: number, s: number) => {
      tmp.position.set(x, s * 0.45, z);
      tmp.rotation.set(0, rnd() * 6, 0);
      tmp.scale.set(s, s * 0.8, s);
      tmp.updateMatrix();
      shrubs.push({ m: tmp.matrix.clone(), c: new THREE.Color(greens[Math.floor(rnd() * greens.length)]).multiplyScalar(0.8 + rnd() * 0.35) });
    };
    for (let i = 0; i < 70; i++) {
      const a = rnd() * Math.PI * 2;
      const r = A_OUT + 0.9 + rnd() * 0.5;
      const x = Math.sin(a) * r;
      const z = Math.cos(a) * r;
      // não tampar as portas de vidro: só nas quinas e ao lado dos vãos
      const face = ((a / (Math.PI / 4)) % 1 + 1) % 1;
      if (face > 0.2 && face < 0.8 && rnd() < 0.75) continue;
      if (Math.abs(x) < 2.4 && z > 0) continue;
      addShrub(x, z, 0.5 + rnd() * 0.5);
    }
    for (let i = 0; i < 260; i++) {
      const a = rnd() * Math.PI * 2;
      const r = 14.6 + rnd() * 5;
      const x = Math.sin(a) * r;
      const z = Math.cos(a) * r;
      if (Math.abs(x) < 2.6 && z > 12) continue;
      addShrub(x, z, 0.6 + rnd() * 0.9);
    }
    return { trunks, crowns, shrubs };
  }, []);
}

function Instanced({ geo, mat, items, shadow = true }: { geo: THREE.BufferGeometry; mat: THREE.Material; items: (Blob | THREE.Matrix4)[]; shadow?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const im = ref.current;
    if (!im) return;
    items.forEach((it, i) => {
      if (it instanceof THREE.Matrix4) im.setMatrixAt(i, it);
      else {
        im.setMatrixAt(i, it.m);
        im.setColorAt(i, it.c);
      }
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.computeBoundingSphere();
  }, [items]);
  return <instancedMesh ref={ref} args={[geo, mat, items.length]} castShadow={shadow} receiveShadow frustumCulled={false} />;
}

export function Site() {
  const m = useMaterials();
  const veg = useVegetation();
  const geo = useMemo(() => {
    // anel: o terreno não invade o interior (a sala rebaixada fica abaixo do nível do chão)
    const ground = new THREE.RingGeometry(A_OUT - 0.1, 160, 96, 1);
    ground.rotateX(-Math.PI / 2);
    ground.translate(0, -0.03, 0);
    planarUV(ground);
    const path = flatRing(A_OUT + 1.5, A_OUT + 4.0, 0.01);
    const beds = flatRing(A_OUT + 0.15, A_OUT + 1.5, 0.004, 64);
    const drive = new THREE.PlaneGeometry(3.0, 40);
    drive.rotateX(-Math.PI / 2);
    drive.translate(0, 0.012, A_OUT + 20);
    planarUV(drive);
    const walk = new THREE.PlaneGeometry(2.2, 1.7);
    walk.rotateX(-Math.PI / 2);
    walk.translate(0, 0.013, A_OUT + 0.9);
    planarUV(walk);
    const trunk = new THREE.CylinderGeometry(0.7, 1, 1, 8, 1, true);
    const crown = foliageCluster(28, 1.0, 1.45, 3);
    const crownCore = new THREE.IcosahedronGeometry(0.5, 1);
    const shrub = foliageCluster(22, 0.8, 0.9, 5);
    return { ground, path, beds, drive, walk, trunk, crown, crownCore, shrub };
  }, []);
  const leafMat = useMemo(() => {
    const l = m.leaves.clone();
    l.vertexColors = false;
    return l;
  }, [m.leaves]);
  const coreMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2f4220', roughness: 0.95 }), []);
  return (
    <group name="Terreno">
      <mesh geometry={geo.ground} material={m.forest} receiveShadow />
      <mesh geometry={geo.path} material={m.gravel} receiveShadow />
      <mesh geometry={geo.beds} material={m.mulch} receiveShadow />
      <mesh geometry={geo.drive} material={m.gravel} receiveShadow />
      <mesh geometry={geo.walk} material={m.oakLight} receiveShadow castShadow />
      <Instanced geo={geo.trunk} mat={m.bark} items={veg.trunks} />
      <Instanced geo={geo.crownCore} mat={coreMat} items={veg.crowns.map((c) => c.m)} shadow={false} />
      <Instanced geo={geo.crown} mat={leafMat} items={veg.crowns} />
      <Instanced geo={geo.shrub} mat={leafMat} items={veg.shrubs} />
    </group>
  );
}
