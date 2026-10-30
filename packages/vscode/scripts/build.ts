import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { wrapFieldSchema } from '../src/schema.ts';

const core = new URL('../../core/package.schema.json', import.meta.url);
const out = new URL('../dist/package.json.schema.json', import.meta.url);

const field = JSON.parse(await readFile(core, 'utf8'));
await mkdir(new URL('.', out), { recursive: true });
await writeFile(out, JSON.stringify(wrapFieldSchema(field)));

await build({
  entryPoints: [new URL('../src/extension.ts', import.meta.url).pathname],
  outfile: new URL('../dist/extension.cjs', import.meta.url).pathname,
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: 'node20',
  external: ['vscode'],
  // The language service's `main` is UMD, which esbuild can't follow.
  mainFields: ['module', 'main'],
  minify: true,
  sourcemap: true,
});
