import * as THREE from 'three';
import type { ArcadeMaterials } from '../Materials/materials';
import { PALETTE } from '../Materials/materials';
import {
  chevronTexture,
  groffiTexture,
  labelTexture,
  marksTexture,
  memoryCardTexture,
  playStickerTexture,
  smileyTexture,
} from '../Materials/decals';
import { ACCESSORIES, BODY, LAYOUT, LEFT_SIDE, SIDE_Z } from './layout';
import { circleHole, cloverShape, extrude, knurlShape, lathe, mesh, normalizeUVs, roundedRect } from './shapes';

const HALF_W = BODY.width / 2;
const HALF_H = BODY.height / 2;

/** Material de decalque: transparente, sem briga de profundidade com a superfície. */
function decalMaterial(map: THREE.Texture, opts: { roughness?: number; transparent?: boolean } = {}) {
  return new THREE.MeshPhysicalMaterial({
    map,
    transparent: opts.transparent ?? true,
    roughness: opts.roughness ?? 0.4,
    clearcoat: 0.4,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    depthWrite: !(opts.transparent ?? true),
  });
}

/** Coloca uma peça plana (desenhada no plano XY) na lateral esquerda, virada para −X. */
function onLeftSide(obj: THREE.Object3D, y: number, z = SIDE_Z, lift = 0) {
  obj.rotation.y = -Math.PI / 2;
  obj.position.set(-HALF_W - lift, y, z);
  return obj;
}
function onRightSide(obj: THREE.Object3D, y: number, z = SIDE_Z, lift = 0) {
  obj.rotation.y = Math.PI / 2;
  obj.position.set(HALF_W + lift, y, z);
  return obj;
}
function onTop(obj: THREE.Object3D, x: number, z = SIDE_Z, lift = 0) {
  obj.rotation.x = -Math.PI / 2;
  obj.position.set(x, HALF_H + lift, z);
  return obj;
}
function onBottom(obj: THREE.Object3D, x: number, z = SIDE_Z, lift = 0) {
  obj.rotation.x = Math.PI / 2;
  obj.position.set(x, -HALF_H - lift, z);
  return obj;
}

// ---------------------------------------------------------------------------
// Carcaça
// ---------------------------------------------------------------------------

export function buildShell(mats: ArcadeMaterials) {
  const g = new THREE.Group();
  g.name = 'shell';
  const { width: W, height: H, cornerRadius: R, frontBevel: fb, backBevel: bb } = BODY;
  const seamTop = BODY.seamZ + BODY.seamGap / 2;
  const seamBottom = BODY.seamZ - BODY.seamGap / 2;

  // Placa frontal, com os poços dos três botões.
  const front = roundedRect(W - 2 * fb, H - 2 * fb, R - fb, new THREE.Shape());
  for (const b of LAYOUT.buttons) front.holes.push(circleHole(b.x, b.y, LAYOUT.buttonWell));
  const frontDepth = BODY.frontZ - seamTop - 2 * fb;
  const frontGeo = extrude(front, { depth: frontDepth, bevel: fb, bevelSegments: 4, curveSegments: 14 });
  const frontMesh = mesh(frontGeo, mats.shell, 'front-plate');
  frontMesh.position.z = seamTop;
  g.add(frontMesh);

  // Concha traseira, mais arredondada.
  const back = roundedRect(W - 2 * bb, H - 2 * bb, R - bb, new THREE.Shape());
  const backDepth = seamBottom - BODY.backZ - 2 * bb;
  const backMesh = mesh(extrude(back, { depth: backDepth, bevel: bb, bevelSegments: 5, curveSegments: 14 }), mats.shell, 'back-shell');
  backMesh.position.z = BODY.backZ;
  g.add(backMesh);

  // Núcleo escuro visível só no friso entre as duas partes.
  const core = roundedRect(W - 0.14, H - 0.14, R - 0.07, new THREE.Shape());
  const coreMesh = mesh(extrude(core, { depth: 0.5, curveSegments: 12 }), mats.seam, 'seam');
  coreMesh.position.z = BODY.seamZ - 0.25;
  g.add(coreMesh);

  // Poços dos botões: parede interna escura (o fundo é o núcleo do friso).
  const wellMat = mats.dark.clone();
  wellMat.side = THREE.DoubleSide;
  for (const b of LAYOUT.buttons) {
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(LAYOUT.buttonWell, LAYOUT.buttonWell, BODY.frontZ - seamTop, 48, 1, true), wellMat);
    wall.rotation.x = Math.PI / 2;
    wall.position.set(b.x, b.y, (BODY.frontZ + seamTop) / 2 - 0.01);
    wall.name = `well-${b.id}`;
    g.add(wall);
  }

  // Traseira (não aparece na foto): só o essencial, discreto e coerente.
  const coverShape = roundedRect(6.2, 4.2, 0.5, new THREE.Shape());
  const cover = mesh(extrude(coverShape, { depth: 0.005, bevel: 0.02 }), mats.shell, 'back-cover');
  cover.rotation.y = Math.PI;
  cover.position.set(0, -2.6, BODY.backZ + 0.004);
  g.add(cover);
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const foot = mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.08, 24), mats.dark, 'rubber-foot');
      foot.rotation.x = Math.PI / 2;
      foot.position.set(sx * (HALF_W - 1.2), sy * (HALF_H - 1.2), BODY.backZ - 0.03);
      g.add(foot);
    }
  }

  return g;
}

