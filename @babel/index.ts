import type {BabelConfig} from 'global';
import type {TaggedTemplateExpression, ImportDeclaration} from '@babel/types';
import type {NodePath} from '@babel/traverse';
import path from 'path';
import defaultConfig from '../bin/utils/defaultConfig';
import PreStyle from '../src';

const projectName = 'pre-style';

export default function BabelPluginPreStyle(babel: any, config: BabelConfig) {
  /* eslint-disable no-param-reassign */
  config = {
    destination: PreStyle.cacheDirName(''),
    ...defaultConfig,
    ...config,
  };
  /* eslint-enable no-param-reassign */

  let namespaces: string[];
  const t = babel.types;
  const PS = new PreStyle(config);
  const cssFileDest = path.resolve(
    config.destination as string,
    config.filename as string
  );

  function callPreStyle(
    nodepath: NodePath<TaggedTemplateExpression>,
    cssblock: string
  ) {
    console.log({cssblock});
  }

  return {
    pre() {
      // Reset Namespaces between files
      namespaces = [...(config.namespaces || [])];
      // console.log('PRE');
    },
    post() {
      // console.log('POST');
    },
    visitor: {
      ImportDeclaration(nodepath: NodePath<ImportDeclaration>) {
        const {value: moduleName} = nodepath.node.source;

        if (moduleName !== projectName) return;

        const localSpecifier = nodepath.node.specifiers.find(
          (specifier) => !!specifier.local
        );

        const newNameSpace = localSpecifier?.local.name;

        if (newNameSpace) namespaces!.push(newNameSpace);

        if (config.importAsCSS) {
          const importNode = babel.template.statement
            .ast`import "${cssFileDest}";`;

          nodepath.replaceWith(importNode);
        } else {
          nodepath.remove();
        }
      },
      TaggedTemplateExpression(nodepath: NodePath<TaggedTemplateExpression>) {
        // Namespaces are case insensitive
        if (
          !namespaces!.some(
            (ns) =>
              ns.toLowerCase() === (nodepath.node.tag as any).name.toLowerCase()
          )
        ) {
          return;
        }

        callPreStyle(nodepath, nodepath.node.quasi.quasis[0].value.raw);
      },
    },
  };
}
