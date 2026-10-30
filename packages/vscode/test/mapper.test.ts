import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addContentMapper,
  hasContentMapper,
  hasWildcardDeclaration,
  removeWildcardDeclarations,
  supportsContentMappers,
  usesPreStyle,
  WILDCARD_DECLARATION,
} from '../src/mapper.ts';

describe('supportsContentMappers', () => {
  test('7.1 and later, prereleases included', () => {
    assert.equal(supportsContentMappers('7.0.2'), false);
    assert.equal(supportsContentMappers('6.0.3'), false);
    assert.equal(supportsContentMappers('7.1.0-beta'), true);
    assert.equal(supportsContentMappers('7.1.0'), true);
    assert.equal(supportsContentMappers('8.0.0'), true);
  });
});

describe('usesPreStyle', () => {
  test('either package, in dependencies or devDependencies', () => {
    assert.equal(usesPreStyle('{"dependencies":{"@pre.style/core":"^3"}}'), true);
    assert.equal(usesPreStyle('{"devDependencies":{"@pre.style/vite":"^3"}}'), true);
    assert.equal(usesPreStyle('{"dependencies":{"react":"^19"}}'), false);
    assert.equal(usesPreStyle('{}'), false);
  });
});

describe('addContentMapper', () => {
  test('adds the array, keeping comments', () => {
    const before = '{\n  // Base config.\n  "extends": "./base.json",\n}\n';
    const after = addContentMapper(before);
    assert.ok(after.includes('// Base config.'));
    assert.ok(hasContentMapper(after));
    assert.equal(
      after,
      '{\n  // Base config.\n  "extends": "./base.json",\n  "contentMappers": [\n    {\n      "package": "@pre.style/core",\n      "extensions": [\n        ".css",\n        ".scss"\n      ]\n    }\n  ],\n}\n',
    );
  });

  test('appends to an existing array', () => {
    const after = addContentMapper(
      '{\n  "contentMappers": [{ "package": "other", "extensions": [".x"] }]\n}',
    );
    assert.ok(after.includes('"other"'));
    assert.ok(hasContentMapper(after));
  });

  test('uses the file’s indentation', () => {
    const after = addContentMapper('{\n\t"include": ["src"]\n}');
    assert.ok(after.includes('\n\t"contentMappers": [\n\t\t{'));
  });

  test('leaves a configured file alone', () => {
    const configured = addContentMapper('{}');
    assert.equal(addContentMapper(configured), configured);
  });

  test('rejects invalid JSON', () => {
    assert.throws(() => addContentMapper('{ "a": '));
    assert.throws(() => addContentMapper('[]'));
  });
});

describe('removeWildcardDeclarations', () => {
  test('removes both declarations and keeps other code', () => {
    const text = `declare const x: number;\n${WILDCARD_DECLARATION}declare module "*.svg";\n`;
    assert.equal(
      removeWildcardDeclarations(text),
      'declare const x: number;\ndeclare module "*.svg";\n',
    );
  });

  test('single quotes and one language', () => {
    const text =
      "declare module '*.scss' {\n  const c: { [k: string]: string };\n  export = c;\n}\nexport {};\n";
    assert.equal(removeWildcardDeclarations(text), 'export {};\n');
  });

  test('null when only comments are left', () => {
    assert.equal(
      removeWildcardDeclarations(`// Stylesheet types.\n/* x */\n${WILDCARD_DECLARATION}`),
      null,
    );
  });

  test('detection', () => {
    assert.equal(hasWildcardDeclaration(WILDCARD_DECLARATION), true);
    assert.equal(hasWildcardDeclaration('declare module "*.svg";'), false);
    assert.equal(hasWildcardDeclaration("declare module '*.module.css' {}"), false);
  });
});
