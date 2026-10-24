import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compile, css } from './helpers.ts';

// One test for each at-rule in css-at-rules.md, showing how a block that
// uses it is processed. Examples are adapted from the reference so each
// at-rule is used inside a block.

// Statement, hoist 0. Lightning CSS always writes UTF-8 and drops `@charset`.
test(`@charset`, async () => {
  const { classes, css: output } = await compile([`@charset "UTF-8"; color: red`]);
  assert.deepEqual(classes, ['A']);
  assert.equal(
    output,
    css`
      .A{color:red}
    `,
  );
});

// Statement, hoist 2. Kept as-is and moved to the top, after `@layer` statements.
test(`@import`, async () => {
  const { classes, css: output } = await compile([
    `@import url("theme.css"); @import url("print.css") print; @import url("grid.css") layer(layout) supports(display: grid) screen and (min-width: 600px); color: red`,
  ]);
  assert.deepEqual(classes, ['A']);
  assert.equal(
    output,
    css`
      @import "theme.css";
      @import "print.css" print;
      @import "grid.css" layer(layout) supports(display:grid) screen and (width>=600px);
      .A{color:red}
    `,
  );
});

// Statement, hoist 3, overridable. Kept as-is; namespaced selectors work in selector variants.
test(`@namespace`, async () => {
  const { classes, css: output } = await compile([
    `@namespace svg url("http://www.w3.org/2000/svg"); & svg|a { fill: currentColor }`,
  ]);
  assert.deepEqual(classes, ['A-A']);
  assert.equal(
    output,
    css`
      @namespace svg "http://www.w3.org/2000/svg";
      .A-A svg|a{fill:currentColor}
    `,
  );
});

// Atomic. Declarations inside become `A_X` classes, grouped under one `@media`.
test(`@media`, async () => {
  const { classes, css: output } = await compile([
    `@media (min-width: 768px) and (prefers-color-scheme: dark) { background-color: #111; color: #eee }`,
  ]);
  assert.deepEqual(classes, ['A_A A_B']);
  assert.equal(
    output,
    css`
      @media (width>=768px) and (prefers-color-scheme:dark) {
        .A_A{background-color:#111}
        .A_B{color:#eee}
      }
    `,
  );
});

// Atomic.
test(`@supports`, async () => {
  const { classes, css: output } = await compile([
    `@supports (display: grid) and selector(:has(a)) { display: grid }`,
  ]);
  assert.deepEqual(classes, ['A_A']);
  assert.equal(
    output,
    css`
      @supports (display:grid) and selector(:has(a)) {
        .A_A{display:grid}
      }
    `,
  );
});

// Atomic. The `container` shorthand is expanded.
test(`@container`, async () => {
  const { classes, css: output } = await compile([
    `container: card / inline-size`,
    `@container card (min-width: 400px) { display: flex }`,
  ]);
  assert.deepEqual(classes, ['A B', 'A_C']);
  assert.equal(
    output,
    css`
      .A{container-name:card}
      .B{container-type:inline-size}
      @container card (width>=400px) {
        .A_C{display:flex}
      }
    `,
  );
});

// Statement, overridable. Kept as-is; `@media` rules that use it stay atomic.
test(`@custom-media`, async () => {
  const { classes, css: output } = await compile([
    `@custom-media --narrow-window (max-width: 30em); @media (--narrow-window) { flex-direction: column }`,
  ]);
  assert.deepEqual(classes, ['A_A']);
  assert.equal(
    output,
    css`
      @custom-media --narrow-window (max-width: 30em);
      @media (--narrow-window) {
        .A_A{flex-direction:column}
      }
    `,
  );
});

// Draft, not parsed by Lightning CSS. Kept as-is.
test(`@when`, async () => {
  const { classes, css: output } = await compile([
    `@when media(width >= 400px) and supports(display: flex) { .box { display: flex } } @else { .box { display: block } } color: red`,
  ]);
  assert.deepEqual(classes, ['A']);
  assert.equal(
    output,
    css`
      @when media(width >= 400px) and supports(display: flex){.box { display: flex }}
      @else{.box { display: block }}
      .A{color:red}
    `,
  );
});

// Statement, hoist 1. Kept as-is and moved to the top.
test(`@layer statement`, async () => {
  const { classes, css: output } = await compile([
    `@layer reset, base, components, utilities; color: red`,
  ]);
  assert.deepEqual(classes, ['A']);
  assert.equal(
    output,
    css`
      @layer reset,base,components,utilities;
      .A{color:red}
    `,
  );
});

