import type PreStyle from './';
import csstree from 'css-tree';

interface AST {
  type: 'StyleSheet';
  loc: csstree.CssLocation|null;
  children: (csstree.Atrule|csstree.Rule)[];
}

const deepClone = (obj: object) => JSON.parse(JSON.stringify(obj));


export default function Atomize(this: PreStyle, normalizedCss: string) {
  const ast = csstree.parse(normalizedCss) as any as AST;
  const atomizedAst: AST = {
    type: "StyleSheet",
    loc: null,
    children: []
  };
  const placeholderFound = (obj: object) => !!~JSON.stringify(obj).indexOf(this.placeholder);




  //
  const fakeAst = csstree.parse(`
    .extraClassFilter,
    .✝️ⓈⓞⓛⓘⒹⓔⓞⒼⓛⓞⓡⓘⓐ✝️ {
      column-count: 5
    }
  `) as any as AST;
  //




  function processRule(rule: csstree.Rule) {
    // Create a new atom class for each selector piece
    const prelude = rule.prelude as any as csstree.AtrulePrelude;
    const arr: any[] = [];

    prelude.children.forEach((pc) => {
      const clone = deepClone(rule);

      clone.prelude.children = [pc];
      placeholderFound(clone) && arr.push(clone);
    });

    return arr;
  }

  // Process AST children
  fakeAst.children.forEach((child) => {
    switch(child.type) {
      case 'Rule':
        atomizedAst.children.push(processRule(child) as any);
        break;
    }
  });

  // Flatten a single level
  atomizedAst.children = atomizedAst.children.flat();




  //TODO: support @atrules


  console.log({atomizedAst: csstree.generate(atomizedAst as any as csstree.CssNode)});






  
  

  



  return Promise.resolve('');
}
