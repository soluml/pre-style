import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { compile, css } from './helpers.ts';

// Every pseudo-class and pseudo-element on MDN's lists, used as a selector
// variant (`&:hover { color: red }`). Each becomes its own selector variant
// segment. Lightning CSS writes some of them differently, as noted.

// [written in the block, written in the output]
const PSEUDO_CLASSES: [string, string][] = [
  [':active', ':active'],
  [':active-view-transition', ':active-view-transition'],
  [':active-view-transition-type(slide)', ':active-view-transition-type(slide)'],
  [':any-link', ':any-link'],
  [':autofill', ':autofill'],
  [':blank', ':blank'],
  [':buffering', ':buffering'],
  [':checked', ':checked'],
  [':current', ':current'],
  [':default', ':default'],
  [':defined', ':defined'],
  [':dir(rtl)', ':dir(rtl)'],
  [':disabled', ':disabled'],
  [':empty', ':empty'],
  [':enabled', ':enabled'],
  [':first-child', ':first-child'],
  [':first-of-type', ':first-of-type'],
  [':focus', ':focus'],
  [':focus-visible', ':focus-visible'],
  [':focus-within', ':focus-within'],
  [':fullscreen', ':fullscreen'],
  [':future', ':future'],
  [':has-slotted', ':has-slotted'],
  [':has(> img)', ':has(>img)'],
  [':heading', ':heading'],
  [':heading(2)', ':heading(2)'],
  [':host', ':host'],
  [':host(.dark)', ':host(.dark)'],
  [':host-context(.dark)', ':host-context(.dark)'],
  [':hover', ':hover'],
  [':in-range', ':in-range'],
  [':indeterminate', ':indeterminate'],
  [':interest-source', ':interest-source'],
  [':interest-target', ':interest-target'],
  [':invalid', ':invalid'],
  [':is(.a, .b)', ':is(.a,.b)'],
  [':lang(en)', ':lang(en)'],
  [':last-child', ':last-child'],
  [':last-of-type', ':last-of-type'],
  [':link', ':link'],
  [':local-link', ':local-link'],
  [':modal', ':modal'],
  [':muted', ':muted'],
  [':not(.a)', ':not(.a)'],
  [':nth-child(2n+1)', ':nth-child(odd)'],
  [':nth-last-child(2)', ':nth-last-child(2)'],
  [':nth-last-of-type(3n)', ':nth-last-of-type(3n)'],
  [':nth-of-type(even)', ':nth-of-type(2n)'],
  [':only-child', ':only-child'],
  [':only-of-type', ':only-of-type'],
  [':open', ':open'],
  [':optional', ':optional'],
  [':out-of-range', ':out-of-range'],
  [':past', ':past'],
  [':paused', ':paused'],
  [':picture-in-picture', ':picture-in-picture'],
  [':placeholder-shown', ':placeholder-shown'],
  [':playing', ':playing'],
  [':popover-open', ':popover-open'],
  [':read-only', ':read-only'],
  [':read-write', ':read-write'],
  [':required', ':required'],
  [':root', ':root'],
  [':scope', ':scope'],
  [':seeking', ':seeking'],
  [':stalled', ':stalled'],
  [':state(checked)', ':state(checked)'],
  [':target', ':target'],
  [':target-after', ':target-after'],
  [':target-before', ':target-before'],
  [':target-current', ':target-current'],
  [':user-invalid', ':user-invalid'],
  [':user-valid', ':user-valid'],
  [':valid', ':valid'],
  [':visited', ':visited'],
  [':volume-locked', ':volume-locked'],
  [':where(.a)', ':where(.a)'],
  [':xr-overlay', ':xr-overlay'],
  [':-moz-broken', ':-moz-broken'],
  [':-moz-drag-over', ':-moz-drag-over'],
  [':-moz-first-node', ':-moz-first-node'],
  [':-moz-handler-blocked', ':-moz-handler-blocked'],
  [':-moz-handler-crashed', ':-moz-handler-crashed'],
  [':-moz-handler-disabled', ':-moz-handler-disabled'],
  [':-moz-last-node', ':-moz-last-node'],
  [':-moz-loading', ':-moz-loading'],
  [':-moz-locale-dir(ltr)', ':-moz-locale-dir(ltr)'],
  [':-moz-locale-dir(rtl)', ':-moz-locale-dir(rtl)'],
  [':-moz-only-whitespace', ':-moz-only-whitespace'],
  [':-moz-submit-invalid', ':-moz-submit-invalid'],
  [':-moz-suppressed', ':-moz-suppressed'],
  [':-moz-user-disabled', ':-moz-user-disabled'],
  [':-moz-window-inactive', ':-moz-window-inactive'],
];

