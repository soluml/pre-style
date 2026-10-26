import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build, createServer, defaultClientConditions } from 'vite';
import type { InlineConfig, Rollup } from 'vite';
import preStyle from '../src/index.ts';
import type { PreStyleOptions } from '../src/index.ts';

const fixture = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

const config = (name: string, options: PreStyleOptions): InlineConfig => ({
  root: fixture(name),
  logLevel: 'silent',
  // Resolve `pre-style` to its TypeScript source, so tests don't need a build.
  resolve: { conditions: ['pre-style-source', ...defaultClientConditions] },
  build: { write: false, minify: false },
  plugins: [preStyle(options)],
});

// Builds a fixture without writing it, and returns its output files.
async function buildFixture(
  name: string,
  options: PreStyleOptions = {},
  overrides: InlineConfig = {},
) {
  const base = config(name, options);
  const result = (await build({
    ...base,
    ...overrides,
    build: { ...base.build, ...overrides.build },
  })) as Rollup.RollupOutput;
  const files = new Map<string, string>();
  for (const item of result.output)
    files.set(item.fileName, item.type === 'chunk' ? item.code : String(item.source));
  return files;
}

// The class string assigned to `button` in transformed code.
const classString = (code: string) => /button = "([^"]+)"/.exec(code)![1];

const chunk = (files: Map<string, string>) => [...files].find(([name]) => name.endsWith('.js'))![1];

