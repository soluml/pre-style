import type {OutputConfig, BabelConfig} from 'global';
import type {TaggedTemplateExpression, ImportDeclaration} from '@babel/types';
import type {NodePath} from '@babel/traverse';
import defaultConfig from '../bin/utils/defaultConfig';
import PreStyle from '../src';

const projectName = 'pre-style';

export default function BabelPluginPreStyle(babel: any, config: BabelConfig) {
  /* eslint-disable no-param-reassign */
  config = {...defaultConfig, ...config};
  /* eslint-enable no-param-reassign */

  let {namespaces = []} = config;
  const t = babel.types;
  const PS = new PreStyle(config);

  function callPreStyle(
    path: NodePath<TaggedTemplateExpression>,
    cssblock: string
  ) {
    console.log({cssblock});
  }

  return {
    pre() {
      // console.log('PRE');
    },
    post() {
      // Reset Namespaces between files
      namespaces = config.namespaces || [];

      // console.log('POST');
    },
    visitor: {
      ImportDeclaration(path: NodePath<ImportDeclaration>) {
        const {value: moduleName} = path.node.source;

        if (moduleName !== projectName) return;

        const localSpecifier = path.node.specifiers.find(
          (specifier) => !!specifier.local
        );

        const newNameSpace = localSpecifier?.local.name;

        if (newNameSpace) namespaces!.push(newNameSpace);

        if (config.importAsCSS) {
          console.log('REPLACE WITH CSS');
        } else {
          console.log('REPLACE WITH NOTHING');
        }

        // console.log(
        //   'Import',
        //   // Object.keys(path.node),
        //   JSON.stringify(path.node, null, 2)
        // );
      },
      TaggedTemplateExpression(path: NodePath<TaggedTemplateExpression>) {
        // Namespaces are case insensitive
        if (
          !namespaces!.some(
            (ns) =>
              ns.toLowerCase() === (path.node.tag as any).name.toLowerCase()
          )
        ) {
          return;
        }

        callPreStyle(path, path.node.quasi.quasis[0].value.raw);
      },
    },
  };
}
