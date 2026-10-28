// What the fake Astro compiler in the tests exports from Layout.astro.
declare module '*.astro' {
  const template: string;
  export default template;
}
