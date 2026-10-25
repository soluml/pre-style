import type { Declaration } from 'lightningcss';
import { SHORTHANDS } from '../shorthands.ts';

// Shorthands are expanded into their most specific longhands, using the
// values Lightning CSS has already parsed. A shorthand's parsed value holds
// its longhands' values with the same types, so each longhand declaration is
// built from a piece of it.

type Value = any;
type Longhands = [name: string, value: Value][];
type Expander = (value: Value) => Longhands;

const SIDES = ['top', 'right', 'bottom', 'left'] as const;

// `{ top, right, bottom, left }` → `<prefix>-top<suffix>`, …
const sides =
  (prefix: string, suffix = ''): Expander =>
  (v) =>
    SIDES.map((side) => [`${prefix}${side}${suffix}`, v[side]]);

// Maps value keys to longhand names.
const keys =
  (map: Record<string, string>): Expander =>
  (v) =>
    Object.entries(map).map(([key, name]) => [name, v[key]]);

const blockKeys = (prefix: string, suffix = '') =>
  keys({ blockStart: `${prefix}-block-start${suffix}`, blockEnd: `${prefix}-block-end${suffix}` });
const inlineKeys = (prefix: string, suffix = '') =>
  keys({
    inlineStart: `${prefix}-inline-start${suffix}`,
    inlineEnd: `${prefix}-inline-end${suffix}`,
  });
const startEnd = (start: string, end: string) => keys({ start, end });

// `{ width, style, color }` for one border side.
const borderSide = (side: string) =>
  keys({
    width: `border-${side}-width`,
    style: `border-${side}-style`,
    color: `border-${side}-color`,
  });

const borderSides =
  (...names: string[]): Expander =>
  (v) =>
    names.flatMap((side) => borderSide(side)(v));

// Layered shorthands (`background`, `transition`, `animation`): each
// longhand takes a list with one value per layer.
const layers =
  (map: Record<string, string>, last: Record<string, string> = {}): Expander =>
  (v: Value[]) => [
    ...Object.entries(map).map(([key, name]): [string, Value] => [
      name,
      v.map((layer) => layer[key]),
    ]),
    ...Object.entries(last).map(([key, name]): [string, Value] => [name, v[v.length - 1][key]]),
  ];

const EXPANDERS: Record<string, Expander> = {
  margin: sides('margin-'),
  'margin-block': blockKeys('margin'),
  'margin-inline': inlineKeys('margin'),
  padding: sides('padding-'),
  'padding-block': blockKeys('padding'),
  'padding-inline': inlineKeys('padding'),
  inset: sides(''),
  'inset-block': keys({ blockStart: 'inset-block-start', blockEnd: 'inset-block-end' }),
  'inset-inline': keys({ inlineStart: 'inset-inline-start', inlineEnd: 'inset-inline-end' }),
  'scroll-margin': sides('scroll-margin-'),
  'scroll-margin-block': blockKeys('scroll-margin'),
  'scroll-margin-inline': inlineKeys('scroll-margin'),
  'scroll-padding': sides('scroll-padding-'),
  'scroll-padding-block': blockKeys('scroll-padding'),
  'scroll-padding-inline': inlineKeys('scroll-padding'),

  // `border` isn't expanded: it sets 12 longhands (width, style, and color
  // for each side), too many classes for one declaration. `merge` still
  // knows which longhands it covers.
  'border-top': borderSide('top'),
  'border-right': borderSide('right'),
  'border-bottom': borderSide('bottom'),
  'border-left': borderSide('left'),
  'border-block': borderSides('block-start', 'block-end'),
  'border-block-start': borderSide('block-start'),
  'border-block-end': borderSide('block-end'),
  'border-inline': borderSides('inline-start', 'inline-end'),
  'border-inline-start': borderSide('inline-start'),
  'border-inline-end': borderSide('inline-end'),
  'border-width': sides('border-', '-width'),
  'border-style': sides('border-', '-style'),
  'border-color': sides('border-', '-color'),
  'border-block-width': startEnd('border-block-start-width', 'border-block-end-width'),
  'border-block-style': startEnd('border-block-start-style', 'border-block-end-style'),
  'border-block-color': startEnd('border-block-start-color', 'border-block-end-color'),
  'border-inline-width': startEnd('border-inline-start-width', 'border-inline-end-width'),
  'border-inline-style': startEnd('border-inline-start-style', 'border-inline-end-style'),
  'border-inline-color': startEnd('border-inline-start-color', 'border-inline-end-color'),
  'border-radius': keys({
    topLeft: 'border-top-left-radius',
    topRight: 'border-top-right-radius',
    bottomRight: 'border-bottom-right-radius',
    bottomLeft: 'border-bottom-left-radius',
  }),
  'border-image': keys({
    source: 'border-image-source',
    slice: 'border-image-slice',
    width: 'border-image-width',
    outset: 'border-image-outset',
    repeat: 'border-image-repeat',
  }),
  outline: keys({ width: 'outline-width', style: 'outline-style', color: 'outline-color' }),

  gap: keys({ row: 'row-gap', column: 'column-gap' }),
  flex: keys({ grow: 'flex-grow', shrink: 'flex-shrink', basis: 'flex-basis' }),
  'flex-flow': keys({ direction: 'flex-direction', wrap: 'flex-wrap' }),
  'place-items': keys({ align: 'align-items', justify: 'justify-items' }),
  'place-content': keys({ align: 'align-content', justify: 'justify-content' }),
  'place-self': keys({ align: 'align-self', justify: 'justify-self' }),
  'grid-template': keys({
    rows: 'grid-template-rows',
    columns: 'grid-template-columns',
    areas: 'grid-template-areas',
  }),
  'grid-row': startEnd('grid-row-start', 'grid-row-end'),
  'grid-column': startEnd('grid-column-start', 'grid-column-end'),
  'grid-area': keys({
    rowStart: 'grid-row-start',
    columnStart: 'grid-column-start',
    rowEnd: 'grid-row-end',
    columnEnd: 'grid-column-end',
  }),
  overflow: keys({ x: 'overflow-x', y: 'overflow-y' }),

  'text-decoration': keys({
    line: 'text-decoration-line',
    thickness: 'text-decoration-thickness',
    style: 'text-decoration-style',
    color: 'text-decoration-color',
  }),
  'text-emphasis': keys({ style: 'text-emphasis-style', color: 'text-emphasis-color' }),
  'list-style': keys({
    position: 'list-style-position',
    image: 'list-style-image',
    listStyleType: 'list-style-type',
  }),
  container: keys({ name: 'container-name', containerType: 'container-type' }),
  font: keys({
    family: 'font-family',
    size: 'font-size',
    style: 'font-style',
    weight: 'font-weight',
    stretch: 'font-stretch',
    lineHeight: 'line-height',
    variantCaps: 'font-variant-caps',
  }),

  background: layers(
    {
      image: 'background-image',
      repeat: 'background-repeat',
      size: 'background-size',
      attachment: 'background-attachment',
      origin: 'background-origin',
      clip: 'background-clip',
    },
    { color: 'background-color' },
  ),
  transition: layers({
    property: 'transition-property',
    duration: 'transition-duration',
    timingFunction: 'transition-timing-function',
    delay: 'transition-delay',
  }),
  animation: layers({
    name: 'animation-name',
    duration: 'animation-duration',
    timingFunction: 'animation-timing-function',
    iterationCount: 'animation-iteration-count',
    direction: 'animation-direction',
    playState: 'animation-play-state',
    delay: 'animation-delay',
    fillMode: 'animation-fill-mode',
    timeline: 'animation-timeline',
  }),
};

