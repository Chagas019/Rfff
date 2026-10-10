import { chromium } from 'playwright';
import fs from 'fs';
const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
await page.goto('http://localhost:5180/calendario', { waitUntil:'load' });
await page.waitForTimeout(1500);
const res = await page.evaluate(async () => {
  const { GLTFExporter } = await import('/node_modules/three/examples/jsm/exporters/GLTFExporter.js');
  const m = await import('/src/three/car/materials.js');
  const b = await import('/src/three/car/build.js');
  const t0 = performance.now(); const M = m.createMaterials(); const tMat = performance.now()-t0;
  const car = b.buildCar();
  // nomeia materiais para trocar de volta em tempo de execução
  const names = new Map(Object.entries(car.M).map(([k, v]) => [v, k]));
  car.root.traverse((o) => { if (o.isMesh) { const n = names.get(o.material); if (n) o.material.name = n; else if (!o.material.name) { for (const [mat,k] of names) { if (mat.type===o.material.type && mat.color && o.material.color && mat.color.equals(o.material.color) && mat.roughness===o.material.roughness) { o.material.name = k; break; } } } } });
  // pivôs das asas móveis
  car.aero.frontWing.flapPivots.forEach((p, i) => { p.name = 'fwFlap' + i; p.userData.flapAngle = car.aero.frontWing.flapAngles[i]; });
  car.aero.rearWing.flapPivots.forEach((p, i) => { p.name = 'rwFlap' + i; p.userData.flapAngle = car.aero.rearWing.flapAngles[i]; });
  car.root.traverse((o) => { if (o.userData) { for (const k of Object.keys(o.userData)) if (k !== 'flapAngle') delete o.userData[k]; } });
  const glb = await new GLTFExporter().parseAsync(car.root, { binary: true, onlyVisible: false });
  const bytes = new Uint8Array(glb);
  let s = ''; for (let i = 0; i < bytes.length; i += 32768) s += String.fromCharCode(...bytes.subarray(i, i + 32768));
  let meshes = 0, unnamed = 0; car.root.traverse(o => { if (o.isMesh) { meshes++; if (!o.material.name) unnamed++; } });
  return { b64: btoa(s), tMat, meshes, unnamed };
});
fs.writeFileSync(process.argv[2], Buffer.from(res.b64, 'base64'));
console.log('size', fs.statSync(process.argv[2]).size, 'materials ms', Math.round(res.tMat), 'meshes', res.meshes, 'unnamed', res.unnamed);
await browser.close();
