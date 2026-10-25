import { createFileRoute, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { scss } from 'pre-style';
import { useState } from 'react';
import { Button } from 'pre-style-demo-react-ui';

const savedNotes: string[] = ['Rendered on the server first.'];

const getNotes = createServerFn({ method: 'GET' }).handler(() => ({
  renderedAt: new Date().toISOString(),
  notes: savedNotes,
}));

const addNote = createServerFn({ method: 'POST' })
  .validator((note: string) => note.trim())
  .handler(({ data }) => {
    if (data) savedNotes.push(data);
  });

export const Route = createFileRoute('/server')({
  head: () => ({ meta: [{ title: 'Server · Pre-Style demo' }] }),
  loader: () => getNotes(),
  component: ServerRoute,
});

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

function ServerRoute() {
  const { renderedAt, notes } = Route.useLoaderData();
  const router = useRouter();
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    await addNote({ data: note });
    setNote('');
    await router.invalidate();
    setSaving(false);
  };

  return (
    <>
      <h1>Server</h1>
      <p>
        This page loads its notes with a server function and adds them with another. View the page
        source: the server-rendered HTML has the same class strings the browser hydrates.
      </p>
      <div className={layout}>
        <section className={panel}>
          <h2>Notes</h2>
          <ul className={list}>
            {notes.map((text, i) => (
              <li key={i}>{text}</li>
            ))}
          </ul>
        </section>
        <section className={panel}>
          <h2>Add a note</h2>
          <form onSubmit={submit}>
            <input
              name="note"
              className={field}
              placeholder="Something to remember"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button type="submit" disabled={saving}>
              Add
            </Button>
          </form>
          <p className={time}>Rendered at {renderedAt}</p>
        </section>
      </div>
    </>
  );
}
