import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transform } from 'lightningcss';
import type { Declaration } from 'lightningcss';
import { expand } from '../../src/compiler/expand.ts';
import { print } from '../../src/compiler/print.ts';

// Lightning CSS's minifier combines longhands back into their shorthand, so
// a correct expansion minifies to the same CSS as the shorthand it came from.
const SHORTHANDS = [
  'margin: 1px 2px 3px 4px',
  'margin-block: 1px 2px',
  'margin-inline: 1px 2px',
  'padding: 1px 2px',
  'padding-block: 1px',
  'padding-inline: 1px 2px',
  'inset: 1px 2px 3px',
  'inset-block: 0 1px',
  'inset-inline: 0 1px',
  'scroll-margin: 1px 2px',
  'scroll-margin-block: 1px 2px',
  'scroll-margin-inline: 1px 2px',
  'scroll-padding: 1px 2px',
  'scroll-padding-block: 1px 2px',
  'scroll-padding-inline: 1px 2px',
  'border-top: 1px solid red',
  'border-right: 2px dashed blue',
  'border-bottom: thin dotted green',
  'border-left: 3px double',
  'border-block: 1px solid red',
  'border-block-start: 1px solid red',
  'border-block-end: 1px solid red',
  'border-inline: 1px solid red',
  'border-inline-start: 1px solid red',
  'border-inline-end: 1px solid red',
  'border-width: 1px 2px 3px 4px',
  'border-style: solid dashed',
  'border-color: red blue green',
  'border-block-width: 1px 2px',
  'border-block-style: solid dashed',
  'border-block-color: red blue',
  'border-inline-width: 1px 2px',
  'border-inline-style: solid dashed',
  'border-inline-color: red blue',
  'border-radius: 1px 2px 3px 4px / 5px',
  'border-image: url(a.png) 30 round',
  'outline: 1px solid red',
  'gap: 1px 2px',
  'flex: 1 2 10px',
  'flex-flow: column wrap',
  'place-items: center start',
  'place-content: center space-between',
  'place-self: end center',
  'grid-template: auto 1fr / 100px auto',
  'grid-row: 1 / 3',
  'grid-column: 2 / span 2',
  'grid-area: 1 / 2 / 3 / 4',
  'overflow: hidden auto',
  'text-decoration: underline dotted red',
  'text-emphasis: filled circle red',
  'list-style: square inside',
  'container: card / inline-size',
  'font: italic bold 12px/1.5 Georgia, serif',
  'background: url(a.png) no-repeat center / cover, red',
  'transition: color 1s ease-in 2s, opacity 2s',
  'animation: spin 1s linear infinite',
];

const minify = (css: string) =>
  new TextDecoder().decode(
    transform({ filename: 'a.css', code: new TextEncoder().encode(css), minify: true }).code,
  );

function declarationOf(source: string): Declaration {
  let declaration: Declaration | undefined;
  transform({
    filename: 'a.css',
    code: new TextEncoder().encode(`.a{${source}}`),
    visitor: {
      Declaration(d) {
        declaration ??= d;
      },
    },
  });
  return declaration!;
}

const rule = (declarations: Declaration[]) =>
  ({
    type: 'style',
    value: {
      selectors: [[{ type: 'class', name: 'a' }]],
      declarations: { declarations },
      loc: { source_index: 0, line: 0, column: 1 },
    },
  }) as never;

for (const source of SHORTHANDS) {
  test(`expands ${source}`, () => {
    const longhands = expand(declarationOf(source));
    assert.ok(longhands.length > 1, 'expected longhands');
    for (const d of longhands) assert.notEqual(d.property, source.split(':')[0]);
    // Longhands Lightning CSS keeps no value for are set to `initial`, and
    // don't combine back into the shorthand.
    const parsed = longhands.filter((d) => d.property !== 'custom');
    assert.equal(minify(print([rule(parsed)], [], {}, false).code), minify(`.a{${source}}`));
  });
}

test('keeps border as it is', () => {
  // It would expand to 12 longhands.
  const declaration = declarationOf('border: 1px solid red');
  assert.deepEqual(expand(declaration), [declaration]);
});

test('keeps shorthands with var() as they are', () => {
  const declaration = declarationOf('margin: var(--m)');
  assert.deepEqual(expand(declaration), [declaration]);
});

test('keeps shorthands with CSS-wide keywords as they are', () => {
  // A keyword applies to every longhand equally, so splitting it would only
  // add classes.
  for (const source of ['font: inherit', 'margin: initial', 'border: unset']) {
    const declaration = declarationOf(source);
    assert.deepEqual(expand(declaration), [declaration]);
  }
});
