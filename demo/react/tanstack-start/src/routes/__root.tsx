import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';
import { css } from 'pre-style';
// Pre-Style's CSS. Vite bundles it in builds, and TanStack Start links it
// when rendering on the server.
// oxlint-disable-next-line import/no-unassigned-import
import 'virtual:pre-style.css';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Pre-Style demo' },
    ],
  }),
  shellComponent: RootDocument,
  component: () => <Outlet />,
});

const body = css`
  background-color: var(--color-background);
  color: var(--color-text);
  font-family: var(--font-sans);
  line-height: 1.5;
  margin: 0;
`;

const header = css`
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-surface);
`;

const nav = css`
  display: flex;
  gap: calc(var(--space) * 6);
  align-items: center;
  max-width: 60rem;
  margin-inline: auto;
  padding: calc(var(--space) * 4) calc(var(--space) * 5);
`;

const brand = css`
  font-weight: 700;
  margin-right: auto;
`;

const link = css`
  color: var(--color-muted);
  text-decoration: none;

  &:hover {
    color: var(--color-text);
  }

  &[data-status='active'] {
    color: var(--color-accent);
    font-weight: 600;
  }
`;

const main = css`
  max-width: 60rem;
  margin-inline: auto;
  padding: calc(var(--space) * 8) calc(var(--space) * 5);
`;

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className={body}>
        <header className={header}>
          <nav className={nav}>
            <span className={brand}>Pre-Style demo · TanStack Start</span>
            <Link to="/" className={link} activeOptions={{ exact: true }}>
              Basics
            </Link>
            <Link to="/merge" className={link}>
              Merge
            </Link>
            <Link to="/server" className={link}>
              Server
            </Link>
          </nav>
        </header>
        <main className={main}>{children}</main>
        <Scripts />
      </body>
    </html>
  );
}