export function buildScrews(mats: ArcadeMaterials) {
  const g = new THREE.Group();
  g.name = 'screws';
  const headGeo = lathe(
    [
      [0, 0.07],
      [0.12, 0.068],
      [0.17, 0.05],
      [LAYOUT.screwRadius, 0.02],
      [LAYOUT.screwRadius, 0],
      [0, 0],
    ],
    32,
  );
  const slotGeo = new THREE.BoxGeometry(0.22, 0.045, 0.06);
  const ringGeo = new THREE.TorusGeometry(LAYOUT.screwRadius + 0.02, 0.025, 8, 32);
  const inset = LAYOUT.screwInset;
  const spots: Array<[number, number, number, string]> = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) spots.push([sx * (HALF_W - inset), sy * (HALF_H - inset), BODY.frontZ, 'front']);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) spots.push([sx * (HALF_W - inset), sy * (HALF_H - inset), BODY.backZ, 'back']);
  for (const [x, y, z, side] of spots) {
    const s = new THREE.Group();
    s.name = `screw-${side}`;
    const head = mesh(headGeo, mats.metal, 'screw-head');
    s.add(head);
    const ring = new THREE.Mesh(ringGeo, mats.seam);
    s.add(ring);
    for (const rot of [Math.PI / 4, -Math.PI / 4]) {
      const slot = new THREE.Mesh(slotGeo, mats.dark);
      slot.rotation.z = rot;
      slot.position.z = 0.06;
      s.add(slot);
    }
    s.position.set(x, y, z);
    if (side === 'back') s.rotation.y = Math.PI;
    g.add(s);
  }
  return g;
}

// ---------------------------------------------------------------------------
// Frente: tela, indicador, adesivo, cruz azul, etiqueta
// ---------------------------------------------------------------------------

export function buildScreen(mats: ArcadeMaterials, screenTexture: THREE.Texture) {
  const g = new THREE.Group();
  g.name = 'screen';
  const b = LAYOUT.bezel;
  const w = b.x1 - b.x0;
  const h = b.y1 - b.y0;
  const cx = (b.x0 + b.x1) / 2;
  const cy = (b.y0 + b.y1) / 2;

  const bezel = mesh(extrude(roundedRect(w, h, b.radius, new THREE.Shape()), { depth: 0.01, bevel: 0.025, bevelSegments: 2, curveSegments: 8 }), mats.bezel, 'bezel');
  bezel.position.set(cx, cy, BODY.frontZ - 0.01);
  g.add(bezel);

  const dw = w - 2 * b.border;
  const dh = h - b.border - b.bottomBorder;
  const displayGeo = normalizeUVs(new THREE.ShapeGeometry(roundedRect(dw, dh, b.radius - 0.12, new THREE.Shape()), 16));
  const displayMat = new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false, name: 'display' });
  const display = new THREE.Mesh(displayGeo, displayMat);
  display.name = 'display';
  display.position.set(cx, cy + (b.bottomBorder - b.border) / 2, BODY.frontZ + 0.052);
  g.add(display);

  const glass = new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(w - 0.04, h - 0.04, b.radius, new THREE.Shape()), 16), mats.glass);
  glass.name = 'glass';
  glass.position.set(cx, cy, BODY.frontZ + 0.058);
  glass.renderOrder = 2;
  g.add(glass);

  return { group: g, display };
}