// Atomic.
test(`@layer block`, async () => {
  const { classes, css: output } = await compile([`@layer components { padding: 0.5em 1em }`]);
  assert.deepEqual(classes, ['A_D A_C A_A A_B']);
  assert.equal(
    output,
    css`
      @layer components {
        .A_D{padding-top:.5em}
        .A_C{padding-right:1em}
        .A_A{padding-bottom:.5em}
        .A_B{padding-left:1em}
      }
    `,
  );
});

// Atomic. Rules inside are selector variants.
test(`@scope`, async () => {
  const { classes, css: output } = await compile([
    `@scope (.card) to (.card-content) { img { border-radius: 8px } }`,
  ]);
  assert.deepEqual(classes, ['A_A-C A_A-D A_A-B A_A-A']);
  assert.equal(
    output,
    css`
      @scope(.card) to (.card-content) {
        .A_A-C img{border-top-left-radius:8px}
        .A_A-D img{border-top-right-radius:8px}
        .A_A-B img{border-bottom-right-radius:8px}
        .A_A-A img{border-bottom-left-radius:8px}
      }
    `,
  );
});

// Non-atomic, overridable. Kept as-is.
test(`@font-face`, async () => {
  const { classes, css: output } = await compile([
    `@font-face { font-family: "Inter"; src: url("inter.woff2") format("woff2"); font-weight: 100 900; font-display: swap; } font-family: Inter`,
  ]);
  assert.deepEqual(classes, ['A']);
  assert.equal(
    output,
    css`
      @font-face{font-family:Inter;src:url(inter.woff2)format("woff2");font-weight:100 900;font-display:swap}
      .A{font-family:Inter}
    `,
  );
});

// Non-atomic. Kept as-is.
test(`@font-feature-values`, async () => {
  const { classes, css: output } = await compile([
    `@font-feature-values "Font One" { @styleset { nice-style: 12; } } font-variant-alternates: styleset(nice-style)`,
  ]);
  assert.deepEqual(classes, ['A']);
  assert.equal(
    output,
    css`
      @font-feature-values Font One{@styleset{nice-style:12}}
      .A{font-variant-alternates:styleset(nice-style)}
    `,
  );
});

// Non-atomic, overridable. Kept as-is.
test(`@font-palette-values`, async () => {
  const { classes, css: output } = await compile([
    `@font-palette-values --brand { font-family: "Bungee Spice"; base-palette: 0; override-colors: 0 #c00, 1 #f80; } font-palette: --brand`,
  ]);
  assert.deepEqual(classes, ['A']);
  assert.equal(
    output,
    css`
      @font-palette-values --brand{font-family:Bungee Spice;base-palette:0;override-colors:0 #c00,1 #f80}
      .A{font-palette:--brand}
    `,
  );
});

// Non-atomic, overridable. Kept as-is.
test(`@keyframes`, async () => {
  const { classes, css: output } = await compile([
    `@keyframes fade-in { from { opacity: 0 } to { opacity: 1 } } animation-name: fade-in`,
  ]);
  assert.deepEqual(classes, ['A']);
  assert.equal(
    output,
    css`
      @keyframes fade-in {
        0%{opacity:0}
        to{opacity:1}
      }
      .A{animation-name:fade-in}
    `,
  );
});

// Atomic.
test(`@starting-style`, async () => {
  const { classes, css: output } = await compile([`opacity: 1; @starting-style { opacity: 0 }`]);
  assert.deepEqual(classes, ['B A_A']);
  assert.equal(
    output,
    css`
      .B{opacity:1}
      @starting-style {
        .A_A{opacity:0}
      }
    `,
  );
});

// Non-atomic, overridable. Kept as-is.
test(`@view-transition`, async () => {
  const { classes, css: output } = await compile([
    `@view-transition { navigation: auto; } color: red`,
  ]);
  assert.deepEqual(classes, ['A']);
  assert.equal(
    output,
    css`
      @view-transition{navigation:auto}
      .A{color:red}
    `,
  );
});

// Non-atomic, overridable. Kept as-is.
test(`@property`, async () => {
  const { classes, css: output } = await compile([
    `@property --angle { syntax: "<angle>"; inherits: false; initial-value: 0deg; } transform: rotate(var(--angle))`,
  ]);
  assert.deepEqual(classes, ['A']);
  assert.equal(
    output,
    css`
      @property --angle{syntax:"<angle>";inherits:false;initial-value:0deg}
      .A{transform:rotate(var(--angle))}
    `,
  );
});

