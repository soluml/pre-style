import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { css, cn } from '@pre.style/core';
import { Button, buttonClass, type ButtonVariant } from 'pre.style-demo-react-ui';

export const Route = createFileRoute('/cn')({
  head: () => ({ meta: [{ title: 'cn · pre.style demo' }] }),
  component: CnRoute,
});

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
const staticCn = cn(
  css`
    color: red;
    padding: 1rem;
  `,
  css`
    color: green;
    padding-left: 2rem;
  `,
);

function CnRoute() {
  const [variant, setVariant] = useState<ButtonVariant>('primary');
  const [large, setLarge] = useState(false);
  const size = large ? 'large' : 'normal';

  return (
    <>
      <h1>cn</h1>
      <p>
        Pick a variant. The button's classes are combined with <code>cn</code> in the browser, using
        the project's lookup table.
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
        <span className={staticCn}>This text is green, with 2rem of left padding.</span>
      </p>
      <pre className={output}>{staticCn}</pre>
    </>
  );
}