export function buildFrontDetails(mats: ArcadeMaterials) {
  const g = new THREE.Group();
  g.name = 'front-details';

  // Indicador/botão horizontal branco (funciona como Start/Pausa).
  const p = LAYOUT.pill;
  const pillGroup = new THREE.Group();
  pillGroup.name = 'pill-start';
  const pill = mesh(extrude(roundedRect(p.w, p.h, p.h / 2, new THREE.Shape()), { depth: 0.03, bevel: 0.05, bevelSegments: 4 }), mats.pill, 'pill');
  pill.userData.control = 'start';
  pillGroup.add(pill);
  pillGroup.position.set(p.x, p.y, BODY.frontZ - 0.02);
  g.add(pillGroup);

  // Adesivo "Play".
  const pl = LAYOUT.play;
  const play = new THREE.Mesh(new THREE.PlaneGeometry(pl.w, pl.w / 2), decalMaterial(playStickerTexture(), { roughness: 0.3 }));
  play.name = 'sticker-play';
  play.position.set(pl.x, pl.y, BODY.frontZ + 0.004);
  play.rotation.z = pl.rotation;
  play.receiveShadow = true;
  g.add(play);

  // Cruz arredondada azul (decorativa, em relevo).
  const c = LAYOUT.clover;
  const clover = mesh(extrude(cloverShape(c.radius, 96), { depth: 0.05, bevel: 0.045, bevelSegments: 3, curveSegments: 1 }), mats.plastic(PALETTE.clover, { roughness: 0.42, clearcoat: 0.4 }), 'clover');
  clover.position.set(c.x, c.y, BODY.frontZ - 0.01);
  clover.rotation.z = 0.36;
  g.add(clover);

  // Etiqueta em relevo "Fast Campus".
  const l = LAYOUT.label;
  const label = mesh(extrude(roundedRect(l.w, l.h, l.h / 2, new THREE.Shape()), { depth: 0.01, bevel: 0.035, bevelSegments: 4 }), mats.shell, 'label-plate');
  label.position.set(l.x, l.y, BODY.frontZ - 0.01);
  g.add(label);
  const labelText = new THREE.Mesh(new THREE.PlaneGeometry(l.w, l.w / 4), decalMaterial(labelTexture(), { roughness: 0.5 }));
  labelText.name = 'label-text';
  labelText.scale.y = (l.h / (l.w / 4));
  labelText.position.set(l.x, l.y, BODY.frontZ + 0.072);
  g.add(labelText);

  return { group: g, pill: pillGroup };
}

// ---------------------------------------------------------------------------
// Botões e joystick
// ---------------------------------------------------------------------------

const BUTTON_COLORS: Record<string, string> = { blue: PALETTE.blue, yellow: PALETTE.yellow, red: PALETTE.red };

export function buildButtons(mats: ArcadeMaterials) {
  const groups: Record<string, THREE.Group> = {};
  const r = LAYOUT.buttonRadius;
  // perfil: colar largo dentro do poço, capa com borda arredondada e topo côncavo
  const geo = lathe(
    [
      [0.001, -0.5],
      [r + 0.06, -0.5],
      [r + 0.06, 0.14],
      [r + 0.03, 0.2],
      [r - 0.03, 0.23],
      [r - 0.03, 0.42],
      [r - 0.01, 0.48],
      [r - 0.05, 0.54],
      [r - 0.13, 0.565],
      [r - 0.25, 0.54],
      [r * 0.4, 0.49],
      [0.001, 0.475],
    ],
    56,
  );
  for (const b of LAYOUT.buttons) {
    const grp = new THREE.Group();
    grp.name = `button-${b.id}`;
    const m = mesh(geo, mats.plastic(BUTTON_COLORS[b.id], { roughness: 0.22, clearcoat: 1 }), `button-${b.id}-cap`);
    m.userData.control = b.id;
    grp.add(m);
    grp.position.set(b.x, b.y, BODY.frontZ);
    groups[b.id] = grp;
  }
  return groups;
}

