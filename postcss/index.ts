import type {Config} from 'global';
import type * as postcssType from 'postcss';
import postcss from 'postcss';
import parser from 'postcss-selector-parser';
import defaultConfig from '../bin/utils/defaultConfig';
import PreStyle from '../src';

const replacedSelectorPlaceholder = '▚';

module.exports = (config: Config): postcssType.Plugin => {
  const PS = new PreStyle({
    ...defaultConfig,
    ...config,
  });

  async function processRule(rule: postcssType.Rule) {
    const topRule = (function getParent(r: postcssType.Rule): postcssType.Rule {
      if (r.parent?.type === 'root') {
        return r;
      }
      return getParent(r.parent as postcssType.Rule);
    })(rule);
    // const isSameAsTopRule = rule.toString() === topRule.toString();
    let jsonKey = '';

    // Set jsonKey and update selector
    /* eslint-disable no-param-reassign */
    rule.selector = parser((selectors) => {
      selectors.walkClasses((selector) => {
        if (!selector.sourceIndex) {
          jsonKey = selector.value;
          selector.replaceWith(
            parser.className({value: replacedSelectorPlaceholder})
          );
        }
      });
    }).processSync(rule.selector);
    rule.selectors = [rule.selector];
    /* eslint-enable no-param-reassign */

    // Get classNames
    // let classNames = {};

    // for (let i = 0, ln = rule.nodes.length; i < ln; i++) {
    //   const property = rule.nodes[i].toString();
    //   const block = processedSelector
    //     ? `${processedSelector}{${property}}`.trim()
    //     : property;
    //   const psobj = await PS.process(block);

    //   classNames = {
    //     ...classNames,
    //     ...psobj.classNames,
    //   };
    // }

    console.log({
      // isSameAsTopRule,
      jsonKey,
      topRuleCss: topRule.toString(),
      // classNames,
    });
    console.log('====================');
  }

  return {
    postcssPlugin: 'pre-style',

    async Rule(rule) {
      // Break conjoined selectors
      if (rule.selectors.length > 1) {
        rule.selectors.forEach((sel) => {
          const clone = rule.clone();

          clone.selector = sel;
          clone.selectors = [clone.selector];

          rule.before(clone);
        });

        rule.remove();
        return;
      }

      // Only handle rules that start with a class
      if (!rule.selector.startsWith('.')) return;

      await processRule.call(this, rule);
    },

    async OnceExit(css, {result}) {
      // Calls once per file, since every file has single Root

      // console.log({css, result});
      console.log('EXIT');
    },
  };
};

module.exports.postcss = true;