// `background-position` inside `background` layers is itself a shorthand.
const BACKGROUND_POSITION: Expander = (v: Value[]) => [
  ['background-position-x', v.map((layer) => layer.position.x)],
  ['background-position-y', v.map((layer) => layer.position.y)],
];

const custom = (name: string, keyword: string): Declaration =>
  ({
    property: 'custom',
    value: { name, value: [{ type: 'token', value: { type: 'ident', value: keyword } }] },
  }) as Declaration;

function expandValue(property: string, value: Value): Longhands {
  const longhands = EXPANDERS[property](value);
  if (property === 'background') longhands.push(...BACKGROUND_POSITION(value));
  return longhands;
}

// Expands a declaration into longhand declarations. Declarations that aren't
// shorthands, shorthands that aren't expanded (`border`), and ones that can't
// be (values with `var()`, `env()`, or `attr()`, CSS-wide keywords such as
// `inherit`, and `all`) are returned as they are. Longhands a shorthand sets
// that Lightning CSS keeps no value for (such as the `font-variant-*`
// properties `font` resets) are set to `initial`.
export function expand(declaration: Declaration): Declaration[] {
  const { property } = declaration;

  // Unparsed values (with `var()`, or a CSS-wide keyword such as
  // `font: inherit`) are kept as they are. A keyword applies to every
  // longhand equally, so splitting it would only add classes.
  if (property === 'unparsed' || !Object.hasOwn(EXPANDERS, property)) return [declaration];

  const vendorPrefix = 'vendorPrefix' in declaration ? declaration.vendorPrefix : undefined;
  const longhands = expandValue(property, declaration.value).map(
    ([name, value]) =>
      (vendorPrefix && LONGHAND_PREFIXED.has(name)
        ? { property: name, vendorPrefix, value }
        : { property: name, value }) as Declaration,
  );
  const set = new Set<string>(longhands.map((d) => d.property));
  for (const name of SHORTHANDS[property] ?? [])
    if (!set.has(name)) longhands.push(custom(name, 'initial'));
  return longhands;
}

// Longhands whose Lightning CSS declarations carry a vendor prefix.
const LONGHAND_PREFIXED = new Set([
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-right-radius',
  'border-bottom-left-radius',
  'border-image-source',
  'border-image-slice',
  'border-image-width',
  'border-image-outset',
  'border-image-repeat',
  'flex-grow',
  'flex-shrink',
  'flex-basis',
  'flex-direction',
  'flex-wrap',
  'text-decoration-line',
  'text-decoration-style',
  'text-decoration-color',
  'text-emphasis-style',
  'text-emphasis-color',
  'transition-property',
  'transition-duration',
  'transition-timing-function',
  'transition-delay',
  'animation-name',
  'animation-duration',
  'animation-timing-function',
  'animation-iteration-count',
  'animation-direction',
  'animation-play-state',
  'animation-delay',
  'animation-fill-mode',
  'align-items',
  'align-content',
  'align-self',
  'justify-content',
]);
