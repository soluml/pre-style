import { readFileSync } from 'node:fs';
import { resolve as resolvePath, sep } from 'node:path';
import type { Rule, SelectorList } from 'lightningcss';
import SweatMap from 'sweatmap';
import { parseBlock, PreStyleError, valueOf } from './block.ts';
import type {
  Atom,
  AtRuleSegment,
  GlobalRule,
  Lang,
  LightningOptions,
  ParsedBlock,
  ParseOptions,
  Position,
  SassCompiler,
} from './block.ts';
import { print } from './print.ts';
import type { Printed } from './print.ts';
import { lvhfaRank, withClass } from './selectors.ts';
import type { MergeTable } from '../merge.ts';

// Files prepended to blocks: an array for every block, or separate arrays
// for `css` and `scss` blocks.
export type PrependFiles = string[] | { css?: string[]; scss?: string[] };

export interface Library {
  // The library's directory. Blocks in files under it belong to the library.
  dir: string;
  // Prepended to the library's blocks only, instead of the app's
  // `prependFiles`. Relative to `dir`.
  prependFiles?: PrependFiles;
}

export interface CompilerOptions {
  // Prepended to the app's blocks.
  prependFiles?: PrependFiles;
  // Component libraries, whose blocks get their own prepended files.
  libraries?: Library[];
  lightningcss?: LightningOptions;
  // Generate a source map for the output CSS.
  sourceMap?: boolean;
  // The directory `prependFiles` paths are relative to.
  root?: string;
  // Receives Sass warnings. Defaults to `console.warn`.
  warn?: (message: string) => void;
}

export interface Block {
  code: string;
  lang: Lang;
  // Where the block's code starts, for errors and source maps. Lines and
  // columns start from 1.
  file?: string;
  line?: number;
  column?: number;
}

interface AtomRecord {
  atom: Atom;
  // Assigned when first needed, so `assignNames` can name scanned atoms by
  // how often they're used.
  className: string | null;
  order: number;
  // The first place the atom appears, for the source map.
  source: Source | null;
}

interface GlobalRecord {
  global: GlobalRule;
  order: number;
  source: Source | null;
}

interface Source {
  file: string;
  line: number;
  column: number;
}

const NAME_OPTIONS = {
  cssSafe: true,
  // Only `0-9`, `A-Z`, and `a-z` from Basic Latin, so names never contain
  // `_` or `-`, which separate class name segments.
  additional_ranges: {
    'Basic Latin': { start: null, end: null },
    Digits: { start: '0030', end: '0039' },
    Uppercase: { start: '0041', end: '005A' },
    Lowercase: { start: '0061', end: '007A' },
  },
};

export async function createCompiler(options: CompilerOptions = {}): Promise<Compiler> {
  let sass: SassCompiler | null = null;
  try {
    sass = await import('sass');
  } catch {
    // Sass is optional. Parsing an scss block reports that it's missing.
  }
  return new Compiler(options, sass);
}

export class Compiler {
  readonly #parseOptions: Omit<ParseOptions, 'prepend'>;
  readonly #options: CompilerOptions;
  // Prepended code for the app's blocks, and for each library's, with the
  // most deeply nested library first.
  readonly #prepend: Record<Lang, string>;
  readonly #libraries: { dir: string; prepend: Record<Lang, string> }[];
  readonly #blocks = new Map<string, ParsedBlock>();

