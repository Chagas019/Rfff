import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld, quantize, meshopt, simplify } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
await MeshoptEncoder.ready; await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(process.argv[2]);
// texturas são recriadas em tempo de execução (createMaterials)
for (const t of doc.getRoot().listTextures()) t.dispose();
await doc.transform(dedup(), weld(), prune({ keepLeaves: true, keepAttributes: true }), quantize(), meshopt({ encoder: MeshoptEncoder, level: 'high' }));
await io.write(process.argv[3], doc);
