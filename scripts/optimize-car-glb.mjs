import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld, quantize, meshopt, join, simplify } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
await MeshoptEncoder.ready; await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(process.argv[2]);
for (const t of doc.getRoot().listTextures()) t.dispose();
await doc.transform(
  dedup(),
  weld(),
  // junta peças irmãs com o mesmo material (menos chamadas de desenho); mantém nós nomeados (asas móveis)
  join({ keepNamed: true }),
  // simplificação conservadora (erro relativo minúsculo): tira só triângulos redundantes
  simplify({ simplifier: MeshoptSimplifier, ratio: 0.5, error: 0.0004, lockBorder: true }),
  prune({ keepLeaves: true, keepAttributes: true }),
  quantize(),
  meshopt({ encoder: MeshoptEncoder, level: 'high' }),
);
await io.write(process.argv[3], doc);
