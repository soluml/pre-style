import type {BabelConfig, ClassifyResponse} from 'global';
import type {TaggedTemplateExpression, ImportDeclaration} from '@babel/types';
import type {NodePath} from '@babel/traverse';
import path from 'path';
import {spawnSync} from 'child_process';
import ATP from 'at-rule-packer';
import defaultConfig from '../bin/utils/defaultConfig';
import PreStyle from '../src';
import Noramlize from '../src/normalize';

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
  let blocks: NodePath<TaggedTemplateExpression>[];
  const t = babel.types;
  const classNames = {};

  const cssFileDest = path.resolve(
    config.destination as string,
    config.filename as string
  );

  return {
    pre() {
      // Reset Namespaces
      namespaces = [...(config.namespaces || [])];
      blocks = [];
    },
    post() {
      if (!blocks.length) return;

      const data = spawnSync('node', [path.resolve(__dirname, 'child.js')], {
        timeout: 60000,
        // stdio: 'inherit', // <- For debugging ... will prevent stdout
        cwd: process.cwd(),
        env: {
          ...process.env,
          ...{
            cssblocks: JSON.stringify(
              blocks.map((np) => np.node.quasi.quasis[0].value.raw)
            ),
            classNames: JSON.stringify(classNames),
            config: JSON.stringify(config),
          },
        },
      });

      const err = data.stderr?.toString();

      if (err) throw new Error(err);

      const css = JSON.parse(data.stdout?.toString()).reduce(
        (acc: string, cf: ClassifyResponse, i: number) => {
          blocks[i].replaceWith(
            t.StringLiteral(PreStyle.getClassString(cf.classNames))
          );

          Object.assign(classNames, cf.classNames);

          return acc + cf.css;
        },
        ''
      );

      console.log({css: Noramlize(ATP(css))});
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
        if (
          // Namespaces are case insensitive
          namespaces!.some(
            (ns) =>
              ns.toLowerCase() === (nodepath.node.tag as any).name.toLowerCase()
          )
        ) {
          blocks.push(nodepath);
        }
      },
    },
  };
}
