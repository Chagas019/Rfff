#!/usr/bin/env node
/**
 * Baixa e otimiza os modelos 3D licenciados listados em src/data/carModels.ts.
 *
 * Requisitos:
 *  - token da API do Sketchfab (conta gratuita): variável SKETCHFAB_TOKEN, ou o segredo de rede
 *    "Authorization: Token ..." configurado no ambiente para api.sketchfab.com;
 *  - `unzip` no sistema; o otimizador roda via `npx @gltf-transform/cli`.
 *
 * Uso: node tools/fetch-car-models.mjs [teamId ...]
 * Saída: public/models/<teamId>.glb (geometria meshopt, texturas WebP até 2048 px) e
 * public/models/<teamId>-mobile.glb (50% dos polígonos, texturas de 1024 px).
 * Depois, marque no manifesto: `status: 'available', file: '/models/<teamId>.glb', fileMobile: '/models/<teamId>-mobile.glb'`.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const manifest = readFileSync(new URL('../src/data/carModels.ts', import.meta.url), 'utf8');
const entries = [...manifest.matchAll(/sf\('([a-z-]+)', '([^']+)', '([0-9a-f]{32})'\)/g)].map(([, teamId, title, uid]) => ({ teamId, title, uid }));
const only = process.argv.slice(2);
const token = process.env.SKETCHFAB_TOKEN ?? 'via-proxy';
const outDir = new URL('../public/models/', import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

const findFile = (dir, re) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { const r = findFile(p, re); if (r) return r; } else if (re.test(f)) return p;
  }
  return null;
};

for (const e of entries.filter((x) => !only.length || only.includes(x.teamId))) {
  process.stdout.write(`→ ${e.title} … `);
  const res = await fetch(`https://api.sketchfab.com/v3/models/${e.uid}/download`, { headers: { Authorization: `Token ${token}` } });
  if (!res.ok) { console.log(`falhou (${res.status}) — confira o token`); continue; }
  const { gltf } = await res.json();
  if (!gltf?.url) { console.log('sem pacote glTF'); continue; }
  const tmp = mkdtempSync(join(tmpdir(), 'car-'));
  const zip = join(tmp, 'model.zip');
  writeFileSync(zip, Buffer.from(await (await fetch(gltf.url)).arrayBuffer()));
  execFileSync('unzip', ['-q', zip, '-d', join(tmp, 'x')]);
  const src = findFile(join(tmp, 'x'), /\.gltf$/i);
  if (!src) { console.log('arquivo .gltf não encontrado'); continue; }
  // peças continuam separadas (sem juntar malhas) para a vista explodida funcionar
  const base = ['--yes', '@gltf-transform/cli@4.1.0', 'optimize', src];
  const keep = ['--join', 'false', '--flatten', 'false', '--compress', 'meshopt', '--texture-compress', 'webp'];
  const out = join(outDir, `${e.teamId}.glb`);
  const outMobile = join(outDir, `${e.teamId}-mobile.glb`);
  execFileSync('npx', [...base, out, ...keep, '--texture-size', '2048', '--simplify', 'false'], { stdio: 'ignore' });
  // nível de detalhe para celular: metade dos polígonos e texturas de 1024 px
  execFileSync('npx', [...base, outMobile, ...keep, '--texture-size', '1024', '--simplify-ratio', '0.5'], { stdio: 'ignore' });
  console.log(`ok (${(statSync(out).size / 1e6).toFixed(1)} MB · celular ${(statSync(outMobile).size / 1e6).toFixed(1)} MB)`);
}
