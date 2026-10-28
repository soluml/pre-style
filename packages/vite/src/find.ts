import { parseSync } from 'oxc-parser';
import type { Lang } from '@pre.style/core/compiler';

export interface FoundBlock {
  // The whole block, `` css`…` ``, in the source.
  start: number;
  end: number;
  code: string;
  lang: Lang;
  // Where the block's code starts, from 1.
  line: number;
  column: number;
}

export interface FoundImport {
  start: number;
  end: number;
  // Every specifier, as written (`css as c`). `imported` is null for
  // default and namespace imports.
  specifiers: {
    imported: string | null;
    local: string;
    text: string;
    kind: 'named' | 'default' | 'namespace';
  }[];
}

// An import of a stylesheet file with `with { type: 'pre.style' }`, or a
// re-export or dynamic import of one.
export interface SheetImport {
  // The specifier and its attributes, which are replaced with a specifier
  // the plugin resolves.
  start: number;
  end: number;
  specifier: string;
  // Local bindings to the stylesheet's exports: the class each names, or
  // `*` for a namespace import.
  locals: Map<string, string>;
}

// A class exported by a stylesheet file, used as a `cn` argument.
export interface SheetClass {
  sheet: SheetImport;
  name: string;
}

export interface CnCall {
  start: number;
  end: number;
  // Static arguments: string literals, blocks, and classes imported from
  // stylesheet files. Null when any argument isn't static.
  args: (string | FoundBlock | SheetClass)[] | null;
}

export interface ScriptAnalysis {
  blocks: FoundBlock[];
  imports: FoundImport[];
  sheets: SheetImport[];
  cnCalls: CnCall[];
}

export class FindError extends Error {
  readonly line: number;
  readonly column: number;
  constructor(message: string, line: number, column: number) {
    super(message);
    this.line = line;
    this.column = column;
  }
}

const IMPORTS = new Set(['css', 'scss', 'cn']);

type Attribute = { key: { name?: string; value?: string }; value: { value: unknown } };

// Whether import attributes are `{ type: 'pre.style' }`.
const isSheet = (attributes: Attribute[] | undefined) =>
  attributes?.length === 1 &&
  (attributes[0].key.name ?? attributes[0].key.value) === 'type' &&
  attributes[0].value.value === 'pre.style';

// Text that marks a stylesheet import, for files that aren't parsed,
// including imports without bindings (`import './reset.css' with …`).
export const SHEET_IMPORT =
  /\b(?:from|import)\s*(['"])([^'"]+)\1\s*with\s*\{\s*type\s*:\s*(['"])pre\.style\3\s*,?\s*\}/g;

// Converts offsets to lines and columns, from 1.
function locator(code: string) {
  const starts = [0];
  for (let i = 0; i < code.length; i++) if (code[i] === '\n') starts.push(i + 1);
  return (offset: number) => {
    let low = 0;
    let high = starts.length - 1;
    while (low < high) {
      const mid = (low + high + 1) >> 1;
      if (starts[mid] <= offset) low = mid;
      else high = mid - 1;
    }
    return { line: low + 1, column: offset - starts[low] + 1 };
  };
}

type Node = { type: string; start: number; end: number; [key: string]: any };

// Calls `visit` for every node, with its parent.
function walk(
  node: unknown,
  parent: Node | null,
  visit: (node: Node, parent: Node | null) => void,
) {
  if (Array.isArray(node)) {
    for (const child of node) walk(child, parent, visit);
    return;
  }
  if (node === null || typeof node !== 'object' || typeof (node as Node).type !== 'string') return;
  visit(node as Node, parent);
  for (const [key, value] of Object.entries(node)) {
    if (key !== 'type' && value !== null && typeof value === 'object')
      walk(value, node as Node, visit);
  }
}

