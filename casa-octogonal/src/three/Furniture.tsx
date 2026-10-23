import { useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { A_CORE, H, HALF, ROOMS, ROOM_MID, T_CORE, T_RADIAL, faceAngle, roomCenter, type Room } from '../data/plan';
import { useMaterials, type Materials } from '../materials/materials';
import { PIT_STEPS, PIT_Y } from './House';

type V3 = [number, number, number];

// ------------------------------------------------------------------ primitivas
const cache = new Map<string, THREE.BufferGeometry>();
const cached = (k: string, f: () => THREE.BufferGeometry) => {
  let g = cache.get(k);
  if (!g) cache.set(k, (g = f()));
  return g;
};

/** Caixa arredondada [w, h, d] centrada em p. */
function RB({ s, p, r, m, radius = 0.03, shadow = true }: { s: V3; p?: V3; r?: V3; m: THREE.Material; radius?: number; shadow?: boolean }) {
  const rr = Math.min(radius, s[0] / 2 - 0.001, s[1] / 2 - 0.001, s[2] / 2 - 0.001);
  const g = cached(`rb${s.join()}${rr}`, () => new RoundedBoxGeometry(s[0], s[1], s[2], 3, Math.max(rr, 0.002)));
  return <mesh geometry={g} material={m} position={p} rotation={r} castShadow={shadow && Math.max(...s) > 0.25} receiveShadow />;
}

function Cyl({ r, rb, h, p, m, seg = 28, rot }: { r: number; rb?: number; h: number; p?: V3; m: THREE.Material; seg?: number; rot?: V3 }) {
  const g = cached(`c${r}${rb}${h}${seg}`, () => new THREE.CylinderGeometry(r, rb ?? r, h, seg));
  return <mesh geometry={g} material={m} position={p} rotation={rot} castShadow={Math.max(r * 2, h) > 0.3} receiveShadow />;
}

/** Grupo no referencial do ambiente k: +z para fora (janela), +x no sentido horário. */
function RoomFrame({ k, children }: { k: number; children: ReactNode }) {
  const [x, z] = roomCenter(k);
  return (
    <group position={[x, 0, z]} rotation={[0, faceAngle(k), 0]}>
      {children}
    </group>
  );
}

const TAN = Math.tan(HALF);
/** Meia largura livre do ambiente na profundidade local z. */
const halfW = (z: number) => (ROOM_MID + z) * TAN - T_RADIAL / 2;
/** Profundidade local da face da parede central. */
const Z_IN = A_CORE + T_CORE / 2 - ROOM_MID;

/** Encosta um móvel (de profundidade d) na parede radial s = ±1, na profundidade z. */
function OnRadial({ s, z, d, children }: { s: 1 | -1; z: number; d: number; children: ReactNode }) {
  const nx = -s * Math.cos(HALF);
  const nz = Math.sin(HALF);
  const off = d / 2 + 0.02;
  return (
    <group position={[s * halfW(z) + nx * off, 0, z + nz * off]} rotation={[0, -s * (90 - 22.5) * (Math.PI / 180), 0]}>
      {children}
    </group>
  );
}

// ------------------------------------------------------------------ peças
function Bed({ w, l, m, cover }: { w: number; l: number; m: Materials; cover: THREE.Material }) {
  return (
    <group>
      <RB s={[w + 0.12, 0.28, l + 0.06]} p={[0, 0.22, 0]} m={m.walnut} radius={0.02} />
      <RB s={[w + 0.6, 1.15, 0.12]} p={[0, 0.66, -l / 2 - 0.04]} m={m.linenSand} radius={0.05} />
      <RB s={[w, 0.24, l]} p={[0, 0.48, 0]} m={m.linen} radius={0.08} />
      <RB s={[w + 0.08, 0.07, l * 0.66]} p={[0, 0.6, l * 0.17]} m={cover} radius={0.035} />
      <RB s={[w + 0.12, 0.05, 0.42]} p={[0, 0.64, l * 0.34]} m={m.linenCharcoal} radius={0.025} />
      {[-1, 1].map((i) => (
        <RB key={i} s={[w / 2 - 0.12, 0.17, 0.4]} p={[(i * w) / 4, 0.7, -l / 2 + 0.3]} r={[-0.25, 0, 0]} m={m.linen} radius={0.08} />
      ))}
      <RB s={[w / 2 - 0.25, 0.13, 0.3]} p={[-w / 4 + 0.08, 0.67, -l / 2 + 0.52]} r={[-0.2, 0, 0]} m={cover} radius={0.06} />
    </group>
  );
}

function Nightstand({ m }: { m: Materials }) {
  return (
    <group>
      <RB s={[0.5, 0.5, 0.42]} p={[0, 0.25, 0]} m={m.walnut} radius={0.015} />
      <Cyl r={0.07} rb={0.09} h={0.3} p={[0.06, 0.65, 0]} m={m.ceramic} />
      <mesh position={[0.06, 0.88, 0]} material={m.shade}>
        <cylinderGeometry args={[0.11, 0.15, 0.2, 24, 1, true]} />
      </mesh>
    </group>
  );
}

function Sofa({ w, d = 0.95, m, mat }: { w: number; d?: number; m: Materials; mat: THREE.Material }) {
  return (
    <group>
      <RB s={[w, 0.36, d]} p={[0, 0.2, 0]} m={mat} radius={0.06} />
      <RB s={[w, 0.46, 0.22]} p={[0, 0.6, -d / 2 + 0.11]} m={mat} radius={0.08} />
      {[-1, 1].map((i) => (
        <RB key={i} s={[0.22, 0.58, d]} p={[(i * (w - 0.22)) / 2, 0.31, 0]} m={mat} radius={0.08} />
      ))}
      {[-1, 1].map((i) => (
        <RB key={i} s={[w / 2 - 0.24, 0.14, d - 0.3]} p={[(i * (w / 2 - 0.22)) / 2, 0.44, 0.1]} m={mat} radius={0.06} />
      ))}
      <RB s={[0.42, 0.36, 0.14]} p={[-w / 2 + 0.5, 0.62, -d / 2 + 0.32]} r={[-0.2, 0.2, 0]} m={m.linenRust} radius={0.06} />
      <RB s={[0.42, 0.36, 0.14]} p={[w / 2 - 0.5, 0.62, -d / 2 + 0.32]} r={[-0.2, -0.2, 0]} m={m.linenOlive} radius={0.06} />
    </group>
  );
}

function Armchair({ m, mat }: { m: Materials; mat: THREE.Material }) {
  return (
    <group>
      <RB s={[0.8, 0.38, 0.78]} p={[0, 0.22, 0]} m={mat} radius={0.12} />
      <RB s={[0.8, 0.5, 0.2]} p={[0, 0.58, -0.29]} m={mat} radius={0.1} />
      {[-1, 1].map((i) => (
        <RB key={i} s={[0.16, 0.46, 0.7]} p={[i * 0.32, 0.4, 0.02]} m={mat} radius={0.08} />
      ))}
      <RB s={[0.5, 0.1, 0.5]} p={[0, 0.45, 0.06]} m={m.linen} radius={0.05} />
    </group>
  );
}

function Chair({ m }: { m: Materials }) {
  return (
    <group>
      <RB s={[0.46, 0.07, 0.46]} p={[0, 0.46, 0]} m={m.linenSand} radius={0.03} />
      <RB s={[0.46, 0.42, 0.05]} p={[0, 0.72, -0.21]} r={[-0.08, 0, 0]} m={m.oakLight} radius={0.02} />
      {[
        [-0.19, -0.19],
        [0.19, -0.19],
        [-0.19, 0.19],
        [0.19, 0.19],
      ].map(([x, z], i) => (
        <RB key={i} s={[0.035, 0.44, 0.035]} p={[x, 0.22, z]} m={m.oakLight} radius={0.01} shadow={false} />
      ))}
    </group>
  );
}

/** Planta em vaso: cartões cruzados com o atlas de folhas. */
function Plant({ m, h = 1.2, pot = 0.22, dark = false }: { m: Materials; h?: number; pot?: number; dark?: boolean }) {
  const g = useMemo(() => {
    const list: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 5; i++) {
      const p = new THREE.PlaneGeometry(h * 0.75, h * 0.8);
      const q = i % 4;
      const uv = p.getAttribute('uv') as THREE.BufferAttribute;
      for (let j = 0; j < uv.count; j++) uv.setXY(j, (q % 2) * 0.5 + uv.getX(j) * 0.5, Math.floor(q / 2) * 0.5 + uv.getY(j) * 0.5);
      p.rotateY((i / 5) * Math.PI);
      p.rotateX(i % 2 ? 0.15 : -0.12);
      p.translate(0, h * 0.55 + (i % 3) * 0.08, 0);
      list.push(p.toNonIndexed());
    }
    const merged = new THREE.BufferGeometry();
    const pos: number[] = [];
    const nor: number[] = [];
    const uvs: number[] = [];
    for (const l of list) {
      pos.push(...(l.getAttribute('position').array as Float32Array));
      nor.push(...(l.getAttribute('normal').array as Float32Array));
      uvs.push(...(l.getAttribute('uv').array as Float32Array));
    }
    merged.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    merged.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    return merged;
  }, [h]);
  return (
    <group>
      <Cyl r={pot} rb={pot * 0.8} h={pot * 1.6} p={[0, pot * 0.8, 0]} m={dark ? m.potDark : m.pot} />
      <mesh geometry={g} material={m.leaves} castShadow />
    </group>
  );
}

