import csstree from "css-tree";
import type PreStyle from ".";

export interface AST {
  type: "StyleSheet";
  loc: csstree.CssLocation | null;
  children: (csstree.Atrule | csstree.Rule)[];
}

const deepClone = (obj: object) => JSON.parse(JSON.stringify(obj));

export default function Atomize(this: PreStyle, normalizedCss: string) {
  const ast = csstree.parse(normalizedCss) as any as AST;
  const atomizedAst: AST = {
    type: "StyleSheet",
    loc: null,
    children: [],
  };
  const placeholderFound = (obj: object) =>
    !!~JSON.stringify(obj).indexOf(this.placeholder);

  const processRule = (rule: csstree.Rule) => {
    const prelude = rule.prelude as any as csstree.AtrulePrelude;
    const block = rule.block as any as csstree.Block;
    const arr: any[] = [];

    let p = prelude.children.getSize();
    const b = block.children.getSize();

    // Create a new atom class for each prelude and block piece
    for (; p > 0; p--) {
      for (let i = b; i > 0; i--) {
        const clone = deepClone(rule);

        clone.prelude.children = [clone.prelude.children[p - 1]];
        clone.block.children = [clone.block.children[i - 1]];

        if (placeholderFound(clone)) {
          arr.push(clone);
        }
      }
    }

    return arr;
  };

  const processAtrule = (atrule: csstree.Atrule) => {
    const atRuleClones: any[] = [];

    if (!atrule.block?.children) return atRuleClones;

    atrule.block?.children.forEach((child) => {
      let typeRule: any[] = [];

      switch (child.type) {
        case "Rule": {
          typeRule = processRule(child);
          break;
        }
        case "Atrule": {
          typeRule = processAtrule(child);
          break;
        }
      }

      typeRule.forEach((newrule) => {
        const clone = deepClone(atrule);

        clone.block.children = [newrule];
        atRuleClones.push(clone);
      });
    });

    return atRuleClones;
  };

  // Process AST children
  ast.children.forEach((child) => {
    switch (child.type) {
      case "Rule":
        atomizedAst.children.push(processRule(child) as any);
        break;
      case "Atrule":
        atomizedAst.children.push(processAtrule(child) as any);
        break;
      default:
        atomizedAst.children.push(child);
        break;
    }
  });

  // Flatten a single level
  atomizedAst.children = atomizedAst.children.flat();

  return atomizedAst as any as csstree.CssNode;
}
