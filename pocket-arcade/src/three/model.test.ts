import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { ArcadeModel } from './ArcadeModel/ArcadeModel';
import { BODY, LAYOUT } from './ArcadeModel/layout';
import { PALETTE } from './Materials/materials';
import { VIEWS, fitDistance } from './CameraControls/views';

const build = () => ArcadeModel.createSync(new THREE.Texture());

function named(model: ArcadeModel, name: string) {
  const out: THREE.Object3D[] = [];
  model.root.traverse((o) => o.name === name && out.push(o));
  return out;
}

describe('Modelo 3D do aparelho', () => {
  it('tem geometria com profundidade real (não é um plano)', () => {
    const m = build();
    const box = new THREE.Box3().setFromObject(m.root.getObjectByName('shell')!);
    const size = box.getSize(new THREE.Vector3());
    expect(size.x).toBeCloseTo(BODY.width, 1);
    expect(size.y).toBeCloseTo(BODY.height, 1);
    expect(size.z).toBeGreaterThan(2);
  });

  it('mantém os botões azul, amarelo e vermelho nessa ordem, da esquerda para a direita', () => {
    const m = build();
    const ids = ['blue', 'yellow', 'red'];
    const xs = ids.map((id) => m.root.getObjectByName(`button-${id}`)!.position.x);
    expect(xs[0]).toBeLessThan(xs[1]);
    expect(xs[1]).toBeLessThan(xs[2]);
    const colors = ids.map((id) => ((m.root.getObjectByName(`button-${id}-cap`) as THREE.Mesh).material as THREE.MeshStandardMaterial).color.getHexString());
    expect(colors).toEqual([PALETTE.blue, PALETTE.yellow, PALETTE.red].map((c) => new THREE.Color(c).getHexString()));
  });

  it('tem joystick à direita dos botões, mais baixo que a tela, com a carinha', () => {
    const m = build();
    const j = m.root.getObjectByName('joystick')!;
    expect(j.position.x).toBeGreaterThan(LAYOUT.buttons[2].x);
    expect(j.position.y).toBeLessThan(LAYOUT.bezel.y0);
    expect(m.root.getObjectByName('joystick-smiley')).toBeTruthy();
  });

  it('preserva parafusos, cartuchos, cabo, adesivo, cruz azul e detalhes laterais', () => {
    const m = build();
    expect(named(m, 'screw-front')).toHaveLength(4);
    for (const n of [
      'cartridge-top',
      'cartridge-side',
      'cartridge-bottom',
      'usb-cable-wire',
      'sticker-play',
      'clover',
      'pill-start',
      'label-plate',
      'side-knob',
      'side-slider-red',
      'side-magenta-pill',
      'side-magenta-dot',
      'top-loop',
      'bezel',
      'display',
    ]) {
      expect(m.root.getObjectByName(n), n).toBeTruthy();
    }
    expect(named(m, 'side-vent').length).toBeGreaterThanOrEqual(10);
  });

  it('expõe os controles para toque/clique', () => {
    const m = build();
    const controls = new Set(m.pickables.map((o) => o.userData.control));
    for (const c of ['blue', 'yellow', 'red', 'start', 'joystick', 'cart:top', 'cart:side', 'cart:bottom']) expect(controls.has(c), c).toBe(true);
  });

  it('anima pressão de botão, joystick e retirada/reinserção de cartucho', () => {
    const m = build();
    const btn = m.root.getObjectByName('button-blue')!;
    const z0 = btn.position.z;
    m.setPressed('blue', true);
    for (let i = 0; i < 30; i++) m.update(1 / 60);
    expect(btn.position.z).toBeLessThan(z0 - 0.1);
    m.setPressed('blue', false);
    for (let i = 0; i < 30; i++) m.update(1 / 60);
    expect(btn.position.z).toBeCloseTo(z0, 2);

    m.setStick(1, 0);
    for (let i = 0; i < 30; i++) m.update(1 / 60);
    expect(m.root.getObjectByName('joystick-stick')!.rotation.y).toBeGreaterThan(0.2);

    const cart = m.root.getObjectByName('cartridge-top')!;
    const y0 = cart.position.y;
    m.setCartridgeOut('top', true);
    expect(m.isCartridgeInserted('top')).toBe(false);
    for (let i = 0; i < 120; i++) m.update(1 / 60);
    expect(cart.position.y).toBeGreaterThan(y0 + 2);
    m.setCartridgeOut('top', false);
    for (let i = 0; i < 240; i++) m.update(1 / 60);
    expect(cart.position.y).toBeCloseTo(y0, 2);
  });

  it('o cabo tem variante apoiada para o aparelho deitado (RA)', () => {
    const m = build();
    m.setCableResting(true);
    expect(m.root.getObjectByName('usb-cable-wire')!.visible).toBe(false);
    expect(m.root.getObjectByName('usb-cable-wire-resting')!.visible).toBe(true);
  });
});

describe('Câmera', () => {
  it('enquadra mais longe em telas estreitas (retrato)', () => {
    const v = VIEWS.play;
    expect(fitDistance(20, 390 / 650, v.frameWidth, v.frameHeight)).toBeGreaterThan(fitDistance(20, 16 / 9, v.frameWidth, v.frameHeight));
  });

  it('tem as vistas frontal, laterais, traseira e superior', () => {
    for (const id of ['front', 'left', 'right', 'back', 'top', 'hero'] as const) expect(VIEWS[id]).toBeTruthy();
    expect(VIEWS.back.azimuth).toBe(180);
  });
});