export function buildJoystick(mats: ArcadeMaterials) {
  const j = LAYOUT.joystick;
  const g = new THREE.Group();
  g.name = 'joystick';
  g.position.set(j.x, j.y, BODY.frontZ);

  const R = j.housingRadius;
  const housing = mesh(
    lathe(
      [
        [0.001, 0],
        [R + 0.06, 0],
        [R + 0.06, 0.04],
        [R, 0.08],
        [R, 1.12],
        [R - 0.04, 1.2],
        [R - 0.1, 1.23],
        [R - 0.16, 1.23],
        [j.capRadius + 0.06, 1.18],
        [j.capRadius + 0.06, 0.9],
        [0.001, 0.9],
      ],
      72,
    ),
    mats.gunmetal,
    'joystick-housing',
  );
  housing.userData.control = 'joystick';
  g.add(housing);

  const baseRing = mesh(new THREE.TorusGeometry(R + 0.03, 0.035, 10, 72), mats.chrome, 'joystick-base-ring');
  baseRing.position.z = 0.05;
  g.add(baseRing);
  const topRing = mesh(new THREE.TorusGeometry(R - 0.12, 0.03, 10, 72), mats.chrome, 'joystick-chrome-ring');
  topRing.position.z = 1.215;
  g.add(topRing);

  // Parte articulada: haste + capa amarela com borda branca e carinha.
  const stick = new THREE.Group();
  stick.name = 'joystick-stick';
  stick.position.z = 0.62; // pivô dentro da carcaça
  const shaft = mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.6, 24), mats.dark, 'joystick-shaft');
  shaft.rotation.x = Math.PI / 2;
  shaft.position.z = 0.3;
  stick.add(shaft);
  const capR = j.capRadius;
  const cap = mesh(
    lathe(
      [
        [0.001, 0.5],
        [capR - 0.02, 0.5],
        [capR, 0.54],
        [capR, 0.7],
        [capR - 0.05, 0.76],
        [0.001, 0.76],
      ],
      72,
    ),
    mats.plastic(PALETTE.capYellow, { roughness: 0.3, clearcoat: 0.9 }),
    'joystick-cap',
  );
  cap.userData.control = 'joystick';
  stick.add(cap);
  const whiteRing = mesh(new THREE.TorusGeometry(capR - 0.04, 0.045, 10, 72), mats.pill, 'joystick-white-ring');
  whiteRing.position.z = 0.735;
  stick.add(whiteRing);
  const face = new THREE.Mesh(new THREE.CircleGeometry(capR - 0.1, 72), decalMaterial(smileyTexture(), { transparent: false, roughness: 0.3 }));
  face.name = 'joystick-smiley';
  face.position.z = 0.762;
  face.userData.control = 'joystick';
  stick.add(face);
  g.add(stick);

  return { group: g, stick };
}

// ---------------------------------------------------------------------------
// Laterais e base
// ---------------------------------------------------------------------------