function Rug({ w, l, m, p = [0, 0, 0], round = false }: { w: number; l: number; m: THREE.Material; p?: V3; round?: boolean }) {
  if (round) return <Cyl r={w / 2} h={0.014} p={[p[0], p[1] + 0.008, p[2]]} m={m} seg={48} />;
  return <RB s={[w, 0.014, l]} p={[p[0], p[1] + 0.008, p[2]]} m={m} radius={0.006} shadow={false} />;
}

function Art({ m, w, h, p, r }: { m: THREE.Material; w: number; h: number; p: V3; r?: V3 }) {
  const mats = useMaterials();
  return (
    <group position={p} rotation={r}>
      <RB s={[w + 0.06, h + 0.06, 0.035]} m={mats.blackMetal} radius={0.004} shadow={false} />
      <mesh position={[0, 0, 0.019]} material={m}>
        <planeGeometry args={[w, h]} />
      </mesh>
    </group>
  );
}

// ------------------------------------------------------------------ ambientes
function Bedroom({ m, king = false, cover, desk = false, reading = false }: { m: Materials; king?: boolean; cover: THREE.Material; desk?: boolean; reading?: boolean }) {
  const w = king ? 1.95 : 1.6;
  const l = 2.1;
  // cabeceira na parede radial (s = −1): a porta fica do outro lado, junto ao octógono central
  return (
    <group>
      <OnRadial s={-1} z={-0.15} d={l + 0.1}>
        <group position={[0, 0, 0.02]}>
          <Rug w={w + 1.5} l={2.4} m={m.rug} p={[0, 0, 0.45]} />
          <Bed w={w} l={l} m={m} cover={cover} />
        </group>
        {[-1, 1].map((i) => (
          <group key={i} position={[i * (w / 2 + 0.4), 0, -l / 2 + 0.22]}>
            <Nightstand m={m} />
          </group>
        ))}
        <Art m={king ? m.art0 : m.art2} w={king ? 1.4 : 1.0} h={0.7} p={[0, 1.75, -l / 2 - 0.02]} />
      </OnRadial>
      {(king || reading) && (
        <group position={[0.9, 0, 1.75]} rotation={[0, -2.6, 0]}>
          <Armchair m={m} mat={m.boucle} />
        </group>
      )}
      {king && (
        <group position={[-1.1, 0, 1.75]} rotation={[0, 2.6, 0]}>
          <Armchair m={m} mat={m.boucle} />
        </group>
      )}
      {(king || reading) && <Cyl r={0.26} h={0.5} p={[king ? -0.1 : 1.65, 0.25, 1.95]} m={m.travertine} />}
      {desk && (
        <OnRadial s={1} z={1.0} d={0.6}>
          <RB s={[1.4, 0.04, 0.6]} p={[0, 0.75, 0]} m={m.oakLight} radius={0.01} />
          <RB s={[0.04, 0.73, 0.55]} p={[-0.66, 0.365, 0]} m={m.walnut} radius={0.01} />
          <RB s={[0.04, 0.73, 0.55]} p={[0.66, 0.365, 0]} m={m.walnut} radius={0.01} />
          <group position={[0, 0, 0.55]} rotation={[0, Math.PI, 0]}>
            <Chair m={m} />
          </group>
        </OnRadial>
      )}
      <group position={[-halfW(1.9) + 0.45, 0, 1.9]}>
        <Plant m={m} h={1.3} />
      </group>
    </group>
  );
}

