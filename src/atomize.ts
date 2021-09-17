import type PreStyle from './';
import csstree from 'css-tree';

export default function Atomize(this: PreStyle, normalizedCss: string) {
  const ast = csstree.parse(normalizedCss);



  console.log(JSON.stringify(csstree.parse(`
  .extraClassFilter,
  .✝️ⓈⓞⓛⓘⒹⓔⓞⒼⓛⓞⓡⓘⓐ✝️ {
    column-count: 5
  }
  `), null, 2))
  

  csstree.walk(ast, {
    enter(node: csstree.CssNode) {
      // console.log({node});
    }
  });



  return Promise.resolve('');
}