export function buildSides(mats: ArcadeMaterials) {
  const g = new THREE.Group();
  g.name = 'sides';

  // Lateral esquerda — seletor vermelho no topo.
  const s = LEFT_SIDE.slider;
  const slot = new THREE.Mesh(extrude(roundedRect(s.width, s.length, s.width / 2, new THREE.Shape()), { depth: 0.006 }), mats.dark);
  slot.name = 'side-slider-slot';
  g.add(onLeftSide(slot, s.y));
  const knob = mesh(extrude(roundedRect(s.width - 0.12, s.length * 0.42, (s.width - 0.12) / 2, new THREE.Shape()), { depth: 0.04, bevel: 0.03 }), mats.plastic(PALETTE.sliderRed), 'side-slider-red');
  g.add(onLeftSide(knob, s.y + s.length * 0.22));

  // Aberturas de ventilação.
  const v = LEFT_SIDE.vents;
  const ventGeo = extrude(roundedRect(v.length, v.thickness, v.thickness / 2, new THREE.Shape()), { depth: 0.004, curveSegments: 3 });
  for (let i = 0; i < v.count; i++) {
    const y = v.yTop - ((v.yTop - v.yBottom) * i) / (v.count - 1);
    const vent = new THREE.Mesh(ventGeo, mats.dark);
    vent.name = 'side-vent';
    g.add(onLeftSide(vent, y));
  }

  // Seletor circular metálico recartilhado.
  const k = LEFT_SIDE.knob;
  const neck = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.16, 24), mats.metal, 'side-knob-neck');
  neck.rotation.z = Math.PI / 2;
  neck.position.set(-HALF_W - 0.08, k.y, SIDE_Z);
  g.add(neck);
  const knurl = mesh(extrude(knurlShape(k.radius, k.radius - 0.035, 40), { depth: k.length - 0.12, bevel: 0.03, bevelSegments: 1, curveSegments: 1 }), mats.metal, 'side-knob');
  g.add(onLeftSide(knurl, k.y, SIDE_Z, 0.14));
  const knobCap = mesh(new THREE.CylinderGeometry(k.radius - 0.08, k.radius - 0.08, 0.02, 40), mats.chrome, 'side-knob-cap');
  knobCap.rotation.z = Math.PI / 2;
  knobCap.position.set(-HALF_W - 0.14 - k.length + 0.02, k.y, SIDE_Z);
  g.add(knobCap);

  // Detalhes magenta.
  const mp = LEFT_SIDE.magentaPill;
  const magenta = mats.plastic(PALETTE.magenta, { roughness: 0.25 });
  const pillRecess = new THREE.Mesh(extrude(roundedRect(mp.width + 0.08, mp.length + 0.08, (mp.width + 0.08) / 2, new THREE.Shape()), { depth: 0.004 }), mats.seam);
  g.add(onLeftSide(pillRecess, mp.y));
  const pill = mesh(extrude(roundedRect(mp.width, mp.length, mp.width / 2, new THREE.Shape()), { depth: 0.03, bevel: 0.03 }), magenta, 'side-magenta-pill');
  g.add(onLeftSide(pill, mp.y));
  const md = LEFT_SIDE.magentaDot;
  const dot = mesh(extrude(new THREE.Shape().absarc(0, 0, md.radius, 0, Math.PI * 2, false), { depth: 0.02, bevel: 0.03 }), magenta, 'side-magenta-dot');
  g.add(onLeftSide(dot, md.y));

  // Lateral direita: encaixe do cartão.
  const sc = ACCESSORIES.sideCard;
  const cardSlot = new THREE.Mesh(extrude(roundedRect(sc.thickness + 0.1, sc.length + 0.12, 0.06, new THREE.Shape()), { depth: 0.004 }), mats.dark);
  cardSlot.name = 'side-card-slot';
  g.add(onRightSide(cardSlot, sc.y, sc.z));

  // Topo: encaixe do cartucho.
  const tc = ACCESSORIES.topCartridge;
  const topSlot = new THREE.Mesh(extrude(roundedRect(tc.width + 0.12, tc.thickness + 0.1, 0.06, new THREE.Shape()), { depth: 0.004 }), mats.dark);
  topSlot.name = 'top-cartridge-slot';
  g.add(onTop(topSlot, tc.x));

  // Base: encaixe da peça vermelha, porta USB, marcações e furo.
  const bt = ACCESSORIES.bottomTab;
  const bottomSlot = new THREE.Mesh(extrude(roundedRect(bt.width + 0.12, bt.thickness + 0.1, 0.06, new THREE.Shape()), { depth: 0.004 }), mats.dark);
  bottomSlot.name = 'bottom-tab-slot';
  g.add(onBottom(bottomSlot, bt.x));
  const port = new THREE.Mesh(extrude(roundedRect(0.95, 0.36, 0.17, new THREE.Shape()), { depth: 0.004 }), mats.dark);
  port.name = 'usb-port';
  g.add(onBottom(port, ACCESSORIES.usb.x));
  const marks = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), decalMaterial(marksTexture(), { roughness: 0.6 }));
  marks.name = 'bottom-marks';
  g.add(onBottom(marks, ACCESSORIES.marks.x, SIDE_Z, 0.003));
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), mats.dark);
  hole.name = 'pinhole';
  g.add(onBottom(hole, ACCESSORIES.pinhole.x, SIDE_Z, 0.003));

  return g;
}

// ---------------------------------------------------------------------------
// Cartuchos removíveis, argola e cabo
// ---------------------------------------------------------------------------

export type CartridgeSlot = 'top' | 'side' | 'bottom';

export interface CartridgePart {
  slot: CartridgeSlot;
  group: THREE.Group;
  /** Direção (no espaço do aparelho) em que o cartucho sai do encaixe. */
  direction: THREE.Vector3;
  /** Quanto precisa andar para sair completamente. */
  travel: number;
  home: THREE.Vector3;
}