function Living({ m }: { m: Materials }) {
  const fz = Z_IN;
  return (
    <group>
      {/* lareira de pedra encostada na parede central */}
      <RB s={[2.0, H, 0.5]} p={[0, H / 2, fz + 0.25]} m={m.stoneFire} radius={0.01} />
      <RB s={[2.5, 0.12, 0.7]} p={[0, 0.06, fz + 0.62]} m={m.stoneDark} radius={0.01} />
      <RB s={[1.1, 0.5, 0.06]} p={[0, 0.62, fz + 0.48]} m={m.cap} radius={0.004} shadow={false} />
      <Flames p={[0, 0.4, fz + 0.4]} scale={0.6} />
      <RB s={[2.2, 0.08, 0.3]} p={[0, 1.15, fz + 0.62]} m={m.walnut} radius={0.01} />
      <group position={[0, 0, 0.05]}>
        <Rug w={3.4} l={2.6} m={m.rug} />
        <group position={[0, 0, 1.0]} rotation={[0, Math.PI, 0]}>
          <Sofa w={2.6} m={m} mat={m.linen} />
        </group>
        <Cyl r={0.5} h={0.34} p={[-0.3, 0.17, -0.25]} m={m.travertine} seg={40} />
        <Cyl r={0.34} h={0.26} p={[0.45, 0.13, -0.1]} m={m.walnut} seg={40} />
        <group position={[-1.5, 0, -0.45]} rotation={[0, 1.15, 0]}>
          <Armchair m={m} mat={m.boucleGray} />
        </group>
        <group position={[1.5, 0, -0.45]} rotation={[0, -1.15, 0]}>
          <Armchair m={m} mat={m.boucleGray} />
        </group>
      </group>
      <group position={[-1.75, 0, fz + 0.35]}>
        <RB s={[0.5, 0.6, 0.4]} p={[0, 0.3, 0]} m={m.walnut} radius={0.02} />
        <mesh position={[0, 0.85, 0]} material={m.books}>
          <boxGeometry args={[0.4, 0.5, 0.3]} />
        </mesh>
      </group>
      <group position={[halfW(1.9) - 0.4, 0, 1.9]}>
        <Plant m={m} h={1.6} pot={0.26} dark />
      </group>
    </group>
  );
}

