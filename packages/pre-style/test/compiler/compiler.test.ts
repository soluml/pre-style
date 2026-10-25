import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Compiler, createCompiler, PreStyleError } from '../../src/compiler/index.ts';
import { compile, css } from './helpers.ts';

// Class names depend on how often each entry is used across all blocks.
// Ties are broken by each entry's key, so the letters in these tests are
// stable but not always in reading order.

describe('spec examples', () => {
  test('flat declarations and a selector variant', async () => {
    const { classes, css: output } = await compile([`color: blue; & > * { color: green; }`]);
    assert.deepEqual(classes, ['A A-B']);
    assert.equal(
      output,
      css`
        .A{color:#00f}
        .A-B>*{color:green}
      `,
    );
  });

  test('an atomic at-rule', async () => {
    const { classes, css: output } = await compile([
      `color: black; @media (min-width: 768px) and (prefers-color-scheme: dark) { background-color: red; }`,
    ]);
    assert.deepEqual(classes, ['B A_A']);
    assert.equal(
      output,
      css`
        .B{color:#000}
        @media (width>=768px) and (prefers-color-scheme:dark) {
          .A_A{background-color:red}
        }
      `,
    );
  });

  test('blocks merged with merge share the at-rule name', async () => {
    const { classes, css: output } = await compile([
      `color: yellow; @media (min-width: 768px) { background-color: green; }`,
      `color: orange; @media (min-width: 768px) { background-color: purple; }`,
    ]);
    assert.deepEqual(classes, ['D A_A', 'C A_B']);
    assert.equal(
      output,
      css`
        .D{color:#ff0}
        .C{color:orange}
        @media (width>=768px) {
          .A_A{background-color:green}
          .A_B{background-color:purple}
        }
      `,
    );
  });

  test('shorthand expansion', async () => {
    const { classes, css: output } = await compile([
      `margin: auto; padding: var(--gap); padding-top: 0;`,
    ]);
    assert.deepEqual(classes, ['D C A B F E']);
    // `padding: var(--gap)` can't be expanded, so it comes first and
    // `padding-top: 0` wins.
    assert.equal(
      output,
      css`
        .F{padding:var(--gap)}
        .D{margin-top:auto}
        .C{margin-right:auto}
        .A{margin-bottom:auto}
        .B{margin-left:auto}
        .E{padding-top:0}
      `,
    );
  });
});

describe('names', () => {
  test('the most-used entries get the shortest names', async () => {
    const { classes } = await compile([
      `color: red; margin-top: 0`,
      `color: red`,
      `color: red; padding-top: 0`,
      `padding-top: 0`,
    ]);
    // `color: red` is used 3 times, `padding-top: 0` twice, `margin-top: 0` once.
    assert.deepEqual(classes, ['A C', 'A', 'A B', 'B']);
  });

  test('equal declarations share a class, however they are written', async () => {
    const { classes, css: output } = await compile([
      `color: blue`,
      `color: #00f`,
      `color: rgb(0 0 255)`,
    ]);
    assert.deepEqual(classes, ['A', 'A', 'A']);
    assert.equal(output, '.A{color:#00f}');
  });

  test('equivalent nestings produce the same class', async () => {
    const { classes, css: output } = await compile([
      `@media (min-width: 1px) { &:hover { color: red } }`,
      `&:hover { @media (min-width: 1px) { color: red } }`,
    ]);
    assert.deepEqual(classes, ['A_A-A', 'A_A-A']);
    assert.equal(
      output,
      css`
        @media (width>=1px) {
          .A_A-A:hover{color:red}
        }
      `,
    );
  });

  test('nested at-rules are written from outermost to innermost', async () => {
    const { classes, css: output } = await compile([
      `@supports (display: grid) { @media (min-width: 768px) { display: grid } }`,
    ]);
    assert.deepEqual(classes, ['B_A_A']);
    assert.equal(
      output,
      css`
        @supports (display:grid) {
          @media (width>=768px) {
            .B_A_A{display:grid}
          }
        }
      `,
    );
  });

  test('!important declarations get their own class', async () => {
    const { classes, css: output } = await compile([`color: red !important`, `color: red`]);
    assert.deepEqual(classes, ['B', 'A']);
    assert.equal(
      output,
      css`
        .B{color:red!important}
        .A{color:red}
      `,
    );
  });

  test('custom properties become atomic classes', async () => {
    const { classes, css: output } = await compile([`--gap: 4px; gap: var(--gap)`]);
    assert.deepEqual(classes, ['A B']);
    // `gap: var(--gap)` is a shorthand that couldn't be expanded, so it
    // comes first.
    assert.equal(
      output,
      css`
        .B{gap:var(--gap)}
        .A{--gap:4px}
      `,
    );
  });

  test('dev mode names blocks on demand, without a scan', async () => {
    const compiler = await createCompiler({ lightningcss: { minify: true } });
    assert.equal(compiler.classString({ code: 'margin-top: 0', lang: 'css' }), 'A');
    assert.equal(compiler.classString({ code: 'color: red; margin-top: 0', lang: 'css' }), 'B A');
    assert.equal(compiler.css().code, '.A{margin-top:0}.B{color:red}');
  });
});

