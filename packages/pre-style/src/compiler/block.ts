import { composeVisitors, transform } from 'lightningcss';
import type {
  Declaration,
  Rule,
  SelectorList,
  TransformOptions,
  CustomAtRules,
} from 'lightningcss';
import { atRuleInfo } from './at-rules.ts';
import { expand } from './expand.ts';
import { compose, fromPlaceholder, isElement, PLACEHOLDER, repair } from './selectors.ts';
import { splitBlock } from './split.ts';
import { SHORTHANDS } from '../shorthands.ts';

export type Lang = 'css' | 'scss';

// Lightning CSS options users can pass through. Pre-Style sets `filename`,
// `code`, `sourceMap`, and `projectRoot` itself, and doesn't support
// `inputSourceMap` or `cssModules`.
export type LightningOptions = Omit<
  TransformOptions<CustomAtRules>,
  'filename' | 'code' | 'sourceMap' | 'inputSourceMap' | 'projectRoot' | 'cssModules'
>;

// A position in a block: line from 0, column from 1, as Lightning CSS reports.
export interface Position {
  line: number;
  column: number;
}

export interface AtRuleSegment {
  key: string;
  // The at-rule without its child rules.
  rule: Rule;
}

export interface Atom {
  atRules: AtRuleSegment[];
  variant: { key: string; selectors: SelectorList } | null;
  declaration: { key: string; value: Declaration; important: boolean };
  // The property the declaration sets, and whether it's a shorthand that
  // couldn't be expanded.
  property: string;
  shorthand: boolean;
  position: Position | null;
}

export interface GlobalRule {
  key: string;
  rule: Rule;
  hoist: number | false;
  // Overridable at-rules with the same override key replace each other.
  overrideKey: string | null;
  position: Position | null;
}

export interface ParsedBlock {
  atoms: Atom[];
  globals: GlobalRule[];
}

export class PreStyleError extends Error {
  readonly position: Position | null;
  constructor(message: string, position: Position | null, options?: ErrorOptions) {
    super(message, options);
    this.name = 'PreStyleError';
    this.position = position;
  }
}

export interface SassCompiler {
  compileString(
    source: string,
    options?: { logger?: { warn?(message: string): void; debug?(message: string): void } },
  ): { css: string };
}

export interface ParseOptions {
  lightningcss: LightningOptions;
  // Prepended code for each block type.
  prepend: Record<Lang, string>;
  sass: SassCompiler | null;
  // Receives Sass warnings and `@debug` messages.
  warn: (message: string) => void;
}

// JSON keys used to deduplicate. Locations are left out, so identical rules
// from different places share a key.
const key = (value: unknown) => JSON.stringify(value, (k, v) => (k === 'loc' ? undefined : v));

const HOIST_ORDER: Record<string, number> = { charset: 0, layer: 1, import: 2, namespace: 3 };

const hoistOrder = (rule: string) =>
  HOIST_ORDER[/^@([\w-]+)/.exec(rule)![1].toLowerCase()] ?? Infinity;

// Joins rules onto one line.
const oneLine = (rules: string[]) => rules.map((rule) => rule.replace(/\n/g, ' ')).join(' ');

const lineCount = (code: string) => code.split('\n').length - 1;

// Builds the stylesheet Lightning CSS parses for a block: the prepended
// code, then the block wrapped in a placeholder rule. Returns the code and
// the line the block starts on.
function wrap(
  code: string,
  lang: Lang,
  options: ParseOptions,
): { source: string; firstLine: number; firstColumn: number } {
  const prepend = options.prepend[lang];
  const open = `.${PLACEHOLDER}{`;
  if (lang === 'scss') {
    const head = `${prepend}\n`;
    return {
      source: `${head}${open}${code}\n}`,
      firstLine: lineCount(head),
      firstColumn: open.length,
    };
  }
  const { body, lifted } = splitBlock(code);
  // Lifted at-rules go on lines before the placeholder rule, so lines in the
  // body keep their positions. Statements (`@import`, `@layer a, b;`) go
  // first, since `@import` must come before other rules.
  // Statements are sorted by hoist order, since `@import` must come after
  // `@charset` and `@layer` statements and before `@namespace`.
  const statements = lifted
    .filter((rule) => rule.endsWith(';'))
    .toSorted((a, b) => hoistOrder(a) - hoistOrder(b));
  const blocks = lifted.filter((rule) => !rule.endsWith(';'));
  const head = `${oneLine(statements)}\n${prepend}\n${oneLine(blocks)}\n`;
  return {
    source: `${head}${open}${body}\n}`,
    firstLine: lineCount(head),
    firstColumn: open.length,
  };
}

