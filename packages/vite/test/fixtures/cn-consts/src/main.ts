import { css, cn } from '@pre.style/core';

const red = css`color: red;`;
const blue = css`color: blue;`;
const label = 'label' as const;

// Static through `const`s, including another static `cn` call.
const both = cn(red, blue);
const chained = cn(both, label, css`margin: 0;`);

// `red` is a parameter here, so it isn't the `const`.
// oxlint-disable-next-line no-shadow
function shadowed(red: string) {
  return cn(red, blue);
}

// Functions run after the module, so `late` is declared by then.
const deferred = () => cn(late, blue);
const late = css`color: green;`;

// Outside a function, `early` would throw before it's declared.
// @ts-expect-error
const tdz = cn(early);
const early = css`padding: 0;`;

const dynamic = cn(red, window.location.hash);

Object.assign(window, { both, chained, shadowed, deferred, tdz, dynamic });
