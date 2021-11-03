import type {Config} from 'global';
import type * as postcssType from 'postcss';
import postcss from 'postcss';
import defaultConfig from '../bin/utils/defaultConfig';
import PreStyle from '../src';

module.exports = (config: Config): postcssType.Plugin => {
  const PS = new PreStyle({
    ...defaultConfig,
    ...config,
  });

  async function doRule(rule: postcssType.Node) {
    if (rule.parent?.type !== 'root') return;

    const css = rule.toString();
    const {classNames} = await PS.process(css);

    console.log(rule.type, {css, classNames});
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
