import { applyEdits, modify, parse, type ParseError } from 'jsonc-parser';

export const MAPPER_PACKAGE = '@pre.style/core';
export const MAPPER_ENTRY = { package: MAPPER_PACKAGE, extensions: ['.css', '.scss'] };

/** The declaration the README gives for TypeScript before 7.1. */
export const WILDCARD_DECLARATION = `declare module "*.css" {
  const classes: { readonly [name: string]: string };
  export = classes;
}
declare module "*.scss" {
  const classes: { readonly [name: string]: string };
  export = classes;
}
`;

/** Whether this TypeScript version has content mappers (7.1, prereleases included). */
export function supportsContentMappers(version: string): boolean {
  const [major = 0, minor = 0] = version.split('.').map((n) => parseInt(n, 10));
  return major > 7 || (major === 7 && minor >= 1);
}

/** Whether the project depends on pre.style, from its package.json text. */
export function usesPreStyle(packageJson: string): boolean {
  const pkg = parse(packageJson) ?? {};
  return ['dependencies', 'devDependencies'].some(
    (field) => pkg[field]?.['@pre.style/core'] || pkg[field]?.['@pre.style/vite'],
  );
}

function parseTsconfig(text: string) {
  const errors: ParseError[] = [];
  const config = parse(text, errors, { allowTrailingComma: true });
  if (errors.length || typeof config !== 'object' || config === null || Array.isArray(config)) {
    throw new Error('tsconfig.json is not a valid JSON object');
  }
  return config;
}

export function hasContentMapper(tsconfig: string): boolean {
  const mappers = parseTsconfig(tsconfig).contentMappers;
  return Array.isArray(mappers) && mappers.some((m) => m?.package === MAPPER_PACKAGE);
}

/** The tsconfig with pre.style's content mapper added, keeping its comments and formatting. */
export function addContentMapper(tsconfig: string): string {
  if (hasContentMapper(tsconfig)) return tsconfig;
  const indent = /^([ \t]+)"/m.exec(tsconfig)?.[1] ?? '  ';
  const exists = Array.isArray(parseTsconfig(tsconfig).contentMappers);
  const edits = modify(
    tsconfig,
    exists ? ['contentMappers', -1] : ['contentMappers'],
    exists ? MAPPER_ENTRY : [MAPPER_ENTRY],
    {
      formattingOptions: { insertSpaces: !indent.includes('\t'), tabSize: indent.length },
      isArrayInsertion: exists,
    },
  );
  return applyEdits(tsconfig, edits);
}

const WILDCARD = /declare\s+module\s+(["'])\*\.s?css\1\s*\{/g;

export function hasWildcardDeclaration(text: string): boolean {
  return new RegExp(WILDCARD).test(text);
}

/**
 * The text with its `declare module "*.css"` and `"*.scss"` declarations
 * removed, or `null` if only comments and whitespace would be left.
 */
export function removeWildcardDeclarations(text: string): string | null {
  let out = '';
  let from = 0;
  const wildcard = new RegExp(WILDCARD);
  for (let m = wildcard.exec(text); m; m = wildcard.exec(text)) {
    // Declarations hold no strings or comments with braces, so counting is enough.
    let depth = 0;
    let end = m.index + m[0].length - 1;
    for (; end < text.length; end++) {
      if (text[end] === '{') depth++;
      else if (text[end] === '}' && --depth === 0) break;
    }
    out += text.slice(from, m.index);
    from = end + 1;
    // Drop the rest of the line, if it's empty.
    const eol = /^[ \t]*\r?\n/.exec(text.slice(from));
    if (eol) from += eol[0].length;
    wildcard.lastIndex = from;
  }
  out += text.slice(from);
  const code = out.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '').trim();
  return code ? out : null;
}
