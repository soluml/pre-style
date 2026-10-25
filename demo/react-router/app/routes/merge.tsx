import { useState } from 'react';
import { css, merge } from 'pre-style';
import { Button, buttonClass, type ButtonVariant } from '../components/Button';
import type { Route } from './+types/merge';

export const meta: Route.MetaFunction = () => [{ title: 'Merge · Pre-Style demo' }];

const controls = css`
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--space) * 2);
  margin-bottom: calc(var(--space) * 6);
`;

const output = css`
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-family: var(--font-mono);
  font-size: 0.875rem;
  overflow-x: auto;
  padding: calc(var(--space) * 4);
  white-space: pre-wrap;
`;

// Resolved at build time: every argument is a block.
const staticMerge = merge(
  css`
    color: red;
    padding: 1rem;
  `,
  css`
    color: green;
    padding-left: 2rem;
  `,
);

export default function MergeRoute() {
  const [variant, setVariant] = useState<ButtonVariant>('primary');
  const [large, setLarge] = useState(false);
  const size = large ? 'large' : 'normal';

  return (
    <>
      <h1>merge</h1>
      <p>
        Pick a variant. The button's classes are combined with <code>merge</code> in the browser,
        using the project's lookup table.
      </p>
      <div className={controls}>
        {(['primary', 'danger', 'ghost'] as const).map((v) => (
          <Button
            key={v}
            variant="ghost"
            aria-pressed={variant === v}
            onClick={() => setVariant(v)}
          >
            {v}
          </Button>
        ))}
        <Button variant="ghost" aria-pressed={large} onClick={() => setLarge(!large)}>
          large
        </Button>
      </div>
      <p>
        <Button variant={variant} size={size}>
          Preview
        </Button>
      </p>
      <pre className={output}>{buttonClass(variant, size)}</pre>
      <h2>Resolved at build time</h2>
      <p>
        <span className={staticMerge}>This text is green, with 2rem of left padding.</span>
      </p>
      <pre className={output}>{staticMerge}</pre>
    </>
  );
}
