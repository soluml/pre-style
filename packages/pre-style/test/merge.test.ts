import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createMerge, merge } from '../src/index.ts';
import { createCompiler } from '../src/compiler/index.ts';

const table = {
  A: ['', 'color'],
  B: ['', 'color'],
  C: ['', 'margin-top'],
  D: ['', 'margin'],
  'E-A': ['E-', 'color'],
  F_A: ['F_', 'color'],
  G: ['', 'background-color'],
} as const;

describe('merge', () => {
  const m = createMerge(table);

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
    assert.equal(merge('A', 'B', { C: true }, 'A'), 'B C A');
  });
});

describe('merge with a compiled table', () => {
  test('the spec example', async () => {
    const compiler = await createCompiler();
    const blocks = [
      `color: yellow; @media (min-width: 768px) { background-color: green; }`,
      `color: orange; @media (min-width: 768px) { background-color: purple; }`,
    ].map((code) => ({ code, lang: 'css' as const }));
    for (const block of blocks) compiler.scan(block);
    compiler.assignNames();
    const [first, second] = blocks.map((block) => compiler.classString(block));
    assert.equal(first, 'D A_A');
    assert.equal(second, 'C A_B');
    assert.equal(createMerge(compiler.mergeTable())(first, second), 'C A_B');
  });

  test('a later class removes an !important one', async () => {
    const compiler = await createCompiler();
    const important = compiler.classString({ code: 'color: red !important', lang: 'css' });
    const normal = compiler.classString({ code: 'color: blue', lang: 'css' });
    assert.equal(createMerge(compiler.mergeTable())(important, normal), normal);
  });

  test('a later unexpanded shorthand removes earlier longhands', async () => {
    const compiler = await createCompiler();
    const longhands = compiler.classString({
      code: 'padding-top: 1px; padding-left: 1px; color: red',
      lang: 'css',
    });
    const shorthand = compiler.classString({ code: 'padding: var(--p)', lang: 'css' });
    const m = createMerge(compiler.mergeTable());
    assert.equal(m(longhands, shorthand), `${longhands.split(' ')[2]} ${shorthand}`);
    assert.equal(m(shorthand, longhands), `${shorthand} ${longhands}`);
  });
});
