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
  const json: {[x: string]: Set<string>} = {};
  const updates: [postcssType.Rule, postcssType.Root][] = [];

  async function processRule(rule: postcssType.Rule) {
    /* eslint-disable no-param-reassign */
    const topRule = (function getParent(r: postcssType.Rule): postcssType.Rule {
      if (r.parent?.type === 'root') {
        return r;
      }
      return getParent(r.parent as postcssType.Rule);
    })(rule);

    // const isSameAsTopRule = rule.toString() === topRule.toString();
    let jsonKey = '';

    // Set jsonKey and update selector
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

    // Get classNames
    const psProcessObj = await PS.process(topRule.toString());

    // Add set (if needed)
    if (!json[jsonKey]) {
      json[jsonKey] = new Set();
    }

    // Update set
    Object.values(psProcessObj.classNames).forEach((c) => json[jsonKey].add(c));

    const newCss = psProcessObj.css.replaceAll(
      ` .${replacedSelectorPlaceholder}`,
      ''
    );
    const newRules = postcss.parse(newCss);

    updates.push([topRule, newRules]);
    /* eslint-enable no-param-reassign */
  }

  return {
    postcssPlugin: 'pre-style',

    async AtRule(atrule) {
      if ((atrule as any).PS_NO_PROCESS) return;

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
      if ((rule as any).PS_NO_PROCESS) return;

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
      // console.log(css, result);

      updates.forEach(([oldRule, newRootRule]) => {
        oldRule.replaceWith(newRootRule);
      });

      console.log('EXIT', {json});
    },
  };
};

module.exports.postcss = true;