describe('selector variants', () => {
  test('complex selectors are one segment each', async () => {
    const { classes, css: output } = await compile([
      `.dark & { color: white } a { color: red } & > *, &:hover { color: green } &.active:hover { color: blue } &:hover { & > span { color: pink } }`,
    ]);
    assert.deepEqual(classes, ['A-E D-C C-B B-A E-D']);
    assert.equal(
      output,
      css`
        .dark .A-E{color:#fff}
        .D-C a{color:red}
        .C-B>*,.C-B:hover{color:green}
        .B-A.active:hover{color:#00f}
        .E-D:hover>span{color:pink}
      `,
    );
  });
});

describe('output order', () => {
  test('base classes, then selector variants in LVHFA order', async () => {
    const { css: output } = await compile([
      `&:active { color: red } &:focus { color: red } &:hover { color: red } &:visited { color: red } &:link { color: red } &::before { content: 'x' } color: red`,
    ]);
    // Lightning CSS's minifier merges the adjacent rules with the same
    // declarations, keeping their order.
    assert.equal(
      output,
      css`
        .A{color:red}
        .F-B:before{content:"x"}
        .D-A:link,.E-A:visited,.C-A:hover,.B-A:focus,.A-A:active{color:red}
      `,
    );
  });

  test('@media min-width queries come last, smallest first', async () => {
    const { css: output } = await compile([
      `@media (min-width: 1024px) { color: red } @media print { color: red } @media (min-width: 40em) { color: red } @media (max-width: 100px) { color: red } @media (min-width: 320px) { color: red }`,
    ]);
    assert.equal(
      output,
      css`
        @media print {
          .E_A{color:red}
        }
        @media (width<=100px) {
          .D_A{color:red}
        }
        @media (width>=320px) {
          .C_A{color:red}
        }
        @media (width>=40em) {
          .A_A{color:red}
        }
        @media (width>=1024px) {
          .B_A{color:red}
        }
      `,
    );
  });

  test('hoisted at-rules come first, in hoist order', async () => {
    const { css: output } = await compile([
      `@font-face { font-family: x; src: url(x.woff2) } @namespace svg url(http://www.w3.org/2000/svg); @import url(a.css); @layer base, components; color: red`,
    ]);
    assert.equal(
      output,
      css`
        @layer base,components;
        @import "a.css";
        @namespace svg "http://www.w3.org/2000/svg";
        @font-face{font-family:x;src:url(x.woff2)}
        .A{color:red}
      `,
    );
  });
});

describe('declarations in a block', () => {
  test('later declarations override earlier ones', async () => {
    const { classes, css: output } = await compile([
      `color: red; color: blue; margin-top: 1px; margin: 0;`,
    ]);
    assert.deepEqual(classes, ['A E D B C']);
    assert.equal(
      output,
      css`
        .A{color:#00f}
        .E{margin-top:0}
        .D{margin-right:0}
        .B{margin-bottom:0}
        .C{margin-left:0}
      `,
    );
  });

  test('!important declarations win', async () => {
    const { classes, css: output } = await compile([`color: red !important; color: blue`]);
    assert.deepEqual(classes, ['A']);
    assert.equal(output, '.A{color:red!important}');
  });

  test('shorthands with CSS-wide keywords stay one class', async () => {
    // Written before longhands, so `font-weight: 600` still wins.
    const { classes, css: output } = await compile([`font: inherit; font-weight: 600`]);
    assert.deepEqual(classes, ['B A']);
    assert.equal(
      output,
      css`
        .B{font:inherit}
        .A{font-weight:600}
      `,
    );
  });

  test('a later shorthand with a CSS-wide keyword overrides earlier longhands', async () => {
    const { classes, css: output } = await compile([`font-weight: 600; font: inherit`]);
    assert.deepEqual(classes, ['A']);
    assert.equal(output, '.A{font:inherit}');
  });
});

describe('global rules', () => {
  test('identical rules from several blocks are written once', async () => {
    const { classes, css: output } = await compile([
      `@keyframes spin { to { rotate: 1turn } } animation-name: spin`,
      `@keyframes spin { to { rotate: 1turn } } color: red`,
    ]);
    assert.deepEqual(classes, ['A', 'B']);
    assert.equal(
      output,
      css`
        @keyframes spin {
          to{rotate:1turn}
        }
        .A{animation-name:spin}
        .B{color:red}
      `,
    );
  });

  test('only the last definition of an overridable at-rule is kept', async () => {
    const { classes, css: output } = await compile([
      `@keyframes spin { to { rotate: 1turn } }`,
      `@keyframes spin { to { rotate: -1turn } }`,
    ]);
    assert.deepEqual(classes, ['', '']);
    assert.equal(
      output,
      css`
        @keyframes spin {
          to{rotate:-1turn}
        }
      `,
    );
  });
});

