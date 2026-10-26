import { readFile, glob } from 'node:fs/promises';
import { matchesGlob, relative, resolve, sep } from 'node:path';
import { MagicString } from 'magic-string';
import { createCn } from 'pre-style';
import type { CnTable } from 'pre-style';
import { createCompiler, PreStyleError } from 'pre-style/compiler';
import type { Block, Compiler, LightningOptions, PrependFiles } from 'pre-style/compiler';
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import { FindError, findInHtml, findInScript } from './find.ts';
import type { FoundBlock, FoundImport, ScriptAnalysis } from './find.ts';
import { findLibraries } from './libraries.ts';
import type { LibraryConfig, ResolvedLibrary } from './libraries.ts';

export type { LibraryConfig };

export interface PreStyleOptions {
  // Globs of every source file that contains blocks, relative to Vite's
  // root. Scanned before the build to assign stable names.
  include?: string | string[];
  // Globs removed from `include`.
  exclude?: string | string[];
  // Files prepended to the app's blocks: an array for every block, or
  // separate arrays for `css` and `scss` blocks. Relative to Vite's root.
  prependFiles?: PrependFiles;
  // Component libraries to compile, by package name, in addition to the
  // dependencies with a `pre-style` field in their package.json. A config
  // replaces the package's field, and `false` leaves the package out.
  libraries?: Record<string, LibraryConfig | boolean>;
  // Options passed through to Lightning CSS.
  lightningcss?: LightningOptions;
  // Generate a source map for the output CSS.
  sourceMap?: boolean;
  // Quote character around the class string that replaces each block.
  quotes?: 'single-quote' | 'double-quote' | 'backtick';
  output?: {
    // Path and name of the output CSS file, relative to `build.outDir`.
    file?: string;
    // Prepended to the output CSS.
    banner?: string;
    // Appended to the output CSS.
    footer?: string;
  };
}

const SCRIPT = /\.(?:[cm]?[jt]sx?)$/;
const HTML = /\.html$/;
const DEFAULT_INCLUDE = ['**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts,html}'];
const NODE_MODULES = '**/node_modules/**';
const QUOTES = { 'single-quote': "'", 'double-quote': '"', backtick: '`' };

const CN_ID = 'virtual:pre-style/cn';
const RESOLVED_CN_ID = '\0virtual:pre-style/cn';
// The dev CSS module. Its resolved ID has no `\0`, so Vite's CSS plugin
// handles it (including HMR).
const CSS_ID = 'virtual:pre-style.css';
const RESOLVED_CSS_ID = '/__pre-style.css';