function Dining({ m }: { m: Materials }) {
  return (
    <group position={[0, 0, 0.55]}>
      <Rug w={3.4} l={2.4} m={m.rugDark} />
      <RB s={[2.5, 0.05, 1.0]} p={[0, 0.745, 0]} m={m.oakLight} radius={0.012} />
      {[-0.9, 0.9].map((x) => (
        <RB key={x} s={[0.08, 0.72, 0.7]} p={[x, 0.36, 0]} m={m.walnut} radius={0.01} />
      ))}
      {[-0.8, 0, 0.8].flatMap((x) =>
        [-1, 1].map((s) => (
          <group key={`${x}${s}`} position={[x, 0, s * 0.72]} rotation={[0, s > 0 ? Math.PI : 0, 0]}>
            <Chair m={m} />
          </group>
        )),
      )}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 1.55, 0, 0]} rotation={[0, (-s * Math.PI) / 2, 0]}>
          <Chair m={m} />
        </group>
      ))}
      <Cyl r={0.12} rb={0.09} h={0.22} p={[0, 0.88, 0]} m={m.ceramic} />
      <group position={[0, 1.0, 0]}>
        <Plant m={m} h={0.45} pot={0.001} />
      </group>
      {/* pendente linear */}
      <RB s={[1.6, 0.06, 0.12]} p={[0, 2.25, 0]} m={m.blackMetal} radius={0.02} />
      <mesh position={[0, 2.215, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.bulb}>
        <planeGeometry args={[1.5, 0.06]} />
      </mesh>
    </group>
  );
}

