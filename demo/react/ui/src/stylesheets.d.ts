// Types for stylesheet files before TypeScript 7.1, which can't type named
// imports from them, only namespace imports (`import * as styles`). This
// copy is for the library's own typecheck: TypeScript's guidance is that
// libraries don't publish wildcard module declarations, so each app that
// compiles the library declares them too.
declare module '*.scss' {
  const classes: { readonly [name: string]: string };
  export = classes;
}
