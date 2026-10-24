import { createCompiler } from '../../src/compiler/index.ts';
import type { Block, CompilerOptions } from '../../src/compiler/index.ts';

export interface Compiled {
  // The class string for each block.
  classes: string[];
  // The output CSS, minified, with one rule per line.
  css: string;
}

// Compiles blocks the way a production build does: scans every block,
// assigns names, then replaces each block. Strings are `css` blocks.
export async function compile(
  blocks: (string | Block)[],
  options: CompilerOptions = {},
): Promise<Compiled> {
  const compiler = await createCompiler({
    ...options,
    lightningcss: { minify: true, ...options.lightningcss },
  });
  const list = blocks.map((block): Block =>
    typeof block === 'string' ? { code: block, lang: 'css' } : block,
  );
  for (const block of list) compiler.scan(block);
  compiler.assignNames();
  const classes = list.map((block) => compiler.classString(block));
  return { classes, css: format(compiler.css().code) };
}

// At-rules whose blocks hold rules, which are put on their own lines.
const GROUPING =
  /^@(media|supports|container|layer|scope|starting-style|-moz-document|keyframes|-webkit-keyframes)\b/;

// Puts each rule of minified CSS on its own line, indenting rules inside
// at-rules by two spaces.
export function format(source: string): string {
  const lines: string[] = [];
  let line = '';
  let depth = 0;
  // For each open brace, whether it opened a grouping at-rule.
  const stack: boolean[] = [];
  const push = () => {
    if (line) lines.push('  '.repeat(depth) + line);
    line = '';
  };
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (ch === '"' || ch === "'") {
      const end = source.indexOf(ch, i + 1);
      line += source.slice(i, end + 1);
      i = end;
    } else if (ch === '{') {
      const grouping = stack.every((g) => g) && GROUPING.test(line);
      stack.push(grouping);
      if (grouping) {
        line += ' {';
        push();
        depth++;
      } else {
        line += ch;
      }
    } else if (ch === '}') {
      const grouping = stack.pop();
      if (grouping) {
        push();
        depth--;
        line = '}';
        push();
      } else {
        line += ch;
        if (stack.every((g) => g)) push();
      }
    } else if (ch === ';' && stack.length === 0) {
      line += ch;
      push();
    } else {
      line += ch;
    }
  }
  push();
  return lines.join('\n');
}

// Dedents a template literal and trims blank first and last lines.
export function css(strings: TemplateStringsArray): string {
  const text = strings.raw.join('').replace(/^\n|\n\s*$/g, '');
  const indent = Math.min(
    ...text
      .split('\n')
      .filter((l) => l.trim())
      .map((l) => /^ */.exec(l)![0].length),
  );
  return text
    .split('\n')
    .map((l) => l.slice(indent))
    .join('\n');
}