const toArray = (value: string | string[] | undefined) =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];
const cleanId = (id: string) => id.replace(/[?#].*$/, '');

const block = (found: FoundBlock, file: string): Block => ({
  code: found.code,
  lang: found.lang,
  file,
  line: found.line,
  column: found.column,
});

// Vite and Rollup errors take a location, so Pre-Style's own file:line:col
// prefix is left to them.
const fail = (
  context: {
    error(e: {
      message: string;
      id?: string;
      loc?: { file?: string; line: number; column: number };
    }): never;
  },
  error: unknown,
  id: string,
): never => {
  if (error instanceof FindError)
    context.error({
      message: error.message,
      id,
      loc: { file: id, line: error.line, column: error.column - 1 },
    });
  if (error instanceof PreStyleError) context.error({ message: error.message, id });
  throw error;
};

export default function preStyle(options: PreStyleOptions = {}): Plugin {
  const quote = QUOTES[options.quotes ?? 'double-quote'];
  const outputFile = options.output?.file ?? 'prestyle.css';
  const banner = options.output?.banner ?? '';
  const footer = options.output?.footer ?? '';

  let config: ResolvedConfig;
  let libraries: ResolvedLibrary[] = [];
  const inLibrary = (file: string) => libraries.some(({ dir }) => file.startsWith(dir + sep));
  let server: ViteDevServer | undefined;
  let compiler: Compiler;
  let table: { revision: number; table: CnTable; cn: ReturnType<typeof createCn> } | undefined;
  // In dev, the client and SSR environments share one compiler, so the
  // server renders the same class strings the browser hydrates.
  let devCompiler: Promise<Compiler> | undefined;
  // Whether the client build imported the CSS module, in which case Vite
  // bundles the CSS and the plugin doesn't write `output.file`.
  let cssImported = false;

  // The project's table, and a `cn` bound to it for build-time calls.
  const current = () => {
    if (table === undefined || table.revision !== compiler.revision) {
      const compiled = compiler.cnTable();
      table = { revision: compiler.revision, table: compiled, cn: createCn(compiled) };
    }
    return table;
  };

  // Reloads the dev CSS and `cn` modules after new classes are added.
  const update = (revision: number) => {
    if (server === undefined || compiler.revision === revision) return;
    for (const environment of Object.values(server.environments)) {
      for (const id of [RESOLVED_CSS_ID, RESOLVED_CN_ID]) {
        const module = environment.moduleGraph.getModuleById(id);
        if (module === undefined) continue;
        // Invalidated now, so the next request regenerates it. Only the
        // browser gets an HMR update: reloading on the server restarts its
        // whole module runner.
        environment.moduleGraph.invalidateModule(module);
        if (environment.config.consumer === 'client') void environment.reloadModule(module);
      }
    }
  };

  // The output CSS with the banner and footer, and its source map (when
  // `sourceMap` is on) as a parsed object.
  const outputCss = () => {
    const { code, map } = compiler.css();
    let json: { mappings: string; sources: string[] } | null = null;
    if (map !== null) {
      json = JSON.parse(map);
      // Lines added by the banner shift the mappings down.
      const bannerLines = banner ? banner.split('\n').length - (banner.endsWith('\n') ? 1 : 0) : 0;
      json!.mappings = ';'.repeat(bannerLines) + json!.mappings;
    }
    return {
      code: `${banner}${banner && !banner.endsWith('\n') ? '\n' : ''}${code}${footer}`,
      map: json,
    };
  };

  return {
    name: 'pre-style',
    enforce: 'pre',

    config(userConfig) {
      libraries = findLibraries(resolve(userConfig.root ?? process.cwd()), options.libraries);
      const names = libraries.map(({ name }) => name);
      return {
        // Vite only passes CSS source maps to the browser in dev with
        // `css.devSourcemap`, so `sourceMap` turns it on unless it's set.
        ...(options.sourceMap &&
          userConfig.css?.devSourcemap === undefined && { css: { devSourcemap: true } }),
        // Libraries are compiled from their source: not pre-bundled in dev,
        // and not left for Node to load on the server, so their blocks reach
        // this plugin.
        optimizeDeps: { exclude: names },
        ssr: { noExternal: names },
      };
    },

    configResolved(resolved) {
      config = resolved;
    },

    configureServer(devServer) {
      server = devServer;
    },

    async buildStart() {
      const create = () =>
        createCompiler({
          prependFiles: options.prependFiles,
          libraries: libraries.map(({ dir, prependFiles }) => ({ dir, prependFiles })),
          lightningcss: options.lightningcss,
          sourceMap: options.sourceMap,
          root: config.root,
          warn: (message) => config.logger.warn(`[pre-style] ${message}`),
        });
      // Dev names blocks on demand, as they're served.
      if (config.command !== 'build') {
        compiler = await (devCompiler ??= create());
        return;
      }
      // Each build environment scans the same files, so they assign the
      // same names.
      compiler = await create();
      table = undefined;
      cssImported = false;

      // The app's files, then each library's, as absolute paths.
      const files = new Set<string>();
      const add = async (cwd: string, include: string[], exclude: string[]) => {
        for await (const file of glob(include, {
          cwd,
          exclude: (path) => exclude.some((pattern) => matchesGlob(path, pattern)),
        })) {
          files.add(resolve(cwd, file));
        }
      };
      const outDir = `${relative(config.root, resolve(config.root, config.build.outDir))}/**`;
      await add(config.root, options.include ? toArray(options.include) : DEFAULT_INCLUDE, [
        ...toArray(options.exclude),
        NODE_MODULES,
        outDir,
      ]);
      for (const library of libraries) await add(library.dir, library.include, [NODE_MODULES]);

      // Sorted, so names don't depend on the order the file system lists files.
      for (const id of [...files].toSorted()) {
        const code = await readFile(id, 'utf8');
        if (!code.includes('css`')) continue;
        try {
          const found = HTML.test(id) ? findInHtml(code) : (findInScript(id, code)?.blocks ?? []);
          for (const b of found) compiler.scan(block(b, id));
        } catch (error) {
          fail(this, error, id);
        }
      }
      compiler.assignNames();
    },

    resolveId(id) {
      if (id === CN_ID) return RESOLVED_CN_ID;
      if (id === CSS_ID) return RESOLVED_CSS_ID;
    },

    load(id) {
      if (id === RESOLVED_CN_ID) {
        return `import { createCn } from 'pre-style';\nexport const cn = /* @__PURE__ */ createCn(${JSON.stringify(current().table)});\n`;
      }
      if (id === RESOLVED_CSS_ID) {
        if (config.command === 'build' && this.environment.config.consumer === 'client')
          cssImported = true;
        // Vite combines this map with its own, for the browser in dev and for
        // the bundled CSS in builds (with `build.sourcemap`).
        const { code, map } = outputCss();
        return { code, map };
      }
    },

    transform(code, id) {
      const file = cleanId(id);
      // Files in node_modules are only compiled when they're in a library.
      if (
        !SCRIPT.test(file) ||
        (file.includes('/node_modules/') && !inLibrary(file)) ||
        !code.includes('pre-style')
      )
        return;
      const revision = compiler.revision;

      let analysis: ScriptAnalysis | null;
      const s = new MagicString(code);
      try {
        analysis = findInScript(file, code);
        if (analysis === null) return;
        const classes = new Map<FoundBlock, string>();
        for (const found of analysis.blocks)
          classes.set(found, compiler.classString(block(found, file)));

        // `cn` calls with static arguments are resolved now. Blocks inside
        // them are replaced along with the call.
        const resolved = new Set<FoundBlock>();
        for (const call of analysis.cnCalls) {
          if (call.args === null) continue;
          const { cn } = current();
          const value = cn(
            ...call.args.map((arg) => (typeof arg === 'string' ? arg : classes.get(arg)!)),
          );
          for (const arg of call.args) if (typeof arg !== 'string') resolved.add(arg);
          s.overwrite(call.start, call.end, quoted(value, quote));
        }
        for (const [found, value] of classes)
          if (!resolved.has(found)) s.overwrite(found.start, found.end, quoted(value, quote));
        for (const statement of analysis.imports)
          s.overwrite(statement.start, statement.end, rewriteImport(statement));
      } catch (error) {
        return fail(this, error, file);
      }

      // In dev, the CSS is a module that each file with blocks imports, so
      // it loads after the file's classes are known.
      if (config.command !== 'build') {
        s.prepend(`import ${JSON.stringify(CSS_ID)};\n`);
        update(revision);
      }
      return {
        code: s.toString(),
        map: s.generateMap({ source: file, hires: 'boundary', includeContent: true }),
      };
    },

    transformIndexHtml: {
      order: 'pre',
      handler(html, context) {
        const id = context.filename;
        const revision = compiler.revision;
        const s = new MagicString(html);
        try {
          for (const found of findInHtml(html))
            s.overwrite(found.start, found.end, compiler.classString(block(found, id)));
        } catch (error) {
          if (error instanceof PreStyleError) throw new Error(error.message, { cause: error });
          throw error;
        }
        update(revision);
        const tag =
          config.command === 'build'
            ? {
                tag: 'link',
                attrs: { rel: 'stylesheet', href: `${config.base}${outputFile}` },
                injectTo: 'head' as const,
              }
            : {
                tag: 'script',
                attrs: { type: 'module' },
                children: `import ${JSON.stringify(CSS_ID)};`,
                injectTo: 'head' as const,
              };
        return { html: s.toString(), tags: [tag] };
      },
    },

    generateBundle() {
      if (this.environment.config.consumer !== 'client' || cssImported) return;
      const { code, map } = outputCss();
      if (map === null) {
        this.emitFile({ type: 'asset', fileName: outputFile, source: code });
        return;
      }
      const mapFile = `${outputFile}.map`;
      const name = mapFile.split('/').pop();
      this.emitFile({
        type: 'asset',
        fileName: outputFile,
        source: `${code}\n/*# sourceMappingURL=${name} */\n`,
      });
      map.sources = map.sources.map((source) =>
        relative(resolve(config.root, config.build.outDir, outputFile, '..'), source),
      );
      this.emitFile({ type: 'asset', fileName: mapFile, source: JSON.stringify(map) });
    },
  };
}

function quoted(value: string, quote: string): string {
  return `${quote}${value}${quote}`;
}

// Removes `css` and `scss` from `pre-style` imports (the blocks are gone),
// and imports `cn` from the virtual module bound to the project's table.
function rewriteImport(statement: FoundImport): string {
  const named: string[] = [];
  const cn: string[] = [];
  const others: string[] = [];
  for (const specifier of statement.specifiers) {
    if (specifier.kind !== 'named') others.push(`import ${specifier.text} from 'pre-style';`);
    else if (specifier.imported === 'cn') cn.push(specifier.text);
    else if (specifier.imported !== 'css' && specifier.imported !== 'scss')
      named.push(specifier.text);
  }
  const statements = [...others];
  if (named.length > 0) statements.push(`import { ${named.join(', ')} } from 'pre-style';`);
  if (cn.length > 0) statements.push(`import { ${cn.join(', ')} } from ${JSON.stringify(CN_ID)};`);
  return statements.join(' ');
}
