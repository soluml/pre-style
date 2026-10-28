// Types for stylesheet files before TypeScript 7.1, which can't type named
// imports from them, only namespace imports (`import * as styles`). The
// shared component library's Badge imports one.
declare module '*.scss' {
  const classes: { readonly [name: string]: string };
  export = classes;
}