export function parseBlock(code: string, lang: Lang, options: ParseOptions): ParsedBlock {
  if (lang === 'scss' && options.sass === null) {
    throw new PreStyleError(
      'Found an scss block, but Sass is not installed. Install the `sass` package to use scss blocks.',
      null,
    );
  }

  const { source, firstLine, firstColumn } = wrap(code, lang, options);
  // Positions in the wrapped source, converted back to the block. Positions
  // in prepended code or lifted at-rules map to the start of the block.
  const toBlock = (line: number, column: number): Position =>
    line < firstLine
      ? { line: 0, column: 1 }
      : {
          line: line - firstLine,
          column: line === firstLine ? Math.max(1, column - firstColumn) : column,
        };

  let css = source;
  if (lang === 'scss') {
    try {
      css = options.sass!.compileString(source, {
        logger: { warn: options.warn, debug: options.warn },
      }).css;
    } catch (error) {
      const span = (error as { span?: { start?: { line: number; column: number } } }).span?.start;
      throw new PreStyleError(
        `Sass failed to compile the block: ${(error as Error).message}`,
        span ? toBlock(span.line, span.column + 1) : null,
        {
          cause: error,
        },
      );
    }
  }

  const parsed: ParsedBlock = { atoms: [], globals: [] };
  // Sass output positions don't match the block, so scss atoms have none.
  const position = (loc: { line: number; column: number } | undefined) =>
    lang === 'css' && loc ? toBlock(loc.line, loc.column) : null;

  // Collected on exit, after the user's visitor has changed the rules.
  const collect = {
    StyleSheetExit(sheet: { rules: Rule[] }) {
      walk(sheet.rules, [], null, parsed, position);
    },
  };
  const { visitor, ...rest } = options.lightningcss;

  try {
    transform({
      ...rest,
      filename: 'block.css',
      code: Buffer.from(css),
      visitor: visitor ? composeVisitors([visitor, collect as never]) : (collect as never),
    });
  } catch (error) {
    const loc = (error as { loc?: { line: number; column: number } }).loc;
    // Lightning CSS reports error lines from 1.
    throw new PreStyleError(
      `Invalid CSS: ${(error as Error).message}`,
      lang === 'css' && loc ? toBlock(loc.line - 1, loc.column) : null,
      {
        cause: error,
      },
    );
  }

  return { atoms: dropOverridden(parsed.atoms), globals: parsed.globals };
}

// Within a block, a later declaration overrides an earlier one that sets the
// same property under the same at-rules and selector variant, as in CSS.
// `!important` declarations are collected after normal ones in each rule,
// so they win. Identical atoms are kept once.
function dropOverridden(atoms: Atom[]): Atom[] {
  const seen = new Set<string>();
  const kept: Atom[] = [];
  for (let i = atoms.length - 1; i >= 0; i--) {
    const atom = atoms[i];
    const prefix = `${atom.atRules.map((s) => s.key).join('\n')}\n${atom.variant?.key ?? ''}\n`;
    if (seen.has(prefix + atom.property)) continue;
    seen.add(prefix + atom.property);
    if (atom.shorthand)
      for (const longhand of SHORTHANDS[atom.property]) seen.add(prefix + longhand);
    kept.push(atom);
  }
  return kept.toReversed();
}

type ToPosition = (loc: { line: number; column: number } | undefined) => Position | null;

// Every rule but `ignored` has a value.
export const valueOf = (rule: Rule): Record<string, any> =>
  'value' in rule && rule.value !== null ? rule.value : {};

const ruleLoc = (rule: Rule): { line: number; column: number } | undefined => valueOf(rule).loc;

