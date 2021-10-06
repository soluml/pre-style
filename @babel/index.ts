import type {OutputConfig} from 'global';
import defaultConfig from '../bin/utils/defaultConfig';
import PreStyle from '../src';

export default function BabelPluginPreStyle(babel: any, config: OutputConfig) {
  /* eslint-disable no-param-reassign */
  config = {...defaultConfig, ...config};
  /* eslint-enable no-param-reassign */

  const t = babel.types;
  const PS = new PreStyle(config);

  function callPreStyle(path: any, cssblock: string) {
    console.log({cssblock});
  }

  return {
    pre() {
      console.log('PRE', {config});
    },
    post() {
      console.log('POST');
    },
    visitor: {
      ImportDeclaration(path: any) {
        // console.log('Import', path);
      },
      TaggedTemplateExpression(path: any) {
        // Namespaces are case insensitive
        if (
          !config.namespaces!.some(
            (ns) => ns.toLowerCase() == path.node.tag.name.toLowerCase()
          )
        ) {
          return;
        }

        callPreStyle(path, path.node.quasi.quasis[0].value.raw);
      },
    },
  };
}