describe('scss blocks', () => {
  test('compile with Sass first', async () => {
    const { classes, css: output } = await compile([
      {
        code: `$c: red; color: $c; &:hover { color: #c00 } @media (min-width: 1px) { margin-top: 0 }`,
        lang: 'scss',
      },
    ]);
    assert.deepEqual(classes, ['B A-A A_C']);
    assert.equal(
      output,
      css`
        .B{color:red}
        .A-A:hover{color:#c00}
        @media (width>=1px) {
          .A_C{margin-top:0}
        }
      `,
    );
  });

  test('Sass warnings go to the warn option', async () => {
    const warnings: string[] = [];
    await compile([{ code: '@warn "careful"; color: red', lang: 'scss' }], {
      warn: (message) => warnings.push(message),
    });
    assert.deepEqual(warnings, ['careful']);
  });
});

describe('prependFiles', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pre-style-'));
  writeFileSync(join(dir, 'vars.css'), ':root { --gap: 4px }');
  writeFileSync(join(dir, 'vars.scss'), '$brand: red; @mixin hover { &:hover { @content; } }');

  test('an array applies to every block', async () => {
    const { css: output } = await compile(
      [`gap: var(--gap)`, { code: `margin-top: 0`, lang: 'scss' }],
      { root: dir, prependFiles: ['vars.css'] },
    );
    // The rule from the prepended file is written once.
    assert.equal(
      output,
      css`
        :root{--gap:4px}
        .B{gap:var(--gap)}
        .A{margin-top:0}
      `,
    );
  });

  test('an object applies css files to css blocks and scss files to scss blocks', async () => {
    const { classes, css: output } = await compile(
      [`gap: var(--gap)`, { code: `color: $brand; @include hover { color: blue }`, lang: 'scss' }],
      { root: dir, prependFiles: { css: ['vars.css'], scss: ['vars.scss'] } },
    );
    assert.deepEqual(classes, ['C', 'B A-A']);
    assert.equal(
      output,
      css`
        :root{--gap:4px}
        .C{gap:var(--gap)}
        .B{color:red}
        .A-A:hover{color:#00f}
      `,
    );
  });
});

describe('lightningcss option', () => {
  test("the user's visitor runs before Pre-Style atomizes", async () => {
    const { css: output } = await compile([`margin-top: 1px`], {
      lightningcss: { visitor: { Length: (length) => ({ ...length, value: length.value * 2 }) } },
    });
    assert.equal(output, '.A{margin-top:2px}');
  });

  test('options apply when writing the output', async () => {
    const compiler = await createCompiler({ lightningcss: { minify: false } });
    compiler.classString({ code: 'color: red', lang: 'css' });
    assert.equal(compiler.css().code, '.A {\n  color: red;\n}\n');
  });
});

describe('sourceMap option', () => {
  test('maps each class to the first block it appears in', async () => {
    const compiler = await createCompiler({ sourceMap: true, lightningcss: { minify: true } });
    compiler.classString({
      code: '\n  color: red;\n  &:hover { color: blue }',
      lang: 'css',
      file: '/src/A.tsx',
      line: 5,
      column: 18,
    });
    compiler.classString({
      code: 'color: red',
      lang: 'css',
      file: '/src/B.tsx',
      line: 2,
      column: 9,
    });
    const { code, map } = compiler.css();
    assert.equal(code, '.A{color:red}.A-B:hover{color:#00f}');
    const json = JSON.parse(map!);
    assert.deepEqual(json.sources, ['/src/A.tsx']);
    // `.A` maps to line 5, column 18 (A.tsx's first block), and `.A-B:hover`
    // to line 7, column 3.
    assert.equal(json.mappings, 'AAIiB,aAEf');
  });

  test('is off by default', async () => {
    const compiler = await createCompiler();
    compiler.classString({ code: 'color: red', lang: 'css' });
    assert.equal(compiler.css().map, null);
  });
});

describe('errors', () => {
  test('invalid CSS fails with the file, line, and column', async () => {
    const compiler = await createCompiler();
    assert.throws(
      () =>
        compiler.classString({
          code: 'color: red;\n  & > { }}',
          lang: 'css',
          file: 'src/App.tsx',
          line: 10,
          column: 20,
        }),
      (error: unknown) =>
        error instanceof PreStyleError && error.message.startsWith('src/App.tsx:11:7: Invalid CSS'),
    );
  });

  test('Sass errors fail with the file, line, and column', async () => {
    const compiler = await createCompiler();
    assert.throws(
      () =>
        compiler.classString({
          code: 'color: $nope;',
          lang: 'scss',
          file: 'src/App.tsx',
          line: 10,
          column: 20,
        }),
      (error: unknown) =>
        error instanceof PreStyleError &&
        error.message.startsWith(
          'src/App.tsx:10:27: Sass failed to compile the block: Undefined variable.',
        ),
    );
  });

  test('scss blocks fail when Sass is not installed', () => {
    const compiler = new Compiler({}, null);
    assert.throws(
      () => compiler.classString({ code: 'color: red', lang: 'scss' }),
      /Install the `sass` package/,
    );
  });
});
