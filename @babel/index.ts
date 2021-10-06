import type {OutputConfig} from 'global';
import type {TaggedTemplateExpression, ImportDeclaration} from '@babel/types';
import type {NodePath} from '@babel/traverse';
import defaultConfig from '../bin/utils/defaultConfig';
import PreStyle from '../src';

const projectName = 'pre-style';

export default function BabelPluginPreStyle(babel: any, config: OutputConfig) {
  /* eslint-disable no-param-reassign */
  config = {...defaultConfig, ...config};
  /* eslint-enable no-param-reassign */

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
      console.log('PRE', {config});
    },
    post() {
      console.log('POST');
    },
    visitor: {
      ImportDeclaration(path: NodePath<ImportDeclaration>) {
        const {value: moduleName} = path.node.source;

        if (moduleName !== projectName) return;

        const localSpecifier = path.node.specifiers.find(
          (specifier) => !!specifier.local
        );

        const newNameSpace = localSpecifier?.local.name;

        if (newNameSpace) config.namespaces!.push(newNameSpace);

        // console.log(
        //   'Import',
        //   // Object.keys(path.node),
        //   JSON.stringify(path.node, null, 2)
        // );
      },
      TaggedTemplateExpression(path: NodePath<TaggedTemplateExpression>) {
        // Namespaces are case insensitive
        if (
          !config.namespaces!.some(
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
