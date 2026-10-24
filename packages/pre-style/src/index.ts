// `css` and `scss` have no runtime: the bundler plugin replaces every block
// with its class string at build time. These stubs exist so TypeScript can
// resolve the imports, and so code that missed the transform fails loudly.
function notTransformed(): never {
  throw new Error(
    'Pre-Style transform not applied. css and scss blocks must be compiled by a Pre-Style bundler plugin, such as vite-plugin-pre-style.',
  );
}

export function css(_strings: TemplateStringsArray): string {
  return notTransformed();
}

export function scss(_strings: TemplateStringsArray): string {
  return notTransformed();
}

import { createMerge } from './merge.ts';

// Without a project's lookup table, `merge` only combines classes and drops
// duplicates. The bundler plugin rewrites `merge` imports to a version bound
// to the project's table.
export const merge = createMerge({});
export { createMerge };
export type { ClassDictionary, ClassValue, MergeTable } from './merge.ts';
