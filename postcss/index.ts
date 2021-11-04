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

  const newRules = new Map<string, postcssType.Rule[]>();

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
    const {classNames} = await PS.process(topRule.toString());

    console.log({
      // isSameAsTopRule,
      // SOMETHING: rule.selector,
      jsonKey,
      topRuleCss: topRule.toString(),
      classNames,
    });
    console.log('====================');
  }

  return {
    postcssPlugin: 'pre-style',

    async AtRule(atrule) {
      // Break conjoined selectors within @at-rule
      if (atrule.nodes.length > 1) {
        atrule.nodes.forEach((rule) => {
          const clone = atrule.clone();
          const ruleClone = rule.clone();

          clone.nodes = [];

          atrule.before(clone);
          clone.append(ruleClone);
        });

        atrule.remove();
      }
    },

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
