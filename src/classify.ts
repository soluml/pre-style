import type { CssNode } from "css-tree";
import csstree from "css-tree";
import type PreStyle from ".";
import type { AST } from "./atomize";

export default function Classify(
  this: PreStyle,
  atomizedAst: CssNode
): ClassifyResponse {
  return (atomizedAst as any as AST).children.reduce(
    (acc: ClassifyResponse, child) => {
      const key = csstree.generate(child);
      const value = this.sweatmap.has(key)
        ? this.sweatmap.get(key)
        : this.sweatmap.set(key);

      acc.classNames[key] = value;
      acc.css += key.replace(this.placeholderRegex, value);

      return acc;
    },
    {
      classNames: {},
      css: "",
    }
  );
}