function Kitchen({ m }: { m: Materials }) {
  return (
    <group>
      <group position={[-0.2, 0, 0.35]}>
        <RB s={[2.6, 0.86, 0.95]} p={[0, 0.43, 0]} m={m.walnut} radius={0.01} />
        <RB s={[2.75, 0.05, 1.08]} p={[0, 0.885, 0]} m={m.marble} radius={0.008} />
        <RB s={[0.5, 0.012, 0.36]} p={[0.6, 0.915, 0]} m={m.steel} radius={0.004} shadow={false} />
        {[-0.8, 0, 0.8].map((x) => (
          <group key={x} position={[x, 0, 0.8]}>
            <Cyl r={0.19} h={0.06} p={[0, 0.72, 0]} m={m.leather} />
            <Cyl r={0.02} h={0.7} p={[0, 0.36, 0]} m={m.blackMetal} seg={8} />
            <Cyl r={0.2} h={0.02} p={[0, 0.01, 0]} m={m.blackMetal} />
          </group>
        ))}
        <group position={[-0.7, 0.92, -0.1]}>
          <Cyl r={0.16} rb={0.12} h={0.12} p={[0, 0.06, 0]} m={m.ceramic} />
        </group>
      </group>
      <OnRadial s={1} z={0.2} d={0.65}>
        <RB s={[3.6, 0.86, 0.62]} p={[0, 0.43, 0]} m={m.walnut} radius={0.01} />
        <RB s={[3.7, 0.05, 0.66]} p={[0, 0.885, 0]} m={m.marble} radius={0.008} />
        <RB s={[0.75, 0.01, 0.48]} p={[0.7, 0.915, 0]} m={m.cap} radius={0.004} shadow={false} />
        <RB s={[3.6, 0.04, 0.32]} p={[0, 1.55, -0.15]} m={m.oakLight} radius={0.01} />
        <RB s={[3.6, 0.04, 0.32]} p={[0, 1.95, -0.15]} m={m.oakLight} radius={0.01} />
        <mesh position={[-1.1, 1.75, -0.15]} material={m.books}>
          <boxGeometry args={[0.6, 0.32, 0.22]} />
        </mesh>
        {[-0.3, 0.1, 0.5].map((x) => (
          <Cyl key={x} r={0.08} rb={0.06} h={0.22} p={[x, 1.68, -0.15]} m={m.ceramic} />
        ))}
      </OnRadial>
      <OnRadial s={1} z={-1.55} d={0.68}>
        <RB s={[1.0, 2.4, 0.66]} p={[0, 1.2, 0]} m={m.lacquer} radius={0.01} />
      </OnRadial>
      <group position={[-halfW(1.9) + 0.4, 0, 1.9]}>
        <Plant m={m} h={1.5} pot={0.24} />
      </group>
    </group>
  );
}

