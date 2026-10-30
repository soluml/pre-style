// A schema for a field can't be contributed on its own, so the core schema is
// wrapped in one for the whole package.json. VS Code merges it with the
// standard package.json schema, so only the pre.style field is checked.
type Schema = Record<string, unknown>;

export function wrapFieldSchema(field: Schema): Schema {
  // Core's $refs point at #/definitions/…, so its definitions move to the root
  // to keep them resolving.
  const { $schema, definitions, ...rest } = field;
  return {
    $schema,
    title: 'package.json with a pre.style field',
    definitions,
    properties: { 'pre.style': rest },
  };
}
