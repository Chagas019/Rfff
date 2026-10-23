import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface StudioLighting {
  group: THREE.Group;
  environment: THREE.Texture;
  key: THREE.DirectionalLight;
  ground: THREE.Mesh;
  dispose: () => void;
}

/**
 * Iluminação de estúdio: ambiente gerado localmente (RoomEnvironment, sem baixar HDR),
 * luz principal no alto à direita (na foto a lateral esquerda fica na sombra, com reflexo lilás),
 * preenchimento suave e contraluz para destacar o contorno.
 */
export function createStudioLighting(renderer: THREE.WebGLRenderer, opts: { shadowMapSize?: number } = {}): StudioLighting {
  const group = new THREE.Group();
  group.name = 'studio-lighting';

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.035).texture;
  room.dispose();
  pmrem.dispose();

  const key = new THREE.DirectionalLight('#fff7f0', 2.1);
  key.name = 'key-light';
  key.position.set(10, 15, 16);
  key.castShadow = true;
  const size = opts.shadowMapSize ?? 2048;
  key.shadow.mapSize.set(size, size);
  key.shadow.camera.left = -12;
  key.shadow.camera.right = 12;
  key.shadow.camera.top = 14;
  key.shadow.camera.bottom = -18;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 60;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 4;
  group.add(key);

  const fill = new THREE.DirectionalLight('#d4cff2', 0.4);
  fill.name = 'fill-light';
  fill.position.set(-14, 3, 6);
  group.add(fill);

  const rim = new THREE.DirectionalLight('#ffffff', 0.9);
  rim.name = 'rim-light';
  rim.position.set(4, 8, -14);
  group.add(rim);

  group.add(new THREE.HemisphereLight('#efeaff', '#a9a2c2', 0.4));

  // Chão invisível que só recebe sombra (sombra de contato suave sob o aparelho).
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ color: '#4a4058', opacity: 0.1 }));
  ground.name = 'shadow-catcher';
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -16.2;
  ground.receiveShadow = true;
  group.add(ground);

  return {
    group,
    environment,
    key,
    ground,
    dispose: () => {
      environment.dispose();
      ground.geometry.dispose();
      (ground.material as THREE.Material).dispose();
    },
  };
}
