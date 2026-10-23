import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ROOMS, LEVEL_Y, FOOTPRINT, type Level } from '../data/plan';
import { useBoardLabels } from '../store/boardLabels';
import { useExperience } from '../store/useExperience';
import { ExplodeLevel, explodeState } from './structure/explode';

/** Cômodos legendados na prancha (os demais aparecem só no índice e na planta). */
const LABELED: Record<Level, string[]> = {
  0: ['living', 'dining', 'kitchen', 'foyer', 'office', 'cinema', 'garage', 'powder', 'laundry', 'pantry', 'storage'],
  1: ['master', 'masterBath', 'masterCloset', 'bed2', 'bed3', 'bed4', 'bed5', 'bathShared', 'terrace', 'balcony'],
};

const THEME = {
  light: { bg: '#e8ecf1', floor: '#e8ecf1', minor: '#d6dce4', major: '#c3cbd6', ink: '#1b1c1f', line: '#2a2c30' },
  dark: { bg: '#18191c', floor: '#18191c', minor: '#212327', major: '#2b2e33', ink: '#f3efe7', line: '#d9d3c7' },
} as const;

/**
 * Prancha de apresentação, no espírito das pranchas de entrega de projeto:
 * fundo neutro quadriculado (ou estúdio escuro), pavimentos separados com
 * linhas de projeção tracejadas e cômodos identificados por linhas de chamada.
 */
export function PresentationBoard() {
  const active = useExperience((s) => s.mode === 'explode');
  const theme = useExperience((s) => s.boardTheme);
  const labels = useExperience((s) => s.boardLabels);
  const cut = useExperience((s) => s.cutLevel);
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    if (!active) return;
    const prev = scene.background;
    scene.background = new THREE.Color(THEME[theme].bg);
    return () => {
      scene.background = prev;
    };
  }, [active, theme, scene]);

  if (!active) return null;
  const t = THEME[theme];
  return (
    <group name="PresentationBoard">
      <GridFloor theme={theme} />
      {cut === null && <ProjectionLines color={t.line} />}
      {labels && <LabelProjector />}
      {labels &&
        ([0, 1] as Level[])
          .filter((lv) => cut === null || cut === lv)
          .map((lv) => (
            <ExplodeLevel key={lv} level={lv}>
              <AnchorDots level={lv} color={t.line} />
            </ExplodeLevel>
          ))}
    </group>
  );
}

/** Piso da prancha com grade de 1 m e 5 m, recebendo a sombra suave da casa. */
function GridFloor({ theme }: { theme: 'light' | 'dark' }) {
  const t = THEME[theme];
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const g = c.getContext('2d')!;
    g.fillStyle = t.floor;
    g.fillRect(0, 0, 512, 512);
    g.strokeStyle = t.minor;
    g.lineWidth = 2;
    for (let i = 0; i <= 5; i++) {
      const p = (i / 5) * 512;
      g.beginPath();
      g.moveTo(p, 0);
      g.lineTo(p, 512);
      g.moveTo(0, p);
      g.lineTo(512, p);
      g.stroke();
    }
    g.strokeStyle = t.major;
    g.lineWidth = 4;
    g.strokeRect(0, 0, 512, 512);
    const tx = new THREE.CanvasTexture(c);
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    tx.repeat.set(400 / 5, 400 / 5);
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.anisotropy = 8;
    return tx;
  }, [t]);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2, -0.6, 0]} receiveShadow>
      <planeGeometry args={[400, 400]} />
      <meshStandardMaterial map={tex} roughness={1} envMapIntensity={0.4} />
    </mesh>
  );
}

