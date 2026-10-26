# pre.style

[![npm version](https://badge.fury.io/js/pre.style.svg)](https://www.npmjs.com/package/pre.style)

Zero-runtime CSS-in-JS. Write plain CSS or SCSS next to your markup, and pre.style compiles it at build time into atomic CSS classes: one small class per declaration, shared across your whole project.

```js
import { css } from '@pre.style/core';

const button = css`
  background-color: #0071ba;
  color: white;
  padding-block: 0.5em;

  &:hover {
    background-color: #005a94;
  }

  @media (min-width: 768px) {
    padding-block: 1em;
  }
`;
```

After the build, `button` is a plain string, `"B C E D A G F"`. The block is replaced, and these classes are added to a single CSS file:

```css
.B{background-color:#0071ba}
.C{color:#fff}
.E{padding-block-start:.5em}
.D{padding-block-end:.5em}
.A:hover{background-color:#005a94}
@media (width>=768px) {
  .G{padding-block-start:1em}
  .F{padding-block-end:1em}
}
```

- **No runtime.** Blocks are replaced with class strings during the build. Nothing is shipped to parse or inject CSS.
- **Small CSS.** Each declaration is written once, however many components use it, so the CSS file grows slowly as your project grows.
- **Just CSS.** Blocks are standard CSS (with nesting) or SCSS. There's no new syntax to learn.
- **Fast.** Built on [Lightning CSS](https://lightningcss.dev/). Every block is parsed once, in one process.

## Getting started

pre.style works with [Vite](https://vite.dev/). It needs Node 24 or later and Vite 8.

```sh
npm install @pre.style/core
npm install --save-dev @pre.style/vite lightningcss
```

To write SCSS blocks, also install Sass:

```sh
npm install --save-dev sass
```

Add the plugin to `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import preStyle from '@pre.style/vite';

export default defineConfig({
  plugins: [preStyle()],
});
```

Then import `css` (or `scss`) from `@pre.style/core` and use the class strings:

```jsx
import { css } from '@pre.style/core';

export function Card({ children }) {
  return (
    <div
      className={css`
        border-radius: 8px;
        padding: 1rem;
      `}
    >
      {children}
    </div>
  );
}
```

In a build, the plugin writes `pre.style.css` to your output directory and links it from `index.html`. In dev, the CSS is served by Vite and updates as you edit.

### Frameworks without `index.html`

Frameworks that render on the server, such as React Router's framework mode, don't use `index.html`. Import pre.style's CSS in your root module instead:

```ts
import 'virtual:pre.style.css';
```

Vite then bundles the CSS with your app's other CSS, and the framework links it when rendering on the server, both in builds and in dev. The plugin doesn't write `output.file` when the CSS is imported this way.

### Astro

Add the plugin to Astro's Vite config, and import the CSS in your layout's frontmatter:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import preStyle from '@pre.style/vite';

export default defineConfig({
  vite: { plugins: [preStyle()] },
});
```

```astro
---
import { css } from '@pre.style/core';
import 'virtual:pre.style.css';

const title = css`
  font-size: 2rem;
`;
---

<h1 class={title}>Hello</h1>
```

Blocks work in frontmatter, in template expressions such as `` class={css`…`} ``, in `<script>` tags, and in the islands of any framework. Astro links the CSS on every page that uses the layout, prerendered or rendered on demand. Astro compiles components before the plugin sees them, but errors and source maps still point to the component.

## Writing blocks

A block styles one element. Each block is treated as its own small stylesheet, where declarations at the top level apply to the element.

### `css` and `scss`

`css` blocks are plain CSS. `scss` blocks are compiled with Sass first, so you can use variables, mixins, functions, and everything else Sass supports:

```js
import { scss } from '@pre.style/core';

const title = scss`
  $size: 2rem;
  font-size: $size;
  margin-bottom: $size / 2;
`;
```

Blocks can't contain `${…}` interpolation. pre.style needs to know every block's CSS at build time. Share values with [prepended files](#sharing-values-with-prepended-files) instead.

### Selectors

Use `&` for the element, as in native CSS nesting. Anything that isn't the bare element (pseudo-classes, pseudo-elements, and complex selectors) becomes a selector variant:

```js
css`
  color: gray;

  &:hover { color: black; }
  &::before { content: '→'; }
  & > * + * { margin-top: 1rem; }
  .dark & { color: white; }
  a { text-decoration: underline; } /* the same as `& a` */
`;
```

### At-rules

Declarations inside `@media`, `@supports`, `@container`, `@layer`, `@scope`, and `@starting-style` become atomic classes too, grouped under one copy of each at-rule in the output. They can be nested inside each other and inside selectors.

Other at-rules, such as `@keyframes`, `@font-face`, and `@property`, are copied to the output as they are. When several blocks define the same one, it's written once. For at-rules that replace each other, such as two `@keyframes` with the same name, only the last definition is kept.

```js
css`
  @keyframes fade-in {
    from { opacity: 0; }
  }

  animation: fade-in 200ms ease-out;
`;
```

### In HTML

HTML can't import anything, so blocks in HTML files that Vite processes, such as `index.html`, are found by matching `` css` `` and `` scss` ``:

```html
<main class="css`padding: 1rem; max-width: 60rem;`">…</main>
```

## Combining class strings with `cn`

Atomic classes all have the same specificity, so when two classes on one element set the same property, the order of the CSS file decides which wins, not the order in your `class` attribute. Use `cn` to combine class strings: when two classes conflict, it keeps the later one.

```js
import { css, cn } from '@pre.style/core';

const button = css`
  background-color: #0071ba;
  color: white;
`;
const danger = css`
  background-color: #c62828;
`;

const className = cn(button, isDanger && danger);
```

`cn` takes the same arguments as [clsx](https://github.com/lukeed/clsx): strings, arrays, objects whose keys are included when their value is truthy, and falsy values, which are ignored.

Two classes conflict when they set the same property under the same at-rules and selector. A later shorthand also removes earlier longhands it covers.

When every argument is a block or a string literal, the plugin resolves the call during the build, so it costs nothing at runtime. Other calls use a small lookup table the plugin generates for your project.

> **Note:** `cn` removes `!important` declarations too. A later class that sets the same property wins, even when the earlier one is `!important`.

## Sharing values with prepended files

Use `prependFiles` to add files to the start of every block, for custom properties, SCSS variables, mixins, and so on. Each file is read once per build.

```ts
preStyle({
  prependFiles: {
    css: ['src/styles/tokens.css'],
    scss: ['src/styles/_variables.scss', 'src/styles/_mixins.scss'],
  },
});
```

An array applies the files to every block. An object applies `css` files only to `css` blocks, and `scss` files only to `scss` blocks.

Rules the files output, such as `:root { --space: 4px }`, appear in the CSS file once. Keep prepended files to things that don't output CSS, or output it once (variables, mixins, custom properties). Large libraries slow the build down.

## Component libraries

A component library styled with pre.style ships its blocks uncompiled, and each app's pre.style plugin compiles them along with the app's own. The library's classes share names and the CSS file with the app's, so a `color: red` in the library and one in the app are the same class, and `cn` resolves conflicts between them.

### Using a library

Install it. The plugin finds dependencies with a `pre.style` field in their `package.json` (and the libraries those depend on) and compiles them. There's nothing to configure.

To compile a package that doesn't have the field, or to change how one is compiled, use the `libraries` option. `false` leaves a package out.

```ts
preStyle({
  libraries: {
    'legacy-ui': { include: 'dist/**/*.js' },
    'some-ui': false,
  },
});
```

A library's class names depend on the whole app, so they differ between apps. Don't depend on them.

### Writing a library

- Ship ESM JavaScript (or TypeScript) with the blocks left as they are. Don't run pre.style on the library itself.
- List `@pre.style/core` as a peer dependency, so the library and the app share one copy.
- Add a `pre.style` field to `package.json`:

```json
{
  "name": "@acme/ui",
  "peerDependencies": {
    "@pre.style/core": "^3.0.0"
  },
  "pre.style": {
    "include": "dist/**/*.js",
    "prependFiles": {
      "css": ["dist/styles/tokens.css"],
      "scss": ["dist/styles/_tokens.scss"]
    }
  }
}
```

| Field          | Default                      | Description |
| -------------- | ---------------------------- | ----------- |
| `include`      | Every JS, TS, and Astro file | Globs of the files with blocks, relative to the package. |
| `prependFiles` |                              | Files added to the start of the library's blocks, relative to the package. They apply only to the library's blocks, not the app's, so the library's tokens and mixins are always available to it and never leak into the app. |

`"pre.style": true` uses the defaults.

To let apps use the library's tokens in their own blocks, export the token files, and apps can add them to their own `prependFiles`.

The plugin excludes libraries from Vite's dependency pre-bundling and from SSR externalization, so their blocks reach it in dev and on the server.

## How the CSS is written

### Class names

Each class is one declaration, under the at-rules and selector variant it was written in. Every class gets a name from one list, and the most-used classes get the shortest ones: one character for the first 53, then two characters for the next few thousand. Names don't say what a class is under; `cn` gets that from its lookup table.

Declarations that mean the same thing share a class: `color: blue` and `color: #00f` are the same class. So do equivalent nestings, such as `@media (…) { &:hover { … } }` and `&:hover { @media (…) { … } }`.

Production builds scan your files first, so names are stable between builds. In dev, names are assigned as files are served. **Dev class names can change between dev sessions and differ from production names, so don't depend on them.**

### Shorthands

Shorthand properties are expanded into their longhands, so `cn` can resolve conflicts between them:

```js
css`margin: auto;`;
```

```css
.D{margin-top:auto}
.C{margin-right:auto}
.A{margin-bottom:auto}
.B{margin-left:auto}
```

`border` (which sets 12 longhands), shorthands whose values aren't known until runtime (values with `var()`, `env()`, or `attr()`), and shorthands set to a CSS-wide keyword (`font: inherit`, `margin: initial`) are kept as one class. They're written before longhands, so a longhand still wins:

```js
css`padding: var(--space); padding-top: 0;`;
```

Expanding means some shorthands produce many classes. For example, `font` also resets the `font-variant-*` properties, among others, so it becomes about 20 classes. The CSS file barely grows, because the classes are shared across your project, but class strings get longer.

### Order

Within one block, a later declaration overrides an earlier one, as in plain CSS. Across blocks, the CSS file is ordered so the usual rules hold:

1. Hoisted at-rules (`@layer` statements, `@import`, `@namespace`), then other copied at-rules.
2. Classes on the element.
3. Selector variants, with pseudo-classes in LVHFA order (`:link`, `:visited`, `:hover`, `:focus`, `:active`).
4. At-rule groups. `@media` queries with only a `min-width` come last, smallest first (mobile-first).

## Compared to utility-first frameworks

Utility-first frameworks such as [Tailwind CSS](https://tailwindcss.com/) also produce atomic CSS, so the same styles cost about the same in either. The differences are elsewhere:

- **CSS file.** Each declaration is written once in both, so the classes themselves come to about the same size. pre.style adds no reset or base styles, and no supporting rules beyond what your blocks contain. A framework's reset can be larger than all of a small app's classes.
- **Markup.** pre.style's class names are generated and one to three characters long, so class strings are much shorter than utility names like `px-5 py-4 rounded-xl`. Class strings end up in your JS and in every server-rendered page, so this saving grows with your markup. Some shorthands do produce many classes (see [Shorthands](#shorthands)).
- **Combining classes.** `cn` is resolved during the build when its arguments are known, and otherwise uses a small table generated for your project. Utility frameworks need a separate library that knows every utility to do the same.
- **In the browser.** No difference. Both are static CSS with single-class selectors and nothing running at runtime, so apart from download size the browser does the same work.
- **Build speed.** A utility framework only scans your files for class names. pre.style parses every block with Lightning CSS, and runs Sass for `scss` blocks. That takes more time during the build, but your users never see it.

## Configuration

All options are optional.

```ts
preStyle({
  include: ['src/**/*.{ts,tsx}', 'index.html'],
  prependFiles: ['src/styles/tokens.css'],
  lightningcss: { minify: true, targets: { safari: 16 << 16 } },
  sourceMap: true,
  quotes: 'single-quote',
  output: {
    file: 'css/pre.style.css',
    banner: '/* Generated by pre.style */',
  },
});
```

| Option         | Default                                           | Description |
| -------------- | ------------------------------------------------- | ----------- |
| `include`      | `**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts,html,astro}` | Globs of the files with blocks, relative to Vite's root. Scanned before a build to assign names. `node_modules` and the output directory are always skipped. |
| `exclude`      |                                                   | Globs removed from `include`. |
| `prependFiles` |                                                   | Files added to the start of the app's blocks. See [Sharing values with prepended files](#sharing-values-with-prepended-files). |
| `libraries`    |                                                   | Component libraries to compile, by package name, in addition to dependencies with a `pre.style` field. A config replaces the package's field, and `false` leaves the package out. See [Component libraries](#component-libraries). |
| `lightningcss` |                                                   | [Lightning CSS options](https://lightningcss.dev/transforms.html), such as `minify`, `targets`, `drafts`, and `visitor`. A `visitor` runs before pre.style processes each block. `filename`, `code`, `sourceMap`, `projectRoot`, `inputSourceMap`, and `cssModules` are ignored. |
| `sourceMap`    | `false`                                           | Generate a source map for the CSS, mapping each class to the first block it appears in. In dev, it's shown in the browser (the plugin turns on Vite's `css.devSourcemap`). In builds, it's written next to `output.file`. When you import `virtual:pre.style.css`, builds have no CSS source map, because Vite doesn't write them for bundled CSS. |
| `quirksMode`   | `false`                                           | **You probably don't want this.** Use lowercase class names only, for pages in quirks mode. Names get longer. See [Quirks mode](#quirks-mode). |
| `quotes`       | `'double-quote'`                                  | Quotes around the class string that replaces each block in JS: `'single-quote'`, `'double-quote'`, or `'backtick'`. |
| `output.file`  | `'pre.style.css'`                                  | Path and name of the CSS file, relative to Vite's `build.outDir`. |
| `output.banner`|                                                   | Text added to the start of the CSS file. |
| `output.footer`|                                                   | Text added to the end of the CSS file. |

The CSS isn't minified unless you set `lightningcss: { minify: true }`.

### Quirks mode

> [!WARNING]
> **You probably don't want `quirksMode`.** It makes every project's output larger, and it only helps pages that can't have a doctype. If your pages start with `<!doctype html>`, as almost every modern page does, leave it off.

Pages without a doctype render in quirks mode, where class selectors ignore case. pre.style uses both uppercase and lowercase letters in class names, so `.A` and `.a` would apply to each other's elements. Add `<!doctype html>` to fix this. The plugin warns during the build when an HTML file it processes has no doctype.

If you can't add one, for example because your CSS is loaded into a page you don't control, set `quirksMode: true`. Class names then use only lowercase letters, digits, `-`, and `_`. That leaves 27 one-character names instead of 53, and about 1,050 two-character names instead of 3,445, so names get longer once a project has more than about 27 classes.

## TypeScript

`css`, `scss`, and `cn` are typed. `css` and `scss` return `string`.

`css` and `scss` must be used as tagged templates (`` css`…` ``), and every block must be compiled by the plugin. If code that uses them runs without the plugin, for example in tests run directly in Node, they throw an error saying the transform wasn't applied, instead of silently rendering unstyled.

## Errors

The build fails, with the file, line, and column, when:

- a block has invalid CSS syntax;
- Sass fails to compile an `scss` block;
- a block contains `${…}` interpolation;
- `css` or `scss` is used other than as a tagged template;
- a project has an `scss` block but Sass isn't installed.

## Known limitations

- `@charset` is dropped. Lightning CSS always writes UTF-8.
- At-rules Lightning CSS doesn't parse, such as `@when`, `@function`, and `@custom-selector`, are copied to the output as they are.
- Nested pseudo-elements, such as `::before::marker`, aren't supported yet.
- Blocks in PHP and other templates aren't supported, because Vite doesn't output them.
- Component libraries are found among the app's dependencies and the dependencies of other libraries. A library used only through a package that isn't one (a wrapper without a `pre.style` field) isn't found automatically; add it with the `libraries` option.
- Before a build, Astro components are scanned like HTML, by matching `` css` `` and `` scss` ``. In a component that imports from `@pre.style/core`, text that only looks like a block, such as a code sample, is compiled too, and fails the build if it isn't valid CSS.
- Positions in `scss` blocks point to the start of the block, since Sass's output doesn't match the original lines.
- Pages need a doctype (`<!doctype html>`). Without one, browsers use quirks mode, where class selectors ignore case, so classes like `.A` and `.a` would apply to each other's elements. See [Quirks mode](#quirks-mode).

## Packages

| Package                 | Description                                            |
| ----------------------- | ------------------------------------------------------ |
| `@pre.style/core`             | `css`, `scss`, and `cn`, plus the compiler at `@pre.style/core/compiler` for bundler plugins. |
| `@pre.style/vite` | The Vite plugin.                                       |

## Development

The repo is an npm workspace with both packages under `packages/`.

### Priorities

pre.style aims to be very fast, with the smallest and most performant output possible. When weighing a change, the priorities are, in order:

1. **Output:** the size of what ships (the CSS file, class strings, and the `cn` lookup table) and how quickly the browser renders it.
2. **Build time:** how long the compiler and plugin take, in production builds and in dev.

A change that makes the output smaller or faster to render is worth a slower build. A faster build isn't worth a larger or slower output.

```sh
npm install
npm test           # node --test, on the TypeScript source
npm run typecheck
npm run lint       # Oxlint
npm run format     # Oxfmt
npm run build
```

`demo/` has three apps for trying pre.style on the client and server: a React Router app in framework mode (`react/react-router`), a TanStack Start app (`react/tanstack-start`), and an Astro app with React islands (`astro`). They have the same pages, and share a small React component library (`react/ui`), which ships its source with the blocks still in it and its design tokens, for each app's pre.style plugin to compile. The demos use the packages' TypeScript source, so changes to them show up without a build.

```sh
npm run demo:react-router          # dev server
npm run demo:react-router:build    # production build
npm run demo:react-router:start    # serve the production build

npm run demo:tanstack-start        # likewise for TanStack Start
npm run demo:tanstack-start:build
npm run demo:tanstack-start:start

npm run demo:astro                 # likewise for Astro
npm run demo:astro:build
npm run demo:astro:start
```

## License

MIT
