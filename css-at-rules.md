# CSS At-Rules Reference

A list of known CSS at-rules, with a short description and an example of each. Status notes mark rules that are experimental, draft-only, or deprecated.

## Contents

- [Statement At-Rules](#statement-at-rules)
- [Conditional Group Rules](#conditional-group-rules)
- [Cascade & Scoping](#cascade--scoping)
- [Fonts](#fonts)
- [Animation & Transitions](#animation--transitions)
- [Custom Properties, Functions & Mixins](#custom-properties-functions--mixins)
- [Paged Media](#paged-media)
- [Layout & Positioning](#layout--positioning)
- [Lists & Counters](#lists--counters)
- [Color](#color)
- [Deprecated / Obsolete](#deprecated--obsolete)

---

## Statement At-Rules

### `@charset`

Sets the character encoding of the stylesheet. It is hoisted first (hoist order 0): it must be the very first thing in the file, before any other rule, comment, or whitespace. It is ignored when used inside a `style` attribute or a `<style>` element.

##### Description

- Hoist - 0
- Atomic - false

```css
@charset "UTF-8";
```

### `@import`

Imports rules from another stylesheet. It is hoisted third (hoist order 2): it comes after `@charset` and `@layer` statements, and before `@namespace` and every other rule. It can take a cascade layer, a `supports()` condition, and a media query.

##### Description

- Hoist - 2
- Atomic - false

```css
@import url("theme.css");
@import url("print.css") print;
@import url("grid.css") layer(layout) supports(display: grid) screen and
  (min-width: 600px);
```

### `@namespace`

Declares an XML namespace for the stylesheet. Used mainly with SVG/MathML or XHTML documents. It is hoisted fourth (hoist order 3): it comes after `@charset`, `@layer` statements, and `@import`, and before every other rule.

##### Description

- Hoist - 3
- Atomic - false

```css
@namespace svg url("http://www.w3.org/2000/svg");

svg|a {
  fill: currentColor;
}
```

---

## Conditional Group Rules

### `@media`

Applies the styles inside it only when the media query matches (viewport size, media type, user preferences, and so on).

##### Description

- Hoist - false
- Atomic - true

```css
@media (min-width: 768px) and (prefers-color-scheme: dark) {
  body {
    background: #111;
    color: #eee;
  }
}
```

### `@supports`

Applies styles only when the browser supports the given CSS feature, selector, or font technology (a feature query).

##### Description

- Hoist - false
- Atomic - true

```css
@supports (display: grid) and selector(:has(a)) {
  .layout {
    display: grid;
  }
}
```

### `@container`

Applies styles based on the size, style, or scroll state of an ancestor container element (a container query).

##### Description

- Hoist - false
- Atomic - true

```css
.card-wrapper {
  container: card / inline-size;
}

@container card (min-width: 400px) {
  .card {
    display: flex;
  }
}
```

### `@custom-media` _(draft / limited support)_

Defines a named alias for a media query that you can reuse.

##### Description

- Hoist - false
- Atomic - false

```css
@custom-media --narrow-window (max-width: 30em);

@media (--narrow-window) {
  nav {
    flex-direction: column;
  }
}
```

### `@when` / `@else` _(draft, not implemented)_

A general conditional rule that combines media and supports queries and allows else-chains.

##### Description

- Hoist - false
- Atomic - true

```css
@when media(width >= 400px) and supports(display: flex) {
  .box {
    display: flex;
  }
} @else  {
  .box {
    display: block;
  }
}
```

---

## Cascade & Scoping

### `@layer`

Declares a cascade layer. Layers let you control precedence between groups of rules no matter how specific their selectors are. It can be written as a statement (to set layer order) or as a block. The statement form is hoisted second (hoist order 1): it comes after `@charset` and before `@import`, `@namespace`, and every other rule. The block form can appear anywhere and does not need to be hoisted.

##### Description

- Hoist - 1
- Atomic - true

```css
@layer reset, base, components, utilities;

@layer components {
  .button {
    padding: 0.5em 1em;
  }
}
```

### `@scope`

Limits styles to a DOM subtree, with an optional lower boundary ("donut scope").

##### Description

- Hoist - false
- Atomic - true

```css
@scope (.card) to (.card-content) {
  img {
    border-radius: 8px;
  }
}
```

---

## Fonts

### `@font-face`

Defines a custom font, its source files, and descriptors such as weight, style, and unicode-range.

##### Description

- Hoist - false
- Atomic - false

```css
@font-face {
  font-family: "Inter";
  src: url("inter.woff2") format("woff2");
  font-weight: 100 900;
  font-display: swap;
}
```

### `@font-feature-values`

Gives readable names to OpenType feature indices for a font family, so `font-variant-alternates` can refer to them. It contains these feature blocks: `@swash`, `@annotation`, `@ornaments`, `@stylistic`, `@styleset`, `@character-variant`, `@historical-forms`.

##### Description

- Hoist - false
- Atomic - false

```css
@font-feature-values "Font One" {
  @styleset {
    nice-style: 12;
  }
}

.fancy {
  font-variant-alternates: styleset(nice-style);
}
```

### `@font-palette-values`

Customizes the color palette of a color font (COLRv0/v1). You apply it with `font-palette`.

##### Description

- Hoist - false
- Atomic - false

```css
@font-palette-values --brand {
  font-family: "Bungee Spice";
  base-palette: 0;
  override-colors:
    0 #c00,
    1 #f80;
}

h1 {
  font-family: "Bungee Spice";
  font-palette: --brand;
}
```

---

## Animation & Transitions

### `@keyframes`

Defines the intermediate steps of a CSS animation.

##### Description

- Hoist - false
- Atomic - false

```css
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal {
  animation: fade-in 300ms ease-out;
}
```

### `@starting-style`

Sets the starting values for a transition on an element's first style update, for example when it is inserted into the DOM or goes from `display: none` to visible.

##### Description

- Hoist - false
- Atomic - true

```css
.popover {
  transition:
    opacity 0.3s,
    display 0.3s allow-discrete;
  opacity: 1;
}

@starting-style {
  .popover {
    opacity: 0;
  }
}
```

### `@view-transition`

Opts the document into cross-document (multi-page) view transitions.

##### Description

- Hoist - false
- Atomic - false

```css
@view-transition {
  navigation: auto;
}
```

---

## Custom Properties, Functions & Mixins

### `@property`

Registers a custom property with a type (syntax), inheritance behavior, and initial value. A registered property can be animated.

##### Description

- Hoist - false
- Atomic - false

```css
@property --angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

.spinner {
  transform: rotate(var(--angle));
  transition: --angle 1s;
}
```

### `@function` _(experimental)_

Defines a custom CSS function that takes arguments and returns a value.

##### Description

- Hoist - false
- Atomic - false

```css
@function --negate(--value) {
  result: calc(-1 * var(--value));
}

.box {
  margin-top: --negate(1rem);
}
```

### `@mixin` / `@apply` _(draft, not implemented)_

Defines a reusable block of declarations (`@mixin`) and inserts it elsewhere (`@apply`).

##### Description

- Hoist - false
- Atomic - false

```css
@mixin --center {
  display: grid;
  place-items: center;
}

.hero {
  @apply --center;
}
```

### `@custom-selector` _(draft, not implemented)_

Defines a named alias for a selector list.

##### Description

- Hoist - false
- Atomic - false

```css
@custom-selector :--heading h1, h2, h3;

:--heading {
  font-family: serif;
}
```

---

## Paged Media

### `@page`

Changes page properties (size, margins, orientation) when printing or using paged media. Supports the `:first`, `:left`, `:right`, and `:blank` pseudo-classes, as well as named pages.

##### Description

- Hoist - false
- Atomic - false

```css
@page {
  size: A4;
  margin: 2cm;
}

@page :first {
  margin-top: 4cm;
}
```

### Page-margin at-rules

Nested inside `@page`, these style the 16 page-margin boxes (headers, footers, corners). The full set: `@top-left-corner`, `@top-left`, `@top-center`, `@top-right`, `@top-right-corner`, `@right-top`, `@right-middle`, `@right-bottom`, `@bottom-right-corner`, `@bottom-right`, `@bottom-center`, `@bottom-left`, `@bottom-left-corner`, `@left-bottom`, `@left-middle`, `@left-top`.

##### Description

- Hoist - false
- Atomic - false

```css
@page {
  @bottom-center {
    content: "Page " counter(page) " of " counter(pages);
  }
}
```

---

## Layout & Positioning

### `@position-try`

Defines a named fallback position for an anchor-positioned element. You reference it from `position-try-fallbacks`.

##### Description

- Hoist - false
- Atomic - false

```css
@position-try --below {
  position-area: bottom;
  margin-top: 8px;
}

.tooltip {
  position-anchor: --trigger;
  position-area: top;
  position-try-fallbacks: --below;
}
```

---

## Lists & Counters

### `@counter-style`

Defines a custom counter style for list markers and `counter()` output.

##### Description

- Hoist - false
- Atomic - false

```css
@counter-style thumbs {
  system: cyclic;
  symbols: "👍";
  suffix: " ";
}

ul {
  list-style: thumbs;
}
```

---

## Color

### `@color-profile` _(experimental, limited support)_

Defines and names an ICC color profile so the `color()` function can use it.

##### Description

- Hoist - false
- Atomic - false

```css
@color-profile --swop5c {
  src: url("SWOP2006_Coated5v2.icc");
}

.header {
  background-color: color(--swop5c 0% 70% 20% 0%);
}
```

---

## Deprecated / Obsolete

### `@document` _(deprecated, Firefox-only historically)_

Applied styles based on the document's URL. It has been removed from standards, and only `@-moz-document` existed in practice.

##### Description

- Hoist - false
- Atomic - true

```css
@document url("https://example.com/")
{
  h1 {
    color: green;
  }
}
```

### `@viewport` _(obsolete)_

Controlled viewport settings from CSS. Use `<meta name="viewport">` instead.

##### Description

- Hoist - false
- Atomic - false

```css
@viewport {
  width: device-width;
}
```

### `@nest` _(dropped proposal)_

Proposed syntax for CSS nesting. Native nesting shipped without it.

##### Description

- Hoist - false
- Atomic - false

```css
/* No longer valid — use native nesting instead: */
.card {
  & .title {
    font-weight: bold;
  }
}
```