// [written in the block, written in the output]
const PSEUDO_ELEMENTS: [string, string][] = [
  ['::after', ':after'],
  ['::backdrop', '::backdrop'],
  ['::before', ':before'],
  ['::column', '::column'],
  ['::checkmark', '::checkmark'],
  ['::cue', '::cue'],
  ['::cue(b)', '::cue(b)'],
  ['::details-content', '::details-content'],
  ['::file-selector-button', '::file-selector-button'],
  ['::first-letter', ':first-letter'],
  ['::first-line', ':first-line'],
  ['::grammar-error', '::grammar-error'],
  ['::highlight(found)', '::highlight(found)'],
  ['::marker', '::marker'],
  ['::part(label)', '::part(label)'],
  ['::picker(select)', '::picker(select)'],
  ['::picker-icon', '::picker-icon'],
  ['::placeholder', '::placeholder'],
  ['::scroll-button(left)', '::scroll-button(left)'],
  ['::scroll-marker', '::scroll-marker'],
  ['::scroll-marker-group', '::scroll-marker-group'],
  ['::selection', '::selection'],
  ['::slotted(span)', '::slotted(span)'],
  ['::spelling-error', '::spelling-error'],
  ['::target-text', '::target-text'],
  ['::view-transition', '::view-transition'],
  ['::view-transition-image-pair(root)', '::view-transition-image-pair(root)'],
  ['::view-transition-group(root)', '::view-transition-group(root)'],
  ['::view-transition-new(root)', '::view-transition-new(root)'],
  ['::view-transition-old(root)', '::view-transition-old(root)'],
  ['::search-text', '::search-text'],
  ['::-moz-color-swatch', '::-moz-color-swatch'],
  ['::-moz-focus-inner', '::-moz-focus-inner'],
  ['::-moz-list-bullet', '::-moz-list-bullet'],
  ['::-moz-list-number', '::-moz-list-number'],
  ['::-moz-meter-bar', '::-moz-meter-bar'],
  ['::-moz-progress-bar', '::-moz-progress-bar'],
  ['::-moz-range-progress', '::-moz-range-progress'],
  ['::-moz-range-thumb', '::-moz-range-thumb'],
  ['::-moz-range-track', '::-moz-range-track'],
  ['::-webkit-inner-spin-button', '::-webkit-inner-spin-button'],
  ['::-webkit-meter-bar', '::-webkit-meter-bar'],
  ['::-webkit-meter-even-less-good-value', '::-webkit-meter-even-less-good-value'],
  ['::-webkit-meter-inner-element', '::-webkit-meter-inner-element'],
  ['::-webkit-meter-optimum-value', '::-webkit-meter-optimum-value'],
  ['::-webkit-meter-suboptimum-value', '::-webkit-meter-suboptimum-value'],
  ['::-webkit-progress-bar', '::-webkit-progress-bar'],
  ['::-webkit-progress-inner-element', '::-webkit-progress-inner-element'],
  ['::-webkit-progress-value', '::-webkit-progress-value'],
  ['::-webkit-scrollbar', '::-webkit-scrollbar'],
  ['::-webkit-search-cancel-button', '::-webkit-search-cancel-button'],
  ['::-webkit-search-results-button', '::-webkit-search-results-button'],
  ['::-webkit-slider-runnable-track', '::-webkit-slider-runnable-track'],
  ['::-webkit-slider-thumb', '::-webkit-slider-thumb'],
];

const check = async (written: string, output: string) => {
  const { classes, css: result } = await compile([`&${written} { color: red }`]);
  assert.deepEqual(classes, ['A-A']);
  assert.equal(result, `.A-A${output}{color:red}`);
};

describe('pseudo-classes', () => {
  for (const [written, output] of PSEUDO_CLASSES) test(written, () => check(written, output));

  // `:left`, `:right`, `:first`, and `:blank` page selectors only apply in
  // `@page`, which is kept as-is.
  test('page pseudo-classes', async () => {
    const { css: output } = await compile([
      `@page :left { margin-left: 1in } @page :right { margin-right: 1in } @page :first { margin-top: 2in } @page :blank { margin: 0 } color: red`,
    ]);
    assert.equal(
      output,
      css`
        @page:left{margin-left:1in}
        @page:right{margin-right:1in}
        @page:first{margin-top:2in}
        @page:blank{margin:0}
        .A{color:red}
      `,
    );
  });
});

describe('pseudo-elements', () => {
  for (const [written, output] of PSEUDO_ELEMENTS) test(written, () => check(written, output));

  // Lightning CSS doesn't parse pseudo-elements nested in pseudo-elements yet.
  test('::before::marker is not supported', async () => {
    await assert.rejects(compile([`&::before::marker { color: red }`]), /Invalid CSS/);
  });
});
