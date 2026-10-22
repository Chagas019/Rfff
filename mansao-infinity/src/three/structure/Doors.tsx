import { useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { DOORS, type DoorSpec } from '../../data/doors';
import { TILE, useMaterials } from '../../materials/library';
import { useExperience } from '../../store/useExperience';
import { B, Cyl } from '../furniture/primitives';
import { useLevelVisibility } from './visibility';

/**
 * Esquadrias interativas: portas de giro (simples e duplas), portas de correr
 * de vidro, porta pivotante de 4,5 m e portão seccionado da garagem. Clique
 * numa folha (ou tecla E no modo caminhada) para abrir e fechar.
 */
export function Doors() {
  const vis = useLevelVisibility();
  return (
    <group name="Doors">
      {DOORS.map((d) => (
        <group key={d.id} visible={d.level === 0 ? vis.L0 : vis.L1}>
          <Door spec={d} />
        </group>
      ))}
    </group>
  );
}

/** Valor animado 0 (fechada) → 1 (aberta) com amortecimento. */
function useDoorProgress(id: string, onFrame: (t: number) => void, speed = 2.2) {
  const t = useRef(0);
  useFrame((_, dt) => {
    const target = useExperience.getState().doors[id] ? 1 : 0;
    if (Math.abs(target - t.current) < 0.0005) {
      if (t.current !== target) {
        t.current = target;
        onFrame(t.current);
      }
      return;
    }
    t.current = THREE.MathUtils.damp(t.current, target, speed, Math.min(dt, 0.05));
    onFrame(t.current);
  });
}

function useToggle(id: string) {
  const toggle = useExperience((s) => s.toggleDoor);
  return (e: ThreeEvent<MouseEvent>) => {
    if (useExperience.getState().mode === 'walk') return;
    e.stopPropagation();
    toggle(id);
  };
}

const hover = {
  onPointerOver: (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
  },
  onPointerOut: () => {
    document.body.style.cursor = '';
  },
};

function Door({ spec }: { spec: DoorSpec }) {
  switch (spec.kind) {
    case 'door':
      return <SwingDoor spec={spec} />;
    case 'double':
      return <DoubleDoor spec={spec} />;
    case 'slide':
      return <SlidingDoor spec={spec} />;
    case 'pivot':
      return <PivotDoor spec={spec} />;
    case 'garage':
      return <GarageDoor spec={spec} />;
    default:
      return null;
  }
}

/** Ângulo-base da folha (ao longo da parede) e sinal de abertura. */
function swingAngles(spec: DoorSpec) {
  const base = spec.axis === 'x' ? 0 : -Math.PI / 2;
  const dir = spec.axis === 'x' ? -spec.swing : spec.swing;
  return { base, dir };
}

const at = (spec: DoorSpec, u: number, y: number, off = 0): [number, number, number] =>
  spec.axis === 'x' ? [u, y, spec.at + off] : [spec.at + off, y, u];

/** Folha de porta: laca (padrão) ou nogueira, com puxador alavanca dos dois lados. */
function Leaf({ w, h, mat, handleAt }: { w: number; h: number; mat: THREE.Material; handleAt: number }) {
  const m = useMaterials();
  return (
    <group>
      <B s={[w, h, 0.045]} p={[w / 2, h / 2, 0]} m={mat} tile={TILE.walnut} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Cyl rt={0.025} h={0.02} p={[handleAt, 1.05, s * 0.032]} r={[Math.PI / 2, 0, 0]} m={m.brass} seg={14} />
          <B s={[0.14, 0.018, 0.018]} p={[handleAt - 0.07, 1.05, s * 0.05]} m={m.brass} />
        </group>
      ))}
    </group>
  );
}