export function buildCartridges(mats: ArcadeMaterials): CartridgePart[] {
  const parts: CartridgePart[] = [];

  // Cartucho amarelo do topo ("groffi").
  {
    const c = ACCESSORIES.topCartridge;
    const grp = new THREE.Group();
    grp.name = 'cartridge-top';
    const tab = new THREE.Shape();
    const w = c.width;
    const top = c.exposed;
    const rr = 0.62;
    tab.moveTo(-w / 2, 0);
    tab.lineTo(-w / 2, top - rr);
    tab.quadraticCurveTo(-w / 2, top, -w / 2 + rr, top);
    tab.lineTo(w / 2 - rr, top);
    tab.quadraticCurveTo(w / 2, top, w / 2, top - rr);
    tab.lineTo(w / 2, 0);
    // parte que entra no aparelho (mais estreita)
    tab.lineTo(w / 2 - 0.15, 0);
    tab.lineTo(w / 2 - 0.15, -c.insideLength);
    tab.lineTo(-w / 2 + 0.15, -c.insideLength);
    tab.lineTo(-w / 2 + 0.15, 0);
    tab.lineTo(-w / 2, 0);
    tab.holes.push(circleHole(0, top - 0.5, 0.19));
    const yellow = mats.plastic(PALETTE.cartridgeYellow, { roughness: 0.35, clearcoat: 0.6 });
    const body = mesh(extrude(tab, { depth: c.thickness - 0.1, bevel: 0.05, bevelSegments: 3 }), yellow, 'cartridge-top-body');
    body.position.z = -c.thickness / 2;
    body.userData.control = 'cart:top';
    grp.add(body);
    const text = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7 * (192 / 512)), decalMaterial(groffiTexture(), { roughness: 0.4 }));
    text.name = 'cartridge-top-groffi';
    text.position.set(0, 0.62, c.thickness / 2 + 0.002);
    text.userData.control = 'cart:top';
    grp.add(text);
    for (let i = 0; i < 6; i++) {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.01), mats.gold);
      pin.position.set(-0.6 + i * 0.24, -c.insideLength + 0.35, c.thickness / 2 + 0.002);
      grp.add(pin);
    }
    const home = new THREE.Vector3(c.x, HALF_H, SIDE_Z);
    grp.position.copy(home);
    parts.push({ slot: 'top', group: grp, direction: new THREE.Vector3(0, 1, 0), travel: c.insideLength + 0.4, home });
  }

  // Cartão azul da lateral direita ("Memory Card").
  {
    const c = ACCESSORIES.sideCard;
    const grp = new THREE.Group();
    grp.name = 'cartridge-side';
    const total = c.insideLength + c.exposed;
    const shape = roundedRect(total, c.length, 0.16, new THREE.Shape());
    const body = mesh(extrude(shape, { depth: c.thickness - 0.06, bevel: 0.03, bevelSegments: 2 }), mats.plastic(PALETTE.memoryBlue, { roughness: 0.3 }), 'cartridge-side-body');
    body.position.set(c.exposed - total / 2, 0, -c.thickness / 2);
    body.userData.control = 'cart:side';
    grp.add(body);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(c.exposed - 0.12, c.length - 0.2), decalMaterial(memoryCardTexture(), { transparent: false, roughness: 0.5 }));
    label.name = 'cartridge-side-label';
    label.position.set(c.exposed / 2, 0, c.thickness / 2 + 0.002);
    label.userData.control = 'cart:side';
    grp.add(label);
    const home = new THREE.Vector3(HALF_W, c.y, c.z);
    grp.position.copy(home);
    parts.push({ slot: 'side', group: grp, direction: new THREE.Vector3(1, 0, 0), travel: c.insideLength + 0.4, home });
  }

  // Peça vermelha da base.
  {
    const c = ACCESSORIES.bottomTab;
    const grp = new THREE.Group();
    grp.name = 'cartridge-bottom';
    const w = c.width;
    const s = new THREE.Shape();
    const rr = 0.85;
    s.moveTo(-w / 2, c.insideLength);
    s.lineTo(-w / 2, -c.exposed + rr);
    s.quadraticCurveTo(-w / 2, -c.exposed, -w / 2 + rr, -c.exposed);
    s.lineTo(w / 2 - rr, -c.exposed);
    s.quadraticCurveTo(w / 2, -c.exposed, w / 2, -c.exposed + rr);
    s.lineTo(w / 2, c.insideLength);
    s.lineTo(-w / 2, c.insideLength);
    const body = mesh(extrude(s, { depth: c.thickness - 0.12, bevel: 0.06, bevelSegments: 3 }), mats.plastic(PALETTE.tabRed, { roughness: 0.32, clearcoat: 0.7 }), 'cartridge-bottom-body');
    body.position.z = -c.thickness / 2;
    body.userData.control = 'cart:bottom';
    grp.add(body);
    const chevron = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), decalMaterial(chevronTexture(), { transparent: false, roughness: 0.35 }));
    chevron.name = 'cartridge-bottom-chevron';
    chevron.position.set(0, -c.exposed + 0.6, c.thickness / 2 + 0.002);
    chevron.userData.control = 'cart:bottom';
    grp.add(chevron);
    const home = new THREE.Vector3(c.x, -HALF_H, SIDE_Z);
    grp.position.copy(home);
    parts.push({ slot: 'bottom', group: grp, direction: new THREE.Vector3(0, -1, 0), travel: c.insideLength + 0.4, home });
  }

  return parts;
}

