import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createCn, cn } from '../src/index.ts';
import { createCompiler } from '../src/compiler/index.ts';

const table = {
  '': { color: 'A B', 'margin-top': 'C', margin: 'D', 'background-color': 'G' },
  E: { color: 'E-A' },
  F: { color: 'F_A' },
};

describe('cn', () => {
  const m = createCn(table);

  test('a later class wins when both set the same property', () => {
    assert.equal(m('A', 'B'), 'B');
    assert.equal(m('B A'), 'A');
  });

  test('classes with different prefixes do not conflict', () => {
    assert.equal(m('A', 'E-A', 'F_A'), 'A E-A F_A');
  });

  test('a later shorthand removes earlier longhands it covers', () => {
    assert.equal(m('C', 'D'), 'D');
  });

  test('a later longhand after a shorthand keeps both', () => {
    assert.equal(m('D', 'C'), 'D C');
  });

  test('takes clsx-style arguments', () => {
    assert.equal(m('A', null, false, undefined, 0, ['C', ['G']], { B: true, D: false }), 'C G B');
  });

  test('keeps classes it does not know, and drops duplicates', () => {
    assert.equal(m('custom', 'A', 'custom', 'other'), 'A custom other');
  });

  test('without a table, only combines classes', () => {
    assert.equal(cn('A', 'B', { C: true }, 'A'), 'B C A');
  });
});

describe('cn with a compiled table', () => {
  test('the spec example', async () => {
    const compiler = await createCompiler();
    const blocks = [
      `color: yellow; @media (min-width: 768px) { background-color: green; }`,
      `color: orange; @media (min-width: 768px) { background-color: purple; }`,
    ].map((code) => ({ code, lang: 'css' as const }));
    for (const block of blocks) compiler.scan(block);
    compiler.assignNames();
    const [first, second] = blocks.map((block) => compiler.classString(block));
    assert.equal(first, 'B C');
    assert.equal(second, 'A D');
    assert.equal(createCn(compiler.cnTable())(first, second), 'A D');
  });

  test('classes conflict only under the same at-rules and selector variant', async () => {
    const compiler = await createCompiler();
    const blocks = [
      `color: red; &:hover { color: red } @media (min-width: 1px) { color: red }`,
      `color: blue; &:hover { color: blue } @media (min-width: 1px) { color: blue }`,
      `@media (min-width: 1px) { &:hover { color: green } }`,
    ].map((code) => ({ code, lang: 'css' as const }));
    const [red, blue, green] = blocks.map((block) => compiler.classString(block));
    const compiled = compiler.cnTable();
    const prefixOf = (c: string) =>
      Object.keys(compiled).find((prefix) => compiled[prefix].color?.split(' ').includes(c));
    const prefixes = (classes: string) => classes.split(' ').map(prefixOf);
    assert.deepEqual(prefixes(red), prefixes(blue));
    assert.equal(new Set([...prefixes(red), ...prefixes(green)]).size, 4);
    assert.equal(prefixes(red)[0], '');
    const m = createCn(compiled);
    assert.equal(m(red, blue), blue);
    assert.equal(m(red, green), `${red} ${green}`);
  });

  test('a later class removes an !important one', async () => {
    const compiler = await createCompiler();
    const important = compiler.classString({ code: 'color: red !important', lang: 'css' });
    const normal = compiler.classString({ code: 'color: blue', lang: 'css' });
    assert.equal(createCn(compiler.cnTable())(important, normal), normal);
  });

  test('a later shorthand with a CSS-wide keyword removes earlier longhands', async () => {
    const compiler = await createCompiler();
    const weight = compiler.classString({ code: 'font-weight: 600', lang: 'css' });
    const inherit = compiler.classString({ code: 'font: inherit', lang: 'css' });
    const m = createCn(compiler.cnTable());
    assert.equal(m(weight, inherit), inherit);
    assert.equal(m(inherit, weight), `${inherit} ${weight}`);
  });

  test('a later unexpanded shorthand removes earlier longhands', async () => {
    const compiler = await createCompiler();
    const longhands = compiler.classString({
      code: 'padding-top: 1px; padding-left: 1px; color: red',
      lang: 'css',
    });
    const shorthand = compiler.classString({ code: 'padding: var(--p)', lang: 'css' });
    const m = createCn(compiler.cnTable());
    assert.equal(m(longhands, shorthand), `${longhands.split(' ')[2]} ${shorthand}`);
    assert.equal(m(shorthand, longhands), `${shorthand} ${longhands}`);
  });
});