  // Separate name lists for at-rules, selector variants, and declarations.
  readonly #names = {
    atRules: new SweatMap(NAME_OPTIONS),
    variants: new SweatMap(NAME_OPTIONS),
    declarations: new SweatMap(NAME_OPTIONS),
  };
  // How often each entry is used across scanned blocks.
  readonly #counts = {
    atRules: new Map<string, number>(),
    variants: new Map<string, number>(),
    declarations: new Map<string, number>(),
  };

  readonly #atoms = new Map<string, AtomRecord>();
  readonly #globals = new Map<string, GlobalRecord>();
  // The current global for each overridable at-rule.
  readonly #overrides = new Map<string, string>();
  #order = 0;

  constructor(options: CompilerOptions, sass: SassCompiler | null) {
    this.#options = options;
    const root = options.root ?? process.cwd();
    this.#prepend = readPrepend(root, options.prependFiles);
    this.#libraries = (options.libraries ?? [])
      .map((library) => {
        const dir = resolvePath(root, library.dir);
        return { dir: dir + sep, prepend: readPrepend(dir, library.prependFiles) };
      })
      .toSorted((a, b) => b.dir.length - a.dir.length);
    this.#parseOptions = {
      lightningcss: options.lightningcss ?? {},
      sass,
      warn: options.warn ?? ((message) => console.warn(message)),
    };
  }

  // Increases whenever a class or global rule is added, so callers can tell
  // when the output CSS has changed.
  get revision(): number {
    return this.#order;
  }

  // Pass 1 of naming: parses a block and counts what it uses. Call for every
  // block before `assignNames`.
  scan(block: Block): void {
    const parsed = this.#parse(block);
    for (const atom of parsed.atoms) {
      for (const segment of atom.atRules) count(this.#counts.atRules, segment.key);
      if (atom.variant) count(this.#counts.variants, atom.variant.key);
      count(this.#counts.declarations, atom.declaration.key);
    }
    this.#register(block, parsed);
  }

  // Pass 2 of naming: gives the most-used entries the shortest names. Ties
  // are broken by key, so names don't depend on the order files are read.
  assignNames(): void {
    for (const list of ['atRules', 'variants', 'declarations'] as const) {
      const sorted = [...this.#counts[list]].toSorted(
        ([a, countA], [b, countB]) => countB - countA || (a < b ? -1 : a > b ? 1 : 0),
      );
      for (const [key] of sorted) this.#names[list].set(key);
    }
  }

  // The class string that replaces a block. Blocks that weren't scanned
  // (as in dev mode) are parsed and named on demand.
  classString(block: Block): string {
    const parsed = this.#parse(block);
    this.#register(block, parsed);
    return parsed.atoms.map((atom) => this.#nameOf(this.#atoms.get(atomKey(atom))!)).join(' ');
  }

  css(): Printed {
    const sources: string[] = [];
    const loc = (source: Source | null) => {
      if (source === null) return { source_index: 0, line: 0, column: 1 };
      let index = sources.indexOf(source.file);
      if (index === -1) index = sources.push(source.file) - 1;
      // Lightning CSS locations have lines from 0.
      return { source_index: index, line: source.line - 1, column: source.column };
    };

    const globals = [...this.#globals.values()].toSorted((a, b) => a.order - b.order);
    const hoisted = globals
      .filter((g) => g.global.hoist !== false)
      .toSorted((a, b) => (a.global.hoist as number) - (b.global.hoist as number));
    const rest = globals.filter((g) => g.global.hoist === false);
    const rules: Rule[] = [...hoisted, ...rest].map((g) => withLoc(g.global.rule, loc(g.source)));
    rules.push(...this.#atomRules(loc));

    return print(rules, sources, this.#parseOptions.lightningcss, this.#options.sourceMap ?? false);
  }

  mergeTable(): MergeTable {
    const table: MergeTable = {};
    for (const record of this.#atoms.values())
      table[this.#nameOf(record)] = this.#mergeEntry(record);
    return table;
  }

  #mergeEntry(record: AtomRecord): [prefix: string, property: string] {
    const className = this.#nameOf(record);
    const declaration = this.#names.declarations.get(record.atom.declaration.key)!;
    return [className.slice(0, className.length - declaration.length), record.atom.property];
  }

  #parse(block: Block): ParsedBlock {
    // A library's blocks get its prepended files instead of the app's.
    const library =
      block.file === undefined
        ? -1
        : this.#libraries.findIndex(({ dir }) => block.file!.startsWith(dir));
    const prepend = library === -1 ? this.#prepend : this.#libraries[library].prepend;
    const cacheKey = `${library}\n${block.lang}\n${block.code}`;
    let parsed = this.#blocks.get(cacheKey);
    if (parsed === undefined) {
      try {
        parsed = parseBlock(block.code, block.lang, { ...this.#parseOptions, prepend });
      } catch (error) {
        throw error instanceof PreStyleError ? locate(error, block) : error;
      }
      this.#blocks.set(cacheKey, parsed);
    }
    return parsed;
  }

  #register(block: Block, parsed: ParsedBlock) {
    for (const atom of parsed.atoms) {
      const key = atomKey(atom);
      if (!this.#atoms.has(key)) {
        this.#atoms.set(key, {
          atom,
          className: null,
          order: this.#order++,
          source: sourceOf(block, atom.position),
        });
      }
    }
    for (const global of parsed.globals) {
      if (this.#globals.has(global.key)) continue;
      // Only the last definition of an overridable at-rule is kept.
      if (global.overrideKey !== null) {
        const previous = this.#overrides.get(global.overrideKey);
        if (previous !== undefined) this.#globals.delete(previous);
        this.#overrides.set(global.overrideKey, global.key);
      }
      this.#globals.set(global.key, {
        global,
        order: this.#order++,
        source: sourceOf(block, global.position),
      });
    }
  }

  #nameOf(record: AtomRecord): string {
    return (record.className ??= this.#className(record.atom));
  }

  // `A_` for each at-rule, `B-` for the selector variant, then the
  // declaration.
  #className(atom: Atom): string {
    let name = '';
    for (const segment of atom.atRules) name += `${this.#names.atRules.set(segment.key)}_`;
    if (atom.variant) name += `${this.#names.variants.set(atom.variant.key)}-`;
    return name + this.#names.declarations.set(atom.declaration.key);
  }

  #atomRules(loc: (source: Source | null) => unknown): Rule[] {
    // Group atoms by their at-rules, nesting groups the same way.
    const root: Group = { segment: null, order: 0, atoms: [], children: new Map() };
    for (const record of this.#atoms.values()) {
      let group = root;
      for (const segment of record.atom.atRules) {
        let child = group.children.get(segment.key);
        if (child === undefined) {
          child = { segment, order: record.order, atoms: [], children: new Map() };
          group.children.set(segment.key, child);
        }
        group = child;
      }
      group.atoms.push(record);
    }

    const emit = (group: Group): Rule[] => {
      const rules: Rule[] = sortAtoms(group.atoms).map((record) => {
        const { atom, source } = record;
        const className = this.#nameOf(record);
        const selectors: SelectorList = atom.variant
          ? withClass(atom.variant.selectors, className)
          : [[{ type: 'class', name: className }]];
        const declarations = atom.declaration.important
          ? { importantDeclarations: [atom.declaration.value] }
          : { declarations: [atom.declaration.value] };
        return {
          type: 'style',
          value: { selectors, declarations, rules: [], loc: loc(source) },
        } as Rule;
      });
      for (const child of sortGroups([...group.children.values()])) {
        rules.push({
          type: child.segment!.rule.type,
          value: { ...valueOf(child.segment!.rule), rules: emit(child) },
        } as Rule);
      }
      return rules;
    };
    return emit(root);
  }
}

interface Group {
  segment: AtRuleSegment | null;
  order: number;
  atoms: AtomRecord[];
  children: Map<string, Group>;
}

// Reads prepended files, relative to `dir`, once.
function readPrepend(dir: string, files: PrependFiles | undefined): Record<Lang, string> {
  const read = (list: string[] = []) =>
    list.map((file) => readFileSync(resolvePath(dir, file), 'utf8')).join('\n');
  return Array.isArray(files)
    ? { css: read(files), scss: read(files) }
    : { css: read(files?.css), scss: read(files?.scss) };
}

const count = (map: Map<string, number>, key: string) => map.set(key, (map.get(key) ?? 0) + 1);

const atomKey = (atom: Atom) =>
  `${atom.atRules.map((s) => s.key).join('\n')}\n${atom.variant?.key ?? ''}\n${atom.declaration.key}`;

// Base classes, then selector variant classes in LVHFA order. Within each,
// shorthands that couldn't be expanded come first, so the longhands after
// them win, then classes keep the order they first appeared in.
function sortAtoms(atoms: AtomRecord[]): AtomRecord[] {
  const rank = (record: AtomRecord) =>
    record.atom.variant ? lvhfaRank(record.atom.variant.selectors) : -2;
  return atoms.toSorted(
    (a, b) =>
      rank(a) - rank(b) || Number(b.atom.shorthand) - Number(a.atom.shorthand) || a.order - b.order,
  );
}

// At-rule groups keep the order they first appeared in, except `@media`
// queries with only a `min-width`, which come last, smallest first
// (mobile-first).
function sortGroups(groups: Group[]): Group[] {
  const width = (group: Group) => minWidth(group.segment!.rule);
  return groups.toSorted((a, b) => {
    const wa = width(a);
    const wb = width(b);
    if (wa === null || wb === null)
      return wa === null && wb === null ? a.order - b.order : wa === null ? -1 : 1;
    return wa - wb || a.order - b.order;
  });
}

const UNIT_PX: Record<string, number> = { px: 1, em: 16, rem: 16 };

// The `min-width` of a `@media` rule with a single `min-width` query, in px.
function minWidth(rule: Rule): number | null {
  if (rule.type !== 'media') return null;
  const queries = rule.value.query.mediaQueries;
  if (queries.length !== 1) return null;
  const { qualifier, mediaType, condition } = queries[0];
  if (qualifier || mediaType !== 'all' || condition?.type !== 'feature') return null;
  const feature = condition.value as any;
  const isMin =
    (feature.type === 'range' &&
      feature.name === 'width' &&
      feature.operator === 'greater-than-equal') ||
    (feature.type === 'plain' && feature.name === 'min-width');
  const length = feature.value?.type === 'length' ? feature.value.value : null;
  if (!isMin || length?.type !== 'value' || !(length.value.unit in UNIT_PX)) return null;
  return length.value.value * UNIT_PX[length.value.unit];
}

function withLoc(rule: Rule, loc: unknown): Rule {
  const value = valueOf(rule);
  return value.loc === undefined ? rule : ({ ...rule, value: { ...value, loc } } as Rule);
}

function sourceOf(block: Block, position: Position | null): Source | null {
  if (block.file === undefined) return null;
  return absolute(block, position ?? { line: 0, column: 1 });
}

// Converts a position in a block to its file.
function absolute(block: Block, position: Position): Source {
  const line = block.line ?? 1;
  const column = block.column ?? 1;
  return {
    file: block.file ?? '',
    line: line + position.line,
    column: position.line === 0 ? column + position.column - 1 : position.column,
  };
}

function locate(error: PreStyleError, block: Block): PreStyleError {
  if (block.file === undefined) return error;
  const source = absolute(block, error.position ?? { line: 0, column: 1 });
  return new PreStyleError(
    `${source.file}:${source.line}:${source.column}: ${error.message}`,
    error.position,
    { cause: error.cause },
  );
}
