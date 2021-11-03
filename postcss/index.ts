import type {Config} from 'global';
import type * as postcss from 'postcss';
import defaultConfig from '../bin/utils/defaultConfig';
import PreStyle from '../src';

module.exports = (config: Config): postcss.Plugin => {
  const PS = new PreStyle({
    ...defaultConfig,
    ...config,
  });

  return {
    postcssPlugin: 'pre-style',
    async OnceExit(css, {result}) {
      // Calls once per file, since every file has single Root

      console.log({css, result});
    },
  };
};

module.exports.postcss = true;