/** Linhas tracejadas verticais ligando os cantos do superior ao térreo (alinhamento dos pavimentos). */
function ProjectionLines({ color }: { color: string }) {
  const ref = useRef<THREE.LineSegments>(null);
  const corners = useMemo(() => {
    const f = FOOTPRINT[1][0];
    return [
      [f.x0, f.z0],
      [f.x1, f.z0],
      [f.x1, f.z1],
      [f.x0, f.z1],
    ];
  }, []);
  const geo = useMemo(() => new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(corners.length * 6), 3)), [corners]);
  const mat = useMemo(() => new THREE.LineDashedMaterial({ color, dashSize: 0.45, gapSize: 0.3, transparent: true, opacity: 0.7 }), [color]);
  const last = useRef(-1);
  useFrame(() => {
    const y = explodeState.y;
    if (Math.abs(y - last.current) < 0.005 || !ref.current) return;
    last.current = y;
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    corners.forEach(([x, z], i) => {
      pos.setXYZ(i * 2, x, LEVEL_Y[1] - 0.4, z);
      pos.setXYZ(i * 2 + 1, x, LEVEL_Y[1] + y - 0.4, z);
    });
    pos.needsUpdate = true;
    geo.computeBoundingSphere();
    ref.current.computeLineDistances();
    ref.current.visible = y > 0.8;
  });
  return <lineSegments ref={ref} geometry={geo} material={mat} />;
}

/** Âncora de cada cômodo legendado (centro do piso, um pouco acima). */
const ANCHORS = (Object.keys(LABELED) as unknown as Level[]).flatMap((lv) =>
  LABELED[lv].map((id) => {
    const rm = ROOMS.find((r) => r.id === id)!;
    return { id, level: Number(lv) as Level, pos: new THREE.Vector3((rm.rect.x0 + rm.rect.x1) / 2, LEVEL_Y[Number(lv) as Level] + 0.4, (rm.rect.z0 + rm.rect.z1) / 2) };
  }),
);

/** Cantos da volumetria de cada pavimento (base e topo das paredes). */
const CORNERS: { x: number; y: number; z: number; level: Level }[] = [
  ...[
    [-24.2, -10.2],
    [20.2, -10.2],
    [20.2, 10.2],
    [-24.2, 10.2],
  ].flatMap(([x, z]) => [0, 4].map((y) => ({ x, y: y - 0.5, z, level: 0 as Level }))),
  ...[
    [-24.2, -13],
    [20.2, -13],
    [20.2, 11.5],
    [-24.2, 11.5],
  ].flatMap(([x, z]) => [4, 7.4].map((y) => ({ x, y, z, level: 1 as Level }))),
];

/**
 * Projeta as âncoras na tela (com o deslocamento do superior) para a camada
 * 2D desenhar as legendas em colunas laterais, como numa prancha de entrega.
 */
function LabelProjector() {
  const { camera, size } = useThree();
  const last = useRef('');
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const st = useExperience.getState();
    const out = ANCHORS.filter((a) => st.cutLevel === null || st.cutLevel === a.level).map((a) => {
      tmp.copy(a.pos);
      if (a.level === 1) tmp.y += explodeState.y;
      tmp.project(camera);
      return { id: a.id, x: ((tmp.x + 1) / 2) * size.width, y: ((1 - tmp.y) / 2) * size.height, visible: tmp.z < 1 };
    });
    // contorno da casa projetado (cantos dos dois pavimentos, base e topo)
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const c of CORNERS) {
      if (st.cutLevel !== null && st.cutLevel !== c.level) continue;
      tmp.set(c.x, c.y + (c.level === 1 ? explodeState.y : 0), c.z).project(camera);
      const px = ((tmp.x + 1) / 2) * size.width;
      const py = ((1 - tmp.y) / 2) * size.height;
      minX = Math.min(minX, px);
      maxX = Math.max(maxX, px);
      minY = Math.min(minY, py);
      maxY = Math.max(maxY, py);
    }
    const bounds = Number.isFinite(minX) ? { minX, maxX, minY, maxY } : null;
    const sig = out.map((o) => `${o.id}${Math.round(o.x)},${Math.round(o.y)}`).join('|') + (bounds ? `${Math.round(minX)},${Math.round(maxX)}` : '');
    if (sig !== last.current) {
      last.current = sig;
      useBoardLabels.getState().set(out, bounds);
    }
  });
  useEffect(() => () => useBoardLabels.getState().set([], null), []);
  return null;
}

/** Ponto de ancoragem das linhas de chamada sobre o piso de cada cômodo. */
function AnchorDots({ level, color }: { level: Level; color: string }) {
  return (
    <group>
      {ANCHORS.filter((a) => a.level === level).map((a) => (
        <mesh key={a.id} position={a.pos}>
          <sphereGeometry args={[0.13, 12, 8]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
