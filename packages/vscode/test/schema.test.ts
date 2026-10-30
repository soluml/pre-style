import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { wrapFieldSchema } from '../src/schema.ts';

const field = JSON.parse(
  readFileSync(new URL('../../core/package.schema.json', import.meta.url), 'utf8'),
);
const schema = wrapFieldSchema(field);

function refs(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(refs);
  if (value === null || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([k, v]) =>
    k === '$ref' && typeof v === 'string' ? [v] : refs(v),
  );
}

function resolve(root: unknown, ref: string): unknown {
  assert.ok(ref.startsWith('#/'), `${ref} is not a local reference`);
  return ref
    .slice(2)
    .split('/')
    .reduce<any>((node, key) => node?.[key], root);
}

describe('wrapFieldSchema', () => {
  test('puts the field schema under the pre.style property', () => {
    const prop = (schema.properties as any)['pre.style'];
    assert.equal(prop.description, field.description);
    assert.deepEqual(prop.anyOf, field.anyOf);
  });

  test('every $ref resolves from the root', () => {
    const found = refs(schema);
    assert.ok(found.length > 0);
    for (const ref of found) {
      assert.notEqual(resolve(schema, ref), undefined, `${ref} does not resolve`);
    }
  });

  test('declares no other package.json properties', () => {
    assert.deepEqual(Object.keys(schema.properties as object), ['pre.style']);
    assert.equal(schema.required, undefined);
    assert.equal(schema.additionalProperties, undefined);
  });
});
