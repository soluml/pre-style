import { SHORTHANDS } from './shorthands.ts';

// Each class's prefix (its at-rule and selector variant segments) and the
// property it sets.
export type MergeTable = Record<string, readonly [prefix: string, property: string]>;

export type ClassValue =
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | ClassDictionary
  | ClassValue[];
export type ClassDictionary = Record<string, unknown>;

// clsx-style arguments, flattened into classes.
function collect(value: ClassValue, classes: string[]) {
  if (!value) return;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
    for (const c of String(value).split(/\s+/)) if (c) classes.push(c);
  } else if (Array.isArray(value)) {
    for (const v of value) collect(v, classes);
  } else if (typeof value === 'object') {
    for (const [key, on] of Object.entries(value)) if (on) collect(key, classes);
  }
}

// Removes earlier classes that later ones override: two classes conflict
// when they have the same prefix and set the same property. A later
// shorthand also removes earlier longhands it covers. Classes not in the
// table are kept.
export function resolve(classes: string[], table: MergeTable): string[] {
  const seen = new Set<string>();
  const kept: string[] = [];
  for (let i = classes.length - 1; i >= 0; i--) {
    const c = classes[i];
    if (seen.has(c)) continue;
    seen.add(c);
    const entry = Object.hasOwn(table, c) ? table[c] : undefined;
    if (entry !== undefined) {
      const [prefix, property] = entry;
      const key = `${prefix} ${property}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (Object.hasOwn(SHORTHANDS, property))
        for (const longhand of SHORTHANDS[property]) seen.add(`${prefix} ${longhand}`);
    }
    kept.push(c);
  }
  return kept.toReversed();
}

export function createMerge(table: MergeTable): (...inputs: ClassValue[]) => string {
  return (...inputs) => {
    const classes: string[] = [];
    collect(inputs, classes);
    return resolve(classes, table).join(' ');
  };
}