// Walks the rules. `variant` is the element's selector variant when inside a
// rule that targets the element, and null outside one.
function walk(
  rules: Rule[],
  atRules: AtRuleSegment[],
  variant: SelectorList | null,
  parsed: ParsedBlock,
  position: ToPosition,
) {
  for (const rule of rules) {
    if (rule.type === 'style') {
      const { selectors, declarations, rules: children = [], loc } = rule.value;
      if (variant !== null) {
        const composed = compose(variant, selectors);
        addDeclarations(declarations, atRules, composed, parsed, position(loc));
        walk(children, atRules, composed, parsed, position);
        continue;
      }
      // Outside the element, only selectors with the placeholder target it.
      const element: SelectorList = [];
      const other: SelectorList = [];
      for (const selector of selectors) {
        const resolved = fromPlaceholder(selector);
        if (resolved) element.push(resolved);
        else other.push(selector);
      }
      if (other.length > 0)
        addGlobal(
          { ...rule, value: { ...rule.value, selectors: other } },
          atRules,
          parsed,
          position,
        );
      if (element.length > 0) {
        addDeclarations(declarations, atRules, element, parsed, position(loc));
        walk(children, atRules, element, parsed, position);
      }
      continue;
    }

    if (rule.type === 'nested-declarations' && variant !== null) {
      addDeclarations(rule.value.declarations, atRules, variant, parsed, position(rule.value.loc));
      continue;
    }

    if (atRuleInfo(rule.type).atomic) {
      const { rules: children, ...value } = valueOf(rule) as { rules: Rule[] };
      const segment = {
        key: key({ type: rule.type, value }),
        rule: { type: rule.type, value } as Rule,
      };
      walk(children, [...atRules, segment], variant, parsed, position);
      continue;
    }

    addGlobal(rule, atRules, parsed, position);
  }
}

function addDeclarations(
  block: { declarations?: Declaration[]; importantDeclarations?: Declaration[] } | undefined,
  atRules: AtRuleSegment[],
  selectors: SelectorList,
  parsed: ParsedBlock,
  position: Position | null,
) {
  let variant: Atom['variant'] = null;
  if (!isElement(selectors)) {
    const repaired = repair(selectors);
    variant = { key: key(repaired), selectors: repaired };
  }
  const add = (declarations: Declaration[] = [], important: boolean) => {
    for (const declaration of declarations) {
      for (const value of expand(declaration)) {
        const { property, shorthand } = propertyOf(value);
        parsed.atoms.push({
          atRules,
          variant,
          declaration: { key: key(value) + (important ? '!' : ''), value, important },
          property,
          shorthand,
          position,
        });
      }
    }
  };
  add(block?.declarations, false);
  add(block?.importantDeclarations, true);
}

// Global rules inside at-rules keep their at-rules around them.
function addGlobal(
  rule: Rule,
  atRules: AtRuleSegment[],
  parsed: ParsedBlock,
  position: ToPosition,
) {
  let wrapped = rule;
  for (const segment of atRules.toReversed()) {
    wrapped = {
      type: segment.rule.type,
      value: { ...valueOf(segment.rule), rules: [wrapped] },
    } as Rule;
  }
  const info = atRules.length === 0 ? atRuleInfo(rule.type) : atRuleInfo('');
  wrapped = repair(wrapped);
  parsed.globals.push({
    key: key(wrapped),
    rule: wrapped,
    hoist: info.hoist,
    overrideKey: info.overridable ? overrideKey(rule) : null,
    position: position(ruleLoc(rule)),
  });
}

// The identity of an overridable at-rule: its type and name.
function overrideKey(rule: Rule): string {
  const value = valueOf(rule);
  switch (rule.type) {
    case 'keyframes':
      return `keyframes ${key(value.name)}`;
    case 'font-face': {
      // A font face is identified by its family, style, weight, and stretch.
      const descriptors = Object.fromEntries(
        (value.properties as { type: string; value: unknown }[])
          .filter((p) =>
            ['font-family', 'font-style', 'font-weight', 'font-stretch', 'unicode-range'].includes(
              p.type,
            ),
          )
          .map((p) => [p.type, p.value]),
      );
      return `font-face ${key(descriptors)}`;
    }
    case 'view-transition':
      return 'view-transition';
    case 'namespace':
      return `namespace ${value.prefix ?? ''}`;
    default:
      return `${rule.type} ${key(value.name)}`;
  }
}

// The property a declaration sets, and whether it's a shorthand that wasn't
// expanded.
const prefix = (vendorPrefix: string[] | undefined) =>
  vendorPrefix && vendorPrefix.length > 0 ? `-${vendorPrefix[0]}-` : '';

export function propertyOf(declaration: Declaration): { property: string; shorthand: boolean } {
  let property: string;
  if (declaration.property === 'unparsed') {
    const id = declaration.value.propertyId as { property: string; vendorPrefix?: string[] };
    property = prefix(id.vendorPrefix) + id.property;
  } else if (declaration.property === 'custom') {
    property = declaration.value.name;
  } else {
    property =
      prefix((declaration as { vendorPrefix?: string[] }).vendorPrefix) + declaration.property;
  }
  return { property, shorthand: Object.hasOwn(SHORTHANDS, property) };
}
