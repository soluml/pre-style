import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { PrependFiles } from 'pre-style/compiler';

// How a component library is compiled, from the `pre-style` field in its
// package.json or the plugin's `libraries` option.
export interface LibraryConfig {
  // Globs of the library's files that contain blocks, relative to the
  // package. Defaults to every JS and TS file.
  include?: string | string[];
  // Prepended to the library's blocks only. Relative to the package.
  prependFiles?: PrependFiles;
}

export interface ResolvedLibrary {
  name: string;
  // The package's real path, with symlinks resolved, as Vite sees its files.
  dir: string;
  include: string[];
  prependFiles?: PrependFiles;
}

const DEFAULT_INCLUDE = ['**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts,astro}'];

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  'pre-style'?: LibraryConfig | boolean;
}

const readPackage = (dir: string): PackageJson =>
  JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));

// Finds an installed package the way Node does, by looking in each
// `node_modules` up from `from`.
function findPackage(name: string, from: string): string | null {
  for (let dir = from; ; dir = dirname(dir)) {
    const candidate = join(dir, 'node_modules', name);
    if (existsSync(join(candidate, 'package.json'))) return realpathSync(candidate);
    if (dirname(dir) === dir) return null;
  }
}

// Finds the Pre-Style component libraries an app uses: its dependencies
// with a `pre-style` field, and theirs, recursively. `overrides` adds
// packages, changes their config, or (with `false`) leaves them out.
export function findLibraries(
  root: string,
  overrides: Record<string, LibraryConfig | boolean> = {},
): ResolvedLibrary[] {
  const libraries: ResolvedLibrary[] = [];
  const seen = new Set<string>();

  const visit = (name: string, from: string) => {
    const dir = findPackage(name, from);
    if (dir === null || seen.has(dir)) return;
    seen.add(dir);
    const pkg = readPackage(dir);
    const config = Object.hasOwn(overrides, name) ? overrides[name] : pkg['pre-style'];
    if (!config) return;
    const { include, prependFiles } = config === true ? {} : config;
    libraries.push({
      name,
      dir,
      include: include === undefined ? DEFAULT_INCLUDE : [include].flat(),
      prependFiles,
    });
    // A library's peer dependencies are installed by the app, and found the
    // same way from the library.
    for (const dependency of Object.keys({
      ...pkg.dependencies,
      ...pkg.peerDependencies,
      ...pkg.optionalDependencies,
    })) {
      visit(dependency, dir);
    }
  };

  const app = existsSync(join(root, 'package.json')) ? readPackage(root) : {};
  const names = Object.keys({
    ...app.dependencies,
    ...app.devDependencies,
    ...app.optionalDependencies,
    ...overrides,
  });
  for (const name of names) visit(name, root);
  return libraries;
}
