import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { POOL } from '../../data/plan';
import { TERRAIN } from '../../data/landscape';
import { TILE, useMaterials } from '../../materials/library';
import { applyWorldUV } from '../../utils/geometry';
import { B } from '../furniture/primitives';

const WATER_Y = -0.07;
const BASIN_Y = -0.62;

/**
 * Piscina de borda infinita (20 × 7 m): casco em pastilhas de vidro, prainha
 * rasa a oeste, borda de transbordo voltada para o mar com calha coletora,
 * água com normais animadas e refletindo o céu, e luminárias subaquáticas.
 */
export function SwimmingPool() {
  const m = useMaterials();
  const { x0, x1, z0, z1, beachX1, depth, beachDepth } = POOL;
  const shell = useMemo(() => {
    const parts: { g: THREE.BufferGeometry; mat: 'poolTiles' | 'travertine' }[] = [];
    const box = (ax: number, bx: number, ay: number, by: number, az: number, bz: number, mat: 'poolTiles' | 'travertine') => {
      const g = new THREE.BoxGeometry(bx - ax, by - ay, bz - az);
      g.translate((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
      applyWorldUV(g, mat === 'poolTiles' ? TILE.poolTiles : TILE.travertine);
      parts.push({ g, mat });
    };
    const t = 0.25;
    // fundo: prainha rasa + parte funda com rampa
    box(x0, beachX1, -beachDepth - 0.2, -beachDepth, z0, z1, 'poolTiles');
    box(beachX1, x1, -depth - 0.2, -depth, z0, z1, 'poolTiles');
    box(beachX1, beachX1 + 0.3, -depth, -beachDepth, z0, z1, 'poolTiles'); // degrau da prainha
    for (let i = 0; i < 3; i++) box(beachX1 + 0.3 + i * 0.4, beachX1 + 0.7 + i * 0.4, -depth, -beachDepth - 0.3 * (i + 1), z1 - 2.4, z1, 'poolTiles'); // escada
    // paredes
    box(x0 - t, x0, -depth - 0.2, 0, z0 - t, z1 + t, 'poolTiles');
    box(x1, x1 + t, -depth - 0.2, 0, z0 - t, z1 + t, 'poolTiles');
    box(x0, x1, -depth - 0.2, 0, z1, z1 + t, 'poolTiles');
    // parede da borda infinita (topo levemente abaixo da água) e calha
    box(x0, x1, -depth - 0.2, WATER_Y - 0.015, z0 - t, z0, 'poolTiles');
    box(x0 - t, x1 + t, BASIN_Y - 0.2, BASIN_Y - 0.05, TERRAIN.edgeZ, z0 - t, 'poolTiles');
    // bordas em travertino (coping) nos três lados secos
    box(x0 - 0.45, x0, -0.05, 0.02, z0 - t, z1 + 0.45, 'travertine');
    box(x1, x1 + 0.45, -0.05, 0.02, z0 - t, z1 + 0.45, 'travertine');
    box(x0, x1, -0.05, 0.02, z1, z1 + 0.45, 'travertine');
    return parts;
  }, [x0, x1, z0, z1, beachX1, depth, beachDepth]);

  const water = useMemo(() => {
    const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0 + 0.02);
    g.rotateX(-Math.PI / 2);
    g.translate((x0 + x1) / 2, WATER_Y, (z0 + z1) / 2 - 0.01);
    const uv = g.getAttribute('uv') as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (x1 - x0) / 3, uv.getY(i) * (z1 - z0) / 3);
    return g;
  }, [x0, x1, z0, z1]);

  const sheet = useMemo(() => {
    const g = new THREE.PlaneGeometry(x1 - x0, WATER_Y - BASIN_Y);
    g.translate((x0 + x1) / 2, (WATER_Y + BASIN_Y) / 2, z0 - 0.255);
    return g;
  }, [x0, x1, z0]);

  const basin = useMemo(() => {
    const g = new THREE.PlaneGeometry(x1 - x0 + 0.5, z0 - 0.25 - TERRAIN.edgeZ);
    g.rotateX(-Math.PI / 2);
    g.translate((x0 + x1) / 2, BASIN_Y + 0.08, (z0 - 0.25 + TERRAIN.edgeZ) / 2);
    return g;
  }, [x0, x1, z0]);

  useFrame((_, dt) => {
    const nm = m.water.normalMap;
    if (nm) {
      nm.offset.x += dt * 0.012;
      nm.offset.y -= dt * 0.018;
    }
  });

  const lights = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let x = beachX1 + 2; x < x1 - 0.5; x += 3.2) {
      out.push([x, -0.55, z1 - 0.005]);
    }
    for (let z = z0 + 1.5; z < z1 - 0.5; z += 2.6) out.push([x1 - 0.005, -0.55, z]);
    return out;
  }, [beachX1, x1, z0, z1]);

  return (
    <group name="SwimmingPool">
      {shell.map(({ g, mat }, i) => (
        <mesh key={i} geometry={g} material={m[mat]} receiveShadow castShadow={mat === 'travertine'} />
      ))}
      <mesh geometry={water} material={m.water} renderOrder={3} receiveShadow />
      <mesh geometry={sheet} material={m.water} renderOrder={3} />
      <mesh geometry={basin} material={m.water} renderOrder={3} />
      {lights.map((p, i) => (
        <mesh key={i} position={p} rotation={p[0] >= x1 - 0.01 ? [0, -Math.PI / 2, 0] : [0, Math.PI, 0]} material={m.ledCool}>
          <circleGeometry args={[0.13, 20]} />
        </mesh>
      ))}
      {/* escada de inox na parte funda */}
      {[-0.3, 0.3].map((dz) => (
        <B key={dz} s={[0.04, 1.2, 0.04]} p={[x1 - 0.35, -0.2, z1 - 3.5 + dz]} m={m.steel} />
      ))}
    </group>
  );
}