function Bath({ m }: { m: Materials }) {
  return (
    <group>
      <group position={[0, 0, 1.45]}>
        <RB s={[1.75, 0.58, 0.82]} p={[0, 0.29, 0]} m={m.ceramic} radius={0.2} />
        <RB s={[1.5, 0.05, 0.6]} p={[0, 0.56, 0]} m={m.mirror} radius={0.02} shadow={false} />
        <Rug w={1.2} l={0.6} m={m.linen} p={[0, 0, -0.75]} />
      </group>
      <OnRadial s={-1} z={0.0} d={0.56}>
        <RB s={[2.0, 0.5, 0.55]} p={[0, 0.6, 0]} m={m.walnut} radius={0.01} />
        <RB s={[2.1, 0.04, 0.58]} p={[0, 0.87, 0]} m={m.marble} radius={0.006} />
        {[-0.5, 0.5].map((x) => (
          <Cyl key={x} r={0.2} rb={0.16} h={0.14} p={[x, 0.96, 0.02]} m={m.ceramic} seg={32} />
        ))}
        <RB s={[1.9, 0.9, 0.03]} p={[0, 1.65, -0.26]} m={m.mirror} radius={0.01} shadow={false} />
      </OnRadial>
      {/* ducha com parede de mármore e vidro */}
      <OnRadial s={1} z={-1.3} d={1.1}>
        <RB s={[1.4, 2.3, 0.06]} p={[0, 1.15, -0.52]} m={m.marble} radius={0.004} />
        <RB s={[1.4, 0.06, 1.05]} p={[0, 0.03, 0]} m={m.marble} radius={0.004} shadow={false} />
        <mesh position={[0, 1.1, 0.5]} material={m.showerGlass}>
          <planeGeometry args={[1.4, 2.2]} />
        </mesh>
        <Cyl r={0.12} h={0.02} p={[0, 2.25, -0.2]} m={m.steel} />
      </OnRadial>
      <OnRadial s={1} z={0.6} d={0.6}>
        <RB s={[0.38, 0.4, 0.55]} p={[0, 0.2, 0]} m={m.ceramic} radius={0.12} />
      </OnRadial>
      <group position={[halfW(2.0) - 0.4, 0, 2.0]}>
        <Plant m={m} h={1.1} />
      </group>
    </group>
  );
}

