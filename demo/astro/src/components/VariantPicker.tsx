import { useState } from 'react';
import { css } from '@pre.style/core';
import { Button, buttonClass, type ButtonVariant } from 'pre.style-demo-react-ui';

const controls = css`
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--space) * 2);
  margin-bottom: calc(var(--space) * 6);
`;

// A React island: rendered on the server, then hydrated in the browser,
// where `cn` combines the button's classes with the project's lookup table.
export function VariantPicker({ outputClass }: { outputClass: string }) {
  const [variant, setVariant] = useState<ButtonVariant>('primary');
  const [large, setLarge] = useState(false);
  const size = large ? 'large' : 'normal';

  return (
    <>
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
      <pre className={outputClass}>{buttonClass(variant, size)}</pre>
    </>
  );
}
