import type {CssNode} from 'css-tree';
import csstree from 'css-tree';
import type PreStyle from '.';
import type {AST} from './atomize';

export default function Classify(this: PreStyle, atomizedAst: CssNode) {
  console.log(csstree.generate(atomizedAst));

  (atomizedAst as any as AST).children.forEach((child) => {
    const classString = csstree.generate(child);
    const sweatmapString = this.sweatmap.set(classString);
    const updatedClassString = classString.replace(
      this.placeholder,
      sweatmapString
    );

    console.log({classString, sweatmapString, updatedClassString});
  });
}