// Experimental, not parsed by Lightning CSS. Kept as-is.
test(`@function`, async () => {
  const { classes, css: output } = await compile([
    `@function --negate(--value) { result: calc(-1 * var(--value)); } margin-top: --negate(1rem)`,
  ]);
  assert.deepEqual(classes, ['A']);
  assert.equal(
    output,
    css`
      @function --negate(--value){result: calc(-1 * var(--value));}
      .A{margin-top:--negate(1rem)}
    `,
  );
});

// Draft, not parsed by Lightning CSS. Kept as-is.
test(`@mixin`, async () => {
  const { classes, css: output } = await compile([
    `@mixin --center { display: grid; place-items: center; } color: red`,
  ]);
  assert.deepEqual(classes, ['A']);
  assert.equal(
    output,
    css`
      @mixin --center{display: grid; place-items: center;}
      .A{color:red}
    `,
  );
});

// Draft, not parsed by Lightning CSS. Kept as-is.
test(`@apply`, async () => {
  const { classes, css: output } = await compile([`@apply --center; color: red`]);
  assert.deepEqual(classes, ['A']);
  assert.equal(
    output,
    css`
      @apply --center;
      .A{color:red}
    `,
  );
});

// Draft, not parsed by Lightning CSS. Kept as-is.
test(`@custom-selector`, async () => {
  const { classes, css: output } = await compile([
    `@custom-selector :--heading h1, h2, h3; color: red`,
  ]);
  assert.deepEqual(classes, ['A']);
  assert.equal(
    output,
    css`
      @custom-selector :--heading h1, h2, h3;
      .A{color:red}
    `,
  );
});

// Non-atomic. Kept as-is.
test(`@page`, async () => {
  const { classes, css: output } = await compile([
    `@page { size: A4; margin: 2cm; } @page :first { margin-top: 4cm; } color: red`,
  ]);
  assert.deepEqual(classes, ['A']);
  assert.equal(
    output,
    css`
      @page{size:A4;margin:2cm}
      @page:first{margin-top:4cm}
      .A{color:red}
    `,
  );
});

// Non-atomic, overridable. Kept as-is.
test(`@position-try`, async () => {
  const { classes, css: output } = await compile([
    `@position-try --below { position-area: bottom; margin-top: 8px; } position-try-fallbacks: --below`,
  ]);
  assert.deepEqual(classes, ['A']);
  assert.equal(
    output,
    css`
      @position-try --below{position-area:bottom;margin-top:8px}
      .A{position-try-fallbacks:--below}
    `,
  );
});

// Non-atomic, overridable. Kept as-is.
test(`@counter-style`, async () => {
  const { classes, css: output } = await compile([
    `@counter-style thumbs { system: cyclic; symbols: "👍"; suffix: " "; } list-style-type: thumbs`,
  ]);
  assert.deepEqual(classes, ['A']);
  assert.equal(
    output,
    css`
      @counter-style thumbs{system:cyclic;symbols:"👍";suffix:" "}
      .A{list-style-type:thumbs}
    `,
  );
});

// Experimental, not parsed by Lightning CSS. Kept as-is.
test(`@color-profile`, async () => {
  const { classes, css: output } = await compile([
    `@color-profile --swop5c { src: url("SWOP2006_Coated5v2.icc"); } color: red`,
  ]);
  assert.deepEqual(classes, ['A']);
  assert.equal(
    output,
    css`
      @color-profile --swop5c{src: url(SWOP2006_Coated5v2.icc);}
      .A{color:red}
    `,
  );
});

// Deprecated, atomic. Only the prefixed `@-moz-document` is parsed.
test(`@document`, async () => {
  const { classes, css: output } = await compile([`@-moz-document url-prefix() { color: green }`]);
  assert.deepEqual(classes, ['A_A']);
  assert.equal(
    output,
    css`
      @-moz-document url-prefix() {
        .A_A{color:green}
      }
    `,
  );
});

// Obsolete, non-atomic. Kept as-is.
test(`@viewport`, async () => {
  const { classes, css: output } = await compile([`@viewport { width: device-width; } color: red`]);
  assert.deepEqual(classes, ['A']);
  assert.equal(
    output,
    css`
      @viewport{width:device-width}
      .A{color:red}
    `,
  );
});

// Dropped proposal, not parsed by Lightning CSS. Kept as-is.
test(`@nest`, async () => {
  const { classes, css: output } = await compile([`@nest .title & { font-weight: bold }`]);
  assert.deepEqual(classes, ['']);
  assert.equal(
    output,
    css`
      @nest .title &{font-weight: bold}
    `,
  );
});
