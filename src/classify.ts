import type {CssNode} from 'css-tree';
import type PreStyle from './';
import type {AST} from './atomize';
import csstree from 'css-tree';

export default function Classify(this: PreStyle, atomizedAst: CssNode) {
  (atomizedAst as any as AST).children.forEach((child) => {
    const classString = csstree.generate(child);
    const sweatmapString = this.sweatmap.set(classString);
    const updatedClassString = classString.replace(this.placeholder, sweatmapString);

    console.log({ classString, sweatmapString, updatedClassString });
  });
}
