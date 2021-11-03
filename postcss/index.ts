import type {Config} from 'global';
import type * as postcssType from 'postcss';
import postcss from 'postcss';
import parser from 'postcss-selector-parser';
import defaultConfig from '../bin/utils/defaultConfig';
import PreStyle from '../src';

module.exports = (config: Config): postcssType.Plugin => {
  const PS = new PreStyle({
    ...defaultConfig,
    ...config,
  });
  const placceholderSelectorLength = PS.placeholder.length + 1;

  const selectorParser = parser((selectors) => {
    selectors.walk((selector) => {
      // Remove the Placeholder class and the succeeding child combinator
      if (selector.sourceIndex < placceholderSelectorLength) {
        selector.remove();
      } else if (
        selector.sourceIndex === placceholderSelectorLength + 1 &&
        selector.type === 'class'
      ) {
        selector.replaceWith(parser.className({value: 'GET_NEW_ATOMIC_CLASS'}));
      }
    });

    return selectors;
  });

  async function doRule(rule: postcssType.Node) {
    if (rule.parent?.type !== 'root') return;

    const css = rule.toString();
    const {classNames} = await PS.process(css);

    const updates = Object.keys(classNames).map((cls) => {
      const tempRoot = postcss.parse(cls);

      tempRoot.walkRules((nr) => {
        nr.replaceWith(
          postcss.rule({
            selector: selectorParser.processSync(nr.selectors[0], {
              lossless: false,
            }),
            nodes: nr.nodes,
          })
        );
      });

      console.log('ASDASD', {
        before: cls,
        temp: tempRoot.toString(),
      });

      return cls;
    });

    // console.log(rule.type, {css, classNames});
  }

  return {
    postcssPlugin: 'pre-style',
    AtRule: doRule,
    Rule: doRule,
    async OnceExit(css, {result}) {
      // Calls once per file, since every file has single Root

      // console.log({css, result});
      console.log('EXIT');
    },
  };
};

module.exports.postcss = true;
