import { css, cn } from 'pre-style';

const base = css`
  appearance: none;
  background-color: var(--color-accent);
  border: 0;
  border-radius: calc(var(--radius) / 1.5);
  color: white;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  padding: calc(var(--space) * 2) calc(var(--space) * 4);
  transition: background-color 150ms ease;

  &:hover {
    background-color: var(--color-accent-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const variants = {
  primary: '',
  danger: css`
    background-color: var(--color-danger);

    &:hover {
      background-color: var(--color-danger);
      filter: brightness(1.1);
    }
  `,
  ghost: css`
    background-color: transparent;
    border: 1px solid var(--color-border);
    color: var(--color-text);

    &:hover {
      background-color: var(--color-background);
    }
  `,
};

const large = css`
  font-size: 1.125rem;
  padding: calc(var(--space) * 3) calc(var(--space) * 6);
`;

export type ButtonVariant = keyof typeof variants;

export function buttonClass(
  variant: ButtonVariant = 'primary',
  size: 'normal' | 'large' = 'normal',
) {
  // Resolved at runtime with the project's lookup table, since the
  // arguments depend on props.
  return cn(base, variants[variant], size === 'large' && large);
}

export function Button({
  variant,
  size,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: 'normal' | 'large';
}) {
  return <button className={cn(buttonClass(variant, size), className)} {...props} />;
}
