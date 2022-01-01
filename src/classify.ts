import type {ClassifyResponse} from 'global';
import type {CssNode} from 'css-tree';
import csstree from 'css-tree';
import ATP from 'at-rule-packer/dist/tool';
import type PreStyle from '.';
import type {AST} from './atomize';

export default function Classify(
  this: PreStyle,
  atomizedAst: CssNode
): ClassifyResponse {
  const res = (atomizedAst as any as AST).children.reduce(
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
      css: '',
    }
  );

  res.css = ATP(res.css) as string;

  return res;
}
