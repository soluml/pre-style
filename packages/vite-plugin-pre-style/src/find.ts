import { parseSync } from 'oxc-parser';
import type { Lang } from 'pre-style/compiler';

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

export interface MergeCall {
  start: number;
  end: number;
  // Static arguments: string literals and blocks. Null when any argument
  // isn't static.
  args: (string | FoundBlock)[] | null;
}

export interface ScriptAnalysis {
  blocks: FoundBlock[];
  imports: FoundImport[];
  mergeCalls: MergeCall[];
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

const IMPORTS = new Set(['css', 'scss', 'merge']);

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

// Finds blocks in a JS or TS file. Only `css` and `scss` imported from
// `pre-style` mark blocks. Returns null when the file doesn't import them.
export function findInScript(filename: string, code: string): ScriptAnalysis | null {
  const { program } = parseSync(filename, code);
  const locate = locator(code);

  const imports: FoundImport[] = [];
  const locals = new Map<string, string>();
  for (const statement of program.body as Node[]) {
    if (
      statement.type !== 'ImportDeclaration' ||
      statement.source.value !== 'pre-style' ||
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
  if (locals.size === 0) return null;

  const blocks: FoundBlock[] = [];
  const blockAt = new Map<Node, FoundBlock>();
  const mergeNodes: Node[] = [];

  walk(program, null, (node, parent) => {
    if (node.type !== 'Identifier' || !locals.has(node.name) || !isReference(node, parent)) return;
    const imported = locals.get(node.name)!;
    if (imported === 'merge') {
      if (parent?.type === 'CallExpression' && parent.callee === node) mergeNodes.push(parent);
      return;
    }
    if (parent?.type !== 'TaggedTemplateExpression' || parent.tag !== node) {
      const { line, column } = locate(node.start);
      throw new FindError(
        `\`${node.name}\` from pre-style can only be used as a tagged template (${node.name}\`…\`).`,
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

  // Merge calls with only string literals and blocks can be resolved at
  // build time.
  const mergeCalls = mergeNodes.map((node): MergeCall => {
    const args: (string | FoundBlock)[] = [];
    for (const arg of node.arguments as Node[]) {
      if (arg.type === 'Literal' && typeof arg.value === 'string') args.push(arg.value);
      else if (arg.type === 'TemplateLiteral' && arg.expressions.length === 0)
        args.push(arg.quasis[0].value.cooked);
      else if (blockAt.has(arg)) args.push(blockAt.get(arg)!);
      else return { start: node.start, end: node.end, args: null };
    }
    return { start: node.start, end: node.end, args };
  });

  return { blocks, imports, mergeCalls };
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
