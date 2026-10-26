import { NESTABLE_AT_RULES } from './at-rules.ts';

export interface SplitBlock {
  // The block with lifted at-rules blanked out. Newlines are kept, so
  // positions in the body still match the original block.
  body: string;
  // Top-level at-rules that can't be nested inside a style rule.
  lifted: string[];
}

// Finds the top-level at-rules in a `css` block that CSS nesting doesn't
// allow inside a style rule (`@keyframes`, `@font-face`, `@import`, and so
// on), so they can be moved out of the placeholder rule the block is wrapped
// in. This only tracks strings, comments, and brackets; Lightning CSS does
// the real parsing.
export function splitBlock(code: string): SplitBlock {
  const lifted: string[] = [];
  let body = '';
  let itemStart = 0;
  let depth = 0;
  let i = 0;

  const endItem = (end: number) => {
    const item = code.slice(itemStart, end);
    const name = /^\s*@([\w-]+)/.exec(item)?.[1];
    // Only the block form of a nestable at-rule can be nested, so
    // statements such as `@layer a, b;` are lifted too.
    const nestable =
      name !== undefined &&
      NESTABLE_AT_RULES.has(name.toLowerCase()) &&
      !item.trimEnd().endsWith(';');
    if (name !== undefined && !nestable) {
      lifted.push(item.trim());
      body += item.replace(/[^\n]/g, ' ');
    } else {
      body += item;
    }
    itemStart = end;
  };

  while (i < code.length) {
    const ch = code[i];
    if (ch === '/' && code[i + 1] === '*') {
      const end = code.indexOf('*/', i + 2);
      i = end === -1 ? code.length : end + 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      i++;
      while (i < code.length && code[i] !== ch) {
        if (code[i] === '\\') i++;
        i++;
      }
      i++;
      continue;
    }
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === '{' || ch === '(' || ch === '[') {
      depth++;
    } else if (ch === '}' || ch === ')' || ch === ']') {
      depth--;
      if (depth === 0 && ch === '}') {
        i++;
        endItem(i);
        continue;
      }
    } else if (ch === ';' && depth === 0) {
      i++;
      endItem(i);
      continue;
    }
    i++;
  }
  endItem(code.length);

  return { body, lifted };
}