describe('build', () => {
  test('replaces blocks and writes the CSS file', async () => {
    const files = await buildFixture('basic', { lightningcss: { minify: true } });
    assert.equal(
      files.get('prestyle.css'),
      '.P{padding-top:1rem}.N{padding-right:2rem}.J{padding-bottom:1rem}.L{padding-left:2rem}.A{color:red}' +
        '.O{padding-top:8px}.M{padding-right:8px}.I{padding-bottom:8px}.K{padding-left:8px}.D{font-size:2rem}' +
        '.H{margin-top:0}.G{margin-right:0}.E{margin-bottom:0}.F{margin-left:0}.C{color:green}.B:hover{color:#00f}' +
        '@media (width>=768px){.Q{font-size:3rem}}',
    );
    const js = chunk(files);
    // Rolldown inlines the short class strings of `base` and `big`.
    assert.match(js, /cn\("A B", "D Q", window\.location\.hash\)/);
    assert.doesNotMatch(js, /css`|scss`/);
  });

  test('replaces blocks in HTML and links the CSS file', async () => {
    const html = (await buildFixture('basic')).get('index.html')!;
    assert.match(html, /<main class="P N J L A">Hello<\/main>/);
    assert.match(html, /<link rel="stylesheet" href="\/prestyle.css">/);
  });

  test('resolves cn calls with static arguments at build time', async () => {
    const js = chunk(await buildFixture('basic'));
    // `color: red` is overridden by `color: green`.
    assert.match(js, /document\.body\.className = "H G E F C";/);
  });

  test('other cn calls use the project lookup table', async () => {
    const js = chunk(await buildFixture('basic'));
    assert.match(js, /var cn = \/\* @__PURE__ \*\/ createCn\(\{/);
    // The default `cn` from pre-style is dropped.
    assert.doesNotMatch(js, /^createCn\(\{\}\);$/m);
    assert.match(js, /"B": \{ "font-size": "Q" \}/);
    assert.match(
      js,
      /document\.body\.dataset\.dynamic = cn\("A B", "D Q", window\.location\.hash\);/,
    );
  });

  test('the quotes option sets the quote character', async () => {
    const js = chunk(await buildFixture('basic', { quotes: 'single-quote' }));
    assert.match(js, /document\.body\.className = "H G E F C";/);
    const backtick = chunk(await buildFixture('basic', { quotes: 'backtick' }));
    assert.match(backtick, /document\.body\.className = `H G E F C`;/);
  });

  test('the output option sets the file name, banner, and footer', async () => {
    const files = await buildFixture('basic', {
      lightningcss: { minify: true },
      output: {
        file: 'css/pre-style.css',
        banner: '/* Top of file */',
        footer: '/* End of file */',
      },
    });
    const css = files.get('css/pre-style.css')!;
    assert.ok(css.startsWith('/* Top of file */\n.P{'));
    assert.ok(css.endsWith('}/* End of file */'));
    assert.match(files.get('index.html')!, /<link rel="stylesheet" href="\/css\/pre-style.css">/);
  });

  test('the sourceMap option writes a source map next to the CSS file', async () => {
    const files = await buildFixture('basic', {
      sourceMap: true,
      lightningcss: { minify: true },
      output: { banner: '/* a */\n/* b */' },
    });
    assert.match(files.get('prestyle.css')!, /\/\*# sourceMappingURL=prestyle.css.map \*\/\n$/);
    const map = JSON.parse(files.get('prestyle.css.map')!);
    assert.deepEqual(map.sources.toSorted(), [
      '../index.html',
      '../src/button.ts',
      '../src/main.ts',
    ]);
    // Two banner lines shift the mappings down.
    assert.ok(map.mappings.startsWith(';;'));
  });

  test('prependFiles applies to scss blocks, and other imports from pre-style are kept', async () => {
    const files = await buildFixture('prepend', {
      prependFiles: { scss: ['vars.scss'] },
      lightningcss: { minify: true },
    });
    assert.equal(files.get('prestyle.css'), '.A{color:#639}');
    assert.match(chunk(files), /const value = "A";|var value = "A";/);
  });

  test('include and exclude choose the files scanned before the build', async () => {
    // Without the HTML file, its block isn't scanned. It's still replaced,
    // and named on demand after the scanned blocks.
    const files = await buildFixture('basic', {
      exclude: '**/*.html',
      lightningcss: { minify: true },
    });
    assert.match(files.get('index.html')!, /<main class="N O P Q A">Hello<\/main>/);
    assert.match(files.get('prestyle.css')!, /\.N\{padding-top:1rem\}/);
  });
});

describe('importing virtual:pre-style.css', () => {
  test('Vite bundles the CSS, and the plugin does not write output.file', async () => {
    const files = await buildFixture('imported', { lightningcss: { minify: true } });
    assert.equal(files.get('prestyle.css'), undefined);
    const css = [...files].find(([name]) => name.endsWith('.css'));
    assert.match(css![0], /^assets\/index-.+\.css$/);
    assert.match(css![1], /\.A\{color:red\}/);
  });

  // Vite doesn't write source maps for bundled CSS, even with
  // `build.sourcemap`, so imported CSS only has a map in dev.
  test('the bundled CSS has no source map', async () => {
    const files = await buildFixture(
      'imported',
      { sourceMap: true },
      { build: { sourcemap: true } },
    );
    assert.ok(![...files.keys()].some((name) => name.endsWith('.css.map')));
  });
});

describe('component libraries', () => {
  // The libraries are installed into a real node_modules for these tests.
  const modules = `${fixture('library')}/node_modules`;
  before(() => cpSync(fixture('library-packages'), modules, { recursive: true }));
  after(() => rmSync(modules, { recursive: true, force: true }));

  test('dependencies with a pre-style field are compiled, with their own prepended files', async () => {
    const files = await buildFixture('library', { lightningcss: { minify: true } });
    // acme-ui and acme-icons (a dependency of acme-ui) each prepend their own
    // tokens. The app's `color: red` and acme-ui's share a class.
    assert.equal(files.get('prestyle.css'), '.C{width:16px}.B{padding-top:4px}.A{color:red}');
    const js = chunk(files);
    assert.match(js, /var app = "A";/);
    assert.match(js, /document\.body\.dataset\.button = "B A";/);
    assert.match(js, /document\.body\.dataset\.icon = "C";/);
    // plain-ui has no pre-style field, so it isn't compiled.
    assert.match(js, /var plain = css`margin-top: 0;`;/);
  });

  test('the libraries option adds packages and leaves them out', async () => {
    const files = await buildFixture('library', {
      lightningcss: { minify: true },
      libraries: { 'plain-ui': true, 'acme-icons': false },
    });
    assert.equal(files.get('prestyle.css'), '.C{padding-top:4px}.A{color:red}.B{margin-top:0}');
    const js = chunk(files);
    assert.match(js, /document\.body\.dataset\.plain = "B";/);
    assert.match(js, /var icon = scss`width: \$icon-size;`;/);
  });

  test("in dev, libraries aren't pre-bundled or externalized, and render the same on the server", async () => {
    const server = await createServer({
      ...config('library', {}),
      server: { middlewareMode: true, ws: false },
    });
    try {
      assert.deepEqual(server.config.optimizeDeps.exclude, ['acme-ui', 'acme-icons']);
      assert.deepEqual(server.environments.ssr.config.resolve.noExternal, [
        'acme-ui',
        'acme-icons',
      ]);
      const id = `${modules}/acme-ui/index.js`;
      const client = await server.environments.client.transformRequest(id);
      const ssr = await server.environments.ssr.transformRequest(id);
      assert.equal(classString(client!.code), classString(ssr!.code));
    } finally {
      await server.close();
    }
  });
});

describe('errors', () => {
  const main = `${fixture('errors')}/src/main.ts`;
  after(() => writeFileSync(main, 'export const ok = true;\n'));

  test('css used other than as a tagged template', async () => {
    writeFileSync(main, "import { css } from 'pre-style';\nexport const f = css;\n");
    await assert.rejects(
      buildFixture('errors'),
      /`css` from pre-style can only be used as a tagged template/,
    );
  });

  test('interpolation in a block', async () => {
    writeFileSync(
      main,
      "import { css } from 'pre-style';\nconst c = 'red';\nexport const f = css`color: ${c}`;\n",
    );
    await assert.rejects(buildFixture('errors'), /Blocks cannot contain \$\{…\} interpolation/);
  });

  test('invalid CSS reports the file and position', async () => {
    writeFileSync(
      main,
      "import { css } from 'pre-style';\nexport const f = css`\n  color: red;\n  & > { }}`;\n",
    );
    await assert.rejects(buildFixture('errors'), (error: Error) =>
      error.message.includes(`${main}:4:7: Invalid CSS`),
    );
  });
});

describe('dev', () => {
  test('serves class strings and a CSS module that updates', async () => {
    const server = await createServer({
      ...config('basic', { lightningcss: { minify: true } }),
      server: { middlewareMode: true, ws: false },
    });
    try {
      const main = await server.transformRequest('/src/main.ts');
      // Vite rewrites the virtual import to its resolved ID.
      assert.match(main!.code, /^import "\/__pre-style.css";/);
      // Dev names blocks in the order they're served.
      assert.match(main!.code, /const base = "A B";/);

      const button = await server.transformRequest('/src/button.ts');
      const css = await server.transformRequest('/__pre-style.css');
      assert.match(css!.code, /padding-top:8px/);

      // The SSR environment shares the compiler, so it renders the same
      // class strings the browser hydrates. `button.ts`'s names depend on
      // the blocks named before it, so a separate compiler would differ.
      const ssrButton = await server.environments.ssr.transformRequest('/src/button.ts');
      assert.equal(classString(ssrButton!.code), classString(button!.code));
      assert.notEqual(classString(button!.code).split(' ')[0], 'A');
    } finally {
      await server.close();
    }
  });

  test('with sourceMap, the CSS module maps to the blocks', async () => {
    const server = await createServer({
      ...config('basic', { sourceMap: true }),
      server: { middlewareMode: true, ws: false },
    });
    try {
      await server.transformRequest('/src/main.ts');
      const css = await server.transformRequest('/__pre-style.css');
      const encoded =
        /sourceMappingURL=data:application\/json;(?:charset=utf-8;)?base64,([A-Za-z0-9+/=]+)/.exec(
          css!.code,
        )![1];
      const map = JSON.parse(Buffer.from(encoded, 'base64').toString());
      assert.deepEqual(map.sources, [`${fixture('basic')}/src/main.ts`]);
      assert.match(map.sourcesContent[0], /const base = css`/);
    } finally {
      await server.close();
    }
  });
});