function SwingDoor({ spec }: { spec: DoorSpec }) {
  const m = useMaterials();
  const ref = useRef<THREE.Group>(null);
  const { base, dir } = swingAngles(spec);
  const w = spec.b - spec.a - 0.09;
  const h = spec.h - 0.06;
  const hingeAtA = spec.hinge === 'a';
  // com dobradiça em 'b' a folha nasce virada (aponta para −u)
  const flip = hingeAtA ? 0 : Math.PI;
  const turn = hingeAtA ? dir : -dir;
  useDoorProgress(spec.id, (t) => {
    if (ref.current) ref.current.rotation.y = base + flip + turn * t * (Math.PI / 2) * 0.95;
  });
  const hingeU = hingeAtA ? spec.a + 0.045 : spec.b - 0.045;
  const onClick = useToggle(spec.id);
  const mat = spec.wallKind === 'ext' ? m.walnut : m.lacquerWhite;
  return (
    <group ref={ref} position={at(spec, hingeU, spec.y + 0.01)} rotation={[0, base + flip, 0]} onClick={onClick} {...hover}>
      <Leaf w={w} h={h} mat={mat} handleAt={w - 0.08} />
    </group>
  );
}

function DoubleDoor({ spec }: { spec: DoorSpec }) {
  const m = useMaterials();
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const { base, dir } = swingAngles(spec);
  const w = (spec.b - spec.a - 0.1) / 2;
  const h = spec.h - 0.06;
  useDoorProgress(spec.id, (t) => {
    const a = t * (Math.PI / 2) * 0.92;
    if (left.current) left.current.rotation.y = base + dir * a;
    if (right.current) right.current.rotation.y = base + Math.PI - dir * a;
  });
  const onClick = useToggle(spec.id);
  return (
    <group onClick={onClick} {...hover}>
      <group ref={left} position={at(spec, spec.a + 0.05, spec.y + 0.01)} rotation={[0, base, 0]}>
        <Leaf w={w} h={h} mat={m.walnut} handleAt={w - 0.08} />
      </group>
      <group ref={right} position={at(spec, spec.b - 0.05, spec.y + 0.01)} rotation={[0, base + Math.PI, 0]}>
        <Leaf w={w} h={h} mat={m.walnut} handleAt={w - 0.08} />
      </group>
    </group>
  );
}

/** Porta de correr de vidro: folha fixa e folha móvel em trilhos paralelos. */
function SlidingDoor({ spec }: { spec: DoorSpec }) {
  const m = useMaterials();
  const moving = useRef<THREE.Group>(null);
  const W = spec.b - spec.a;
  const pw = W / 2 + 0.04;
  const h = spec.h - 0.08;
  const travel = W / 2 - 0.06;
  const dirVec = spec.axis === 'x' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
  const startU = spec.b - pw / 2 - 0.03;
  const start = new THREE.Vector3(...at(spec, startU, spec.y + 0.03, 0.03));
  useDoorProgress(spec.id, (t) => {
    if (moving.current) moving.current.position.copy(start).addScaledVector(dirVec, -travel * t);
  }, 1.8);
  const onClick = useToggle(spec.id);
  const rot: [number, number, number] = [0, spec.axis === 'x' ? 0 : -Math.PI / 2, 0];
  const panel = (
    <group rotation={rot}>
      <mesh position={[0, h / 2, 0]} material={m.glass} renderOrder={2}>
        <boxGeometry args={[pw - 0.08, h - 0.08, 0.016]} />
      </mesh>
      <B s={[pw, 0.05, 0.05]} p={[0, 0.025, 0]} m={m.frame} />
      <B s={[pw, 0.05, 0.05]} p={[0, h - 0.025, 0]} m={m.frame} />
      <B s={[0.05, h, 0.05]} p={[-pw / 2 + 0.025, h / 2, 0]} m={m.frame} />
      <B s={[0.05, h, 0.05]} p={[pw / 2 - 0.025, h / 2, 0]} m={m.frame} />
      <B s={[0.025, 0.6, 0.04]} p={[-pw / 2 + 0.07, 1.1, 0.04]} m={m.steel} />
    </group>
  );
  return (
    <group onClick={onClick} {...hover}>
      <group position={at(spec, spec.a + pw / 2 + 0.03, spec.y + 0.03, -0.03)}>{panel}</group>
      <group ref={moving} position={start.toArray() as [number, number, number]}>
        {panel}
      </group>
    </group>
  );
}

