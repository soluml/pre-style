import { test } from 'node:test';
import assert from 'node:assert/strict';
import { css, scss } from '../src/index.ts';

test('css throws when the transform was not applied', () => {
  assert.throws(
    () => css`
      color: red;
    `,
    /Pre-Style transform not applied/,
  );
});

test('scss throws when the transform was not applied', () => {
  assert.throws(() => scss`color: red;`, /Pre-Style transform not applied/);
});
