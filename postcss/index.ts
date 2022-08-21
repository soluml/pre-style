import type {Config} from 'global';
import type * as postcssType from 'postcss';
import postcss from 'postcss';
import parser from 'postcss-selector-parser';
import defaultConfig from '../bin/utils/defaultConfig';
import PreStyle from '../src';
import Normalize from '../src/normalize';
import saveJSON from './saveJSON';

const replacedSelectorPlaceholder = '▚';

// This plugin can assume the identity of `postcss-modules` to better integrate into existing workflows
enum Identity {
  PS = 'pre-style',
  PM = 'postcss-modules',
}

interface PostcssModules {
  getJSON?: typeof saveJSON;
  identity?: Identity.PM | Identity.PS;
  onlyTheseFiles?: RegExp;
}

module.exports = (
  config = {} as Config & PostcssModules
): postcssType.Plugin => {
  const postcssPlugin = config.identity || Identity.PS;
  const {onlyTheseFiles} = config;
  const PS = new PreStyle({
    ...defaultConfig,
    ...config,
  });
  const json: {[x: string]: Set<string>} = {};
  const updates: [postcssType.Rule, postcssType.Root][] = [];
  let skipFile = false;

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
    if (~rule.selector.indexOf(replacedSelectorPlaceholder)) {
      throw new Error(
        `The placeholder (${replacedSelectorPlaceholder}) was used in a css selector. Please replace all instances of this selector with another value!`
      );
    }

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
    postcssPlugin,

    async Once(root) {
      const filename = (root.source!.input.file as string).trim();

      if (!onlyTheseFiles || onlyTheseFiles.test(filename)) {
        skipFile = false;
      } else {
        skipFile = true;
      }
    },

    async AtRule(atrule) {
      if (skipFile) return;

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
      if (skipFile) return;

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

    async OnceExit(root, {result}) {
      if (skipFile) return;

      const getJSON = config.getJSON || saveJSON;

      // Perform Updates
      updates.forEach(([oldRule, newRootRule]) => {
        oldRule.replaceWith(newRootRule);
      });

      // Re-normalize to eliminate extra rules
      const newRoot = postcss.parse(Normalize(root.toString()));
      const exportTokens = Object.entries(json).reduce(
        (acc, [key, acs]) => ({
          ...acc,
          [key]: Array.from(acs).join(' '),
        }),
        {}
      );

      // `root.replaceWith(newRoot)` didn't seem to work here, so just swap out for the new nodes
      root.nodes = newRoot.nodes; // eslint-disable-line no-param-reassign

      result.messages.push({
        type: 'export',
        plugin: postcssPlugin,
        exportTokens,
      });

      await getJSON(
        root.source!.input.file as string,
        exportTokens,
        result.opts.to
      );
    },
  };
};

module.exports.postcss = true;
