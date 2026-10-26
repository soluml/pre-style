import { transform } from 'lightningcss';
import type { Rule } from 'lightningcss';
import type { LightningOptions } from './block.ts';

export interface Printed {
  code: string;
  map: string | null;
}

// Prints rules with Lightning CSS. The rules replace an empty stylesheet in
// a visitor, so Lightning CSS applies the user's options (minify, targets,
// and so on) while printing. `sources` are the files rule locations point
// to, for the source map.
export function print(
  rules: Rule[],
  sources: string[],
  options: LightningOptions,
  sourceMap: boolean,
): Printed {
  // The user's visitor already ran on each block.
  const { visitor: _visitor, ...rest } = options;
  // Lightning CSS writes missing optional values as `null` but can't read
  // some of them back (such as in `var()`), while it reads a missing field
  // as missing everywhere.
  rules = JSON.parse(JSON.stringify(rules, (_key, value) => (value === null ? undefined : value)));
  const result = transform({
    ...rest,
    filename: 'pre.style.css',
    code: new Uint8Array(),
    sourceMap,
    visitor: {
      StyleSheet: (sheet) => ({ ...sheet, rules, sources }) as never,
    },
  });
  let map: string | null = null;
  if (result.map) {
    // The mappings use the rules' source indexes, but Lightning CSS lists
    // only its own file name as the source.
    const json = JSON.parse(new TextDecoder().decode(result.map));
    json.sources = sources;
    delete json.sourcesContent;
    map = JSON.stringify(json);
  }
  return { code: new TextDecoder().decode(result.code), map };
}