export function buildTopLoop(mats: ArcadeMaterials) {
  const g = new THREE.Group();
  g.name = 'top-loop';
  const bead = mesh(lathe([[0.001, 0], [0.17, 0], [0.19, 0.12], [0.12, 0.3], [0.001, 0.32]], 20), new THREE.MeshStandardMaterial({ color: '#a86a45', metalness: 0.8, roughness: 0.35, name: 'copper' }), 'top-loop-bead');
  bead.rotation.x = -Math.PI / 2;
  g.add(bead);
  const curve = new THREE.CatmullRomCurve3(
    [new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(-0.32, 0.85, 0), new THREE.Vector3(-0.08, 1.05, 0), new THREE.Vector3(0.1, 1.05, 0), new THREE.Vector3(0.34, 0.85, 0)],
    true,
    'catmullrom',
    0.2,
  );
  const ring = mesh(new THREE.TubeGeometry(curve, 64, 0.045, 8, true), mats.chrome, 'top-loop-ring');
  ring.rotation.y = 0.5;
  ring.rotation.x = -0.25;
  g.add(ring);
  g.scale.setScalar(1.3);
  g.position.set(ACCESSORIES.topLoop.x, HALF_H, 0.15);
  return g;
}

export function buildCable(mats: ArcadeMaterials) {
  const g = new THREE.Group();
  g.name = 'usb-cable';
  const x = ACCESSORIES.usb.x;
  const y = -HALF_H;
  // conector metálico + capa branca + alívio de tensão
  const shellPlug = mesh(extrude(roundedRect(0.84, 0.28, 0.13, new THREE.Shape()), { depth: 0.45 }), mats.chrome, 'usb-plug-metal');
  g.add(onBottom(shellPlug, x, SIDE_Z, -0.2));
  const housing = mesh(extrude(roundedRect(1.0, 0.52, 0.24, new THREE.Shape()), { depth: 0.9, bevel: 0.06 }), mats.cable, 'usb-plug-housing');
  g.add(onBottom(housing, x, SIDE_Z, 0.22));
  const relief = mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.45, 20), mats.cable, 'usb-strain-relief');
  relief.position.set(x, y - 1.42, SIDE_Z);
  g.add(relief);

  const pts = [
    [x, y - 1.6, SIDE_Z],
    [x + 0.05, y - 2.8, SIDE_Z + 0.15],
    [x + 0.7, y - 4.6, SIDE_Z + 0.8],
    [x + 2.4, y - 5.7, SIDE_Z + 1.1],
    [x + 4.2, y - 5.5, SIDE_Z + 0.6],
    [x + 5.5, y - 4.8, SIDE_Z - 0.2],
    [x + 5.9, y - 5.5, SIDE_Z - 0.9],
    [x + 5.3, y - 7.4, SIDE_Z - 1.4],
    [x + 4.2, y - 9.4, SIDE_Z - 1.8],
  ].map(([a, b, c]) => new THREE.Vector3(a, b, c));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const hanging = mesh(new THREE.TubeGeometry(curve, 220, 0.12, 12, false), mats.cable, 'usb-cable-wire');
  g.add(hanging);

  // Variante "apoiada": com o aparelho deitado na mesa (modo RA), o cabo fica no plano da mesa.
  const tableZ = BODY.backZ - 0.04 + 0.12;
  const restingPts = pts.map((p, i) => new THREE.Vector3(p.x, p.y, i === 0 ? p.z : i === 1 ? (p.z + tableZ) / 2 : tableZ));
  const resting = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(restingPts, false, 'centripetal'), 220, 0.12, 12, false), mats.cable, 'usb-cable-wire-resting');
  resting.visible = false;
  g.add(resting);
  return { group: g, hanging, resting };
}