// Whether an identifier is a reference to a binding, and not a property
// name or key.
function isReference(node: Node, parent: Node | null): boolean {
  if (parent === null) return true;
  switch (parent.type) {
    case 'MemberExpression':
      return parent.object === node || parent.computed;
    case 'Property':
      return parent.value === node || parent.computed || parent.shorthand;
    case 'MethodDefinition':
    case 'PropertyDefinition':
    case 'AccessorProperty':
    case 'TSPropertySignature':
      return parent.key !== node || parent.computed;
    case 'ImportSpecifier':
    case 'ImportDefaultSpecifier':
    case 'ImportNamespaceSpecifier':
    case 'ExportSpecifier':
    case 'LabeledStatement':
    case 'BreakStatement':
    case 'ContinueStatement':
      return false;
    default:
      return true;
  }
}

// Finds blocks in a JS or TS file, and imports of stylesheet files. Only
// `css` and `scss` imported from `@pre.style/core` mark blocks. Returns null
// when the file imports neither.
export function findInScript(filename: string, code: string): ScriptAnalysis | null {
  const { program } = parseSync(filename, code);
  const locate = locator(code);

  const imports: FoundImport[] = [];
  const sheets: SheetImport[] = [];
  // The specifier and attributes of a static import or re-export.
  const sheetImport = (statement: Node): SheetImport => {
    const last = (statement.attributes as Node[]).at(-1)!;
    return {
      start: statement.source.start,
      end: code.indexOf('}', last.end) + 1,
      specifier: statement.source.value,
      locals: new Map(),
    };
  };
  const locals = new Map<string, string>();
  for (const statement of program.body as Node[]) {
    if (
      (statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportAllDeclaration') &&
      statement.source &&
      isSheet(statement.attributes)
    ) {
      sheets.push(sheetImport(statement));
      continue;
    }
    if (statement.type === 'ImportDeclaration' && isSheet(statement.attributes)) {
      const sheet = sheetImport(statement);
      if (statement.importKind !== 'type') {
        for (const specifier of statement.specifiers as Node[]) {
          if (specifier.type === 'ImportNamespaceSpecifier')
            sheet.locals.set(specifier.local.name, '*');
          else if (specifier.type === 'ImportSpecifier' && specifier.importKind !== 'type')
            sheet.locals.set(
              specifier.local.name,
              specifier.imported.name ?? specifier.imported.value,
            );
        }
      }
      sheets.push(sheet);
      continue;
    }
    if (
      statement.type !== 'ImportDeclaration' ||
      statement.source.value !== '@pre.style/core' ||
      statement.importKind === 'type'
    )
      continue;
    const specifiers: FoundImport['specifiers'] = [];
    for (const specifier of statement.specifiers as Node[]) {
      const text = code.slice(specifier.start, specifier.end);
      if (specifier.type !== 'ImportSpecifier') {
        const kind = specifier.type === 'ImportDefaultSpecifier' ? 'default' : 'namespace';
        specifiers.push({ imported: null, local: specifier.local.name, text, kind });
        continue;
      }
      const imported = specifier.imported.name ?? specifier.imported.value;
      specifiers.push({ imported, local: specifier.local.name, text, kind: 'named' });
      if (IMPORTS.has(imported) && specifier.importKind !== 'type')
        locals.set(specifier.local.name, imported);
    }
    imports.push({ start: statement.start, end: statement.end, specifiers });
  }

  const blocks: FoundBlock[] = [];
  const blockAt = new Map<Node, FoundBlock>();
  const cnNodes: Node[] = [];

  walk(program, null, (node, parent) => {
    // `import('./file.css', { with: { type: 'pre.style' } })`.
    if (node.type === 'ImportExpression') {
      const options = node.options as Node | null;
      const attributes = options?.properties?.find(
        (p: Node) => p.type === 'Property' && (p.key.name ?? p.key.value) === 'with',
      )?.value;
      const typed = attributes?.properties?.map((p: Node) => ({ key: p.key, value: p.value }));
      if (
        node.source.type === 'Literal' &&
        typeof node.source.value === 'string' &&
        attributes?.type === 'ObjectExpression' &&
        isSheet(typed)
      )
        sheets.push({
          start: node.source.start,
          end: options!.end,
          specifier: node.source.value,
          locals: new Map(),
        });
      return;
    }
    if (node.type !== 'Identifier' || !locals.has(node.name) || !isReference(node, parent)) return;
    const imported = locals.get(node.name)!;
    if (imported === 'cn') {
      if (parent?.type === 'CallExpression' && parent.callee === node) cnNodes.push(parent);
      return;
    }
    if (parent?.type !== 'TaggedTemplateExpression' || parent.tag !== node) {
      const { line, column } = locate(node.start);
      throw new FindError(
        `\`${node.name}\` from pre.style can only be used as a tagged template (${node.name}\`…\`).`,
        line,
        column,
      );
    }
    const { quasi } = parent;
    if (quasi.expressions.length > 0) {
      const { line, column } = locate(quasi.expressions[0].start);
      throw new FindError(
        'Blocks cannot contain ${…} interpolation. Use prepended files for shared values.',
        line,
        column,
      );
    }
    // The block's code starts after the opening backtick.
    const { line, column } = locate(quasi.start + 1);
    const block: FoundBlock = {
      start: parent.start,
      end: parent.end,
      code: quasi.quasis[0].value.raw,
      lang: imported as Lang,
      line,
      column,
    };
    blocks.push(block);
    blockAt.set(parent, block);
  });

  if (locals.size === 0 && sheets.length === 0) return null;

  // The stylesheet import a local name is bound to.
  const find = (local: string) => sheets.find((sheet) => sheet.locals.has(local));
  // A class imported from a stylesheet file: a named import, or a member of
  // a namespace import.
  const sheetClass = (arg: Node): SheetClass | null => {
    if (arg.type === 'Identifier') {
      const sheet = find(arg.name);
      const name = sheet?.locals.get(arg.name);
      return sheet && name !== '*' ? { sheet, name: name! } : null;
    }
    if (arg.type === 'MemberExpression' && arg.object.type === 'Identifier') {
      const sheet = find(arg.object.name);
      if (sheet?.locals.get(arg.object.name) !== '*') return null;
      const name = arg.computed
        ? arg.property.type === 'Literal' && typeof arg.property.value === 'string'
          ? arg.property.value
          : null
        : arg.property.name;
      return name === null ? null : { sheet: sheet!, name };
    }
    return null;
  };

  // `cn` calls with only string literals, blocks, and stylesheet classes
  // can be resolved at build time.
  const cnCalls = cnNodes.map((node): CnCall => {
    const args: (string | FoundBlock | SheetClass)[] = [];
    for (const arg of node.arguments as Node[]) {
      const sheet = sheetClass(arg);
      if (arg.type === 'Literal' && typeof arg.value === 'string') args.push(arg.value);
      else if (arg.type === 'TemplateLiteral' && arg.expressions.length === 0)
        args.push(arg.quasis[0].value.cooked);
      else if (blockAt.has(arg)) args.push(blockAt.get(arg)!);
      else if (sheet !== null) args.push(sheet);
      else return { start: node.start, end: node.end, args: null };
    }
    return { start: node.start, end: node.end, args };
  });

  return { blocks, imports, sheets, cnCalls };
}

const HTML_BLOCK = /\b(s?css)`([^`]*)`/g;

// Finds blocks in HTML by text matching, since HTML can't import anything.
export function findInHtml(code: string): FoundBlock[] {
  const locate = locator(code);
  const blocks: FoundBlock[] = [];
  for (const match of code.matchAll(HTML_BLOCK)) {
    const start = match.index;
    const { line, column } = locate(start + match[1].length + 1);
    blocks.push({
      start,
      end: start + match[0].length,
      code: match[2],
      lang: match[1] as Lang,
      line,
      column,
    });
  }
  return blocks;
}

// Moves each block's line and column to where it's written in `source`, the
// file a script was compiled from, such as an Astro component. Compilers
// copy blocks unchanged, so each is matched to the next unused block in
// `source` with the same code. Blocks it can't find keep their positions.
export function locateIn(blocks: FoundBlock[], source: string): void {
  const unused = findInHtml(source);
  for (const found of blocks) {
    const index = unused.findIndex((b) => b.lang === found.lang && b.code === found.code);
    if (index === -1) continue;
    const [match] = unused.splice(index, 1);
    found.line = match.line;
    found.column = match.column;
  }
}
