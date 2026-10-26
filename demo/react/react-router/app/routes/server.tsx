import { Form, useNavigation } from 'react-router';
import { scss } from '@pre.style/core';
import { Button } from 'pre.style-demo-react-ui';
import type { Route } from './+types/server';

export const meta: Route.MetaFunction = () => [{ title: 'Server · pre.style demo' }];

const notes: string[] = ['Rendered on the server first.'];

export async function loader() {
  return { renderedAt: new Date().toISOString(), notes };
}

export async function action({ request }: Route.ActionArgs) {
  const note = String((await request.formData()).get('note') ?? '').trim();
  if (note) notes.push(note);
  return null;
}

// scss blocks use the mixins prepended from app/styles/_tokens.scss.
const layout = scss`
  display: grid;
  gap: calc(var(--space) * 4);

  @include md {
    grid-template-columns: 2fr 1fr;
  }
`;

const panel = scss`
  @include card;

  h2 {
    font-size: 1rem;
    margin-top: 0;
  }
`;

const list = scss`
  margin: 0;
  padding-left: 1.25rem;

  li + li {
    margin-top: var(--space);
  }
`;

const field = scss`
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: calc(var(--radius) / 1.5);
  color: inherit;
  font: inherit;
  padding: calc(var(--space) * 2);
  width: 100%;
  box-sizing: border-box;
  margin-bottom: calc(var(--space) * 2);

  &:focus {
    border-color: var(--color-accent);
    outline: none;
  }
`;

const time = scss`
  color: var(--color-muted);
  font-family: var(--font-mono);
  font-size: 0.875rem;
`;

export default function ServerRoute({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  return (
    <>
      <h1>Server</h1>
      <p>
        This page has a loader and an action. View the page source: the server-rendered HTML has the
        same class strings the browser hydrates.
      </p>
      <div className={layout}>
        <section className={panel}>
          <h2>Notes</h2>
          <ul className={list}>
            {loaderData.notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </section>
        <section className={panel}>
          <h2>Add a note</h2>
          <Form method="post">
            <input name="note" className={field} placeholder="Something to remember" />
            <Button type="submit" disabled={navigation.state !== 'idle'}>
              Add
            </Button>
          </Form>
          <p className={time}>Rendered at {loaderData.renderedAt}</p>
        </section>
      </div>
    </>
  );
}
