import { test } from 'node:test';
import assert from 'node:assert/strict';
import preStyle from '../src/index.ts';

test('creates a Vite plugin named pre-style', () => {
  assert.equal(preStyle().name, 'pre-style');
});
