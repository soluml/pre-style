import type PreStyle from './';
import csstree from 'css-tree';

interface AST {
  type: 'StyleSheet';
  loc: csstree.CssLocation|null;
  children: (csstree.Atrule|csstree.Rule)[];
}

export default function Atomize(this: PreStyle, normalizedCss: string) {
  const ast = csstree.parse(normalizedCss) as any as AST;
  const atomizedAst = {
    type: "StyleSheet",
    loc: null,
    children: []
  };




  
  

  



  return Promise.resolve('');
}
