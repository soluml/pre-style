import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { wrapFieldSchema } from '../src/schema.ts';

const core = new URL('../../core/package.schema.json', import.meta.url);
const out = new URL('../dist/package.json.schema.json', import.meta.url);

const field = JSON.parse(await readFile(core, 'utf8'));
await mkdir(new URL('.', out), { recursive: true });
await writeFile(out, JSON.stringify(wrapFieldSchema(field)));