// ------------------------------------------------------------------ fogo
function Flames({ p, scale = 1 }: { p: V3; scale?: number }) {
  const m = useMaterials();
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.children.forEach((c, i) => {
      const f = 0.82 + 0.18 * Math.sin(t * (7 + i * 1.7) + i * 2.1) + 0.08 * Math.sin(t * 17 + i);
      c.scale.set(1, f, 1);
    });
  });
  const cones = [
    [0, 0, 0.42, 0.13],
    [-0.13, 0.02, 0.3, 0.09],
    [0.14, -0.01, 0.32, 0.1],
    [0.05, 0.08, 0.26, 0.08],
    [-0.06, -0.08, 0.28, 0.08],
  ];
  return (
    <group position={p} scale={scale}>
      <Cyl r={0.32} h={0.06} p={[0, 0.02, 0]} m={m.ember} seg={20} />
      <group ref={ref}>
        {cones.map(([x, z, h, r], i) => (
          <mesh key={i} position={[x, 0.05, z]} material={m.fire} renderOrder={4}>
            <coneGeometry args={[r, h, 10, 1, true]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ------------------------------------------------------------------ sala rebaixada
function ring(r0: number, r1: number, h: number, a0: number, a1: number) {
  const s = new THREE.Shape();
  s.absarc(0, 0, r1, a0, a1, false);
  s.absarc(0, 0, r0, a1, a0, true);
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3, curveSegments: 48 });
  g.rotateX(-Math.PI / 2);
  return g;
}

function ConversationPit() {
  const m = useMaterials();
  // abertura voltada para a frente (+z), onde os degraus descem
  const open = 0.62;
  const a0 = -Math.PI / 2 + open;
  const a1 = -Math.PI / 2 - open + Math.PI * 2;
  const seat = useMemo(() => ring(1.25, 1.95, 0.32, a0, a1), [a0, a1]);
  const back = useMemo(() => ring(1.95, 2.2, 0.66, a0, a1), [a0, a1]);
  const cushions = useMemo(() => {
    const out: { x: number; z: number; a: number }[] = [];
    for (let i = 0; i < 9; i++) {
      const a = a0 + 0.35 + (i / 8) * (a1 - a0 - 0.7);
      out.push({ x: Math.cos(a) * 1.95, z: -Math.sin(a) * 1.95, a });
    }
    return out;
  }, [a0, a1]);
  return (
    <group position={[0, PIT_Y, 0]}>
      <Cyl r={2.3} h={0.012} p={[0, 0.006, 0]} m={m.rugDark} seg={64} />
      <mesh geometry={seat} material={m.boucle} position={[0, 0.06, 0]} castShadow receiveShadow />
      <mesh geometry={back} material={m.boucle} position={[0, 0.06, 0]} castShadow receiveShadow />
      {cushions.map((c, i) => (
        <RB key={i} s={[0.45, 0.4, 0.14]} p={[c.x, 0.62, c.z]} r={[0, Math.PI / 2 + c.a, 0]} m={[m.linenSand, m.linenOlive, m.linen][i % 3]} radius={0.06} />
      ))}
      {/* lareira central */}
      <Cyl r={0.62} rb={0.55} h={0.34} p={[0, 0.17, 0]} m={m.stoneDark} seg={40} />
      <Cyl r={0.48} h={0.02} p={[0, 0.345, 0]} m={m.stoneDark} seg={32} />
      <Flames p={[0, 0.34, 0]} scale={1.0} />
    </group>
  );
}

function CoreDecor() {
  const m = useMaterials();
  // quadros nas faces internas do octógono central (ao lado das portas)
  const arts = [
    { k: 4, t: 0.38, mat: m.art1, w: 1.5 },
    { k: 3, t: 0.36, mat: m.art0, w: 1.1 },
    { k: 5, t: 0.36, mat: m.art2, w: 1.1 },
  ].map(({ k, t, mat, w }) => {
    const a = faceAngle(k);
    const ap = A_CORE - T_CORE / 2 - 0.03;
    const along = (t - 0.5) * 2 * ap * TAN;
    const x = Math.sin(a) * ap + Math.cos(a) * along;
    const z = Math.cos(a) * ap - Math.sin(a) * along;
    return { x, z, a, mat, w };
  });
  const spots = [1.5, 2.5, 5.5, 6.5].map((k) => {
    const a = k * (Math.PI / 4);
    return [Math.sin(a) * 3.95, Math.cos(a) * 3.95] as [number, number];
  });
  return (
    <group>
      {arts.map((p, i) => (
        <Art key={i} m={p.mat} w={p.w} h={p.w * 0.66} p={[p.x, 1.7, p.z]} r={[0, p.a + Math.PI, 0]} />
      ))}
      {spots.map(([x, z], i) => (
        <group key={i} position={[x, PIT_STEPS[0].y, z]}>
          <Plant m={m} h={i % 2 ? 1.6 : 1.1} pot={i % 2 ? 0.26 : 0.2} dark={i % 2 === 0} />
        </group>
      ))}
    </group>
  );
}

// ------------------------------------------------------------------ montagem
function RoomContent({ room, m }: { room: Room; m: Materials }) {
  switch (room.kind) {
    case 'living':
      return <Living m={m} />;
    case 'dining':
      return <Dining m={m} />;
    case 'kitchen':
      return <Kitchen m={m} />;
    case 'bath':
      return <Bath m={m} />;
    case 'master':
      return <Bedroom m={m} king cover={m.linenSand} />;
    case 'reading':
      return <Bedroom m={m} cover={m.linenOlive} reading />;
    default:
      return <Bedroom m={m} cover={room.id === 'suite2' ? m.linenRust : m.linenSand} desk={room.id === 'suite2'} />;
  }
}

export function Furniture() {
  const m = useMaterials();
  return (
    <group name="Mobiliario">
      {ROOMS.map((r) => (
        <RoomFrame key={r.id} k={r.k}>
          <RoomContent room={r} m={m} />
        </RoomFrame>
      ))}
      <ConversationPit />
      <CoreDecor />
    </group>
  );
}