/** Porta pivotante de nogueira (2,4 × 4,5 m) com puxador vertical em aço escuro. */
function PivotDoor({ spec }: { spec: DoorSpec }) {
  const m = useMaterials();
  const ref = useRef<THREE.Group>(null);
  const W = spec.b - spec.a - 0.06;
  const H = spec.h - 0.04;
  const pivot = 0.75;
  useDoorProgress(spec.id, (t) => {
    if (ref.current) ref.current.rotation.y = -t * (Math.PI / 2) * 0.9;
  }, 1.6);
  const onClick = useToggle(spec.id);
  return (
    <group position={at(spec, spec.a + 0.03 + pivot, spec.y + 0.01)} onClick={onClick} {...hover}>
      <group ref={ref}>
        <B s={[W, H, 0.1]} p={[W / 2 - pivot, H / 2, 0]} m={m.walnut} tile={TILE.walnut} />
        {Array.from({ length: 7 }, (_, i) => (
          <B key={i} s={[0.012, H - 0.1, 0.105]} p={[-pivot + (W / 8) * (i + 1), H / 2, 0]} m={m.blackMetal} shadow={false} />
        ))}
        {[-1, 1].map((s) => (
          <group key={s}>
            <B s={[0.05, 1.8, 0.05]} p={[W - pivot - 0.3, 1.5, s * 0.12]} m={m.blackMetal} />
            <B s={[0.05, 0.05, 0.08]} p={[W - pivot - 0.3, 0.7, s * 0.08]} m={m.blackMetal} />
            <B s={[0.05, 0.05, 0.08]} p={[W - pivot - 0.3, 2.3, s * 0.08]} m={m.blackMetal} />
          </group>
        ))}
      </group>
    </group>
  );
}

/** Portão seccionado da garagem em teca: as seções sobem pelo trilho e deitam sob o teto. */
function GarageDoor({ spec }: { spec: DoorSpec }) {
  const m = useMaterials();
  const sections = useRef<(THREE.Group | null)[]>([]);
  const W = spec.b - spec.a - 0.04;
  const H = spec.h;
  const n = 6;
  const sh = H / n;
  const zFace = spec.at - spec.thickness / 2 - 0.04;
  const cx = (spec.a + spec.b) / 2;
  useDoorProgress(spec.id, (t) => {
    const lift = t * H;
    sections.current.forEach((g, i) => {
      if (!g) return;
      const p = i * sh + lift; // distância percorrida no trilho a partir do piso
      if (p + sh / 2 <= H) {
        g.position.set(cx, spec.y + p + sh / 2, zFace);
        g.rotation.x = 0;
      } else {
        g.position.set(cx, spec.y + H + 0.12, zFace - (p + sh / 2 - H));
        g.rotation.x = Math.PI / 2;
      }
    });
  }, 1.2);
  const onClick = useToggle(spec.id);
  return (
    <group onClick={onClick} {...hover}>
      {Array.from({ length: n }, (_, i) => (
        <group key={i} ref={(el) => (sections.current[i] = el)} position={[cx, spec.y + i * sh + sh / 2, zFace]}>
          <B s={[W, sh - 0.01, 0.05]} p={[0, 0, 0]} m={m.teak} tile={TILE.teak} />
          <B s={[W, 0.008, 0.052]} p={[0, sh / 2 - 0.005, 0]} m={m.blackMetal} shadow={false} />
        </group>
      ))}
      <B s={[0.04, 0.04, 3.6]} p={[spec.a + 0.1, spec.y + H + 0.12, zFace - 1.8]} m={m.frame} />
      <B s={[0.04, 0.04, 3.6]} p={[spec.b - 0.1, spec.y + H + 0.12, zFace - 1.8]} m={m.frame} />
    </group>
  );
}
