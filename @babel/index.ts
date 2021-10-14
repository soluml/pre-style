import type {BabelConfig, ClassifyResponse} from 'global';
import type {TaggedTemplateExpression, ImportDeclaration} from '@babel/types';
import type {NodePath} from '@babel/traverse';
import path from 'path';
import fs from 'fs';
import {spawnSync} from 'child_process';
import chalk from 'chalk';
import ATP from 'at-rule-packer';
import defaultConfig from '../bin/utils/defaultConfig';
import PreStyle from '../src';
import Noramlize from '../src/normalize';

const projectName = 'pre-style';

export default function BabelPluginPreStyle(babel: any, config: BabelConfig) {
  const cacheDirName = PreStyle.cacheDirName('');

  /* eslint-disable no-param-reassign */
  config = {
    destination: cacheDirName,
    ...defaultConfig,
    ...config,
  };
  /* eslint-enable no-param-reassign */

  let namespaces: string[];
  let blocks: [NodePath<TaggedTemplateExpression>, string | undefined][];
  const t = babel.types;
  const jsxStyledPropName = t.identifier('p');
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
      let finalizedCss = '';

      if (blocks.length) {
        const data = spawnSync('node', [path.resolve(__dirname, 'child.js')], {
          timeout: 60000,
          // stdio: 'inherit', // <- For debugging ... will prevent stdout
          cwd: process.cwd(),
          env: {
            ...process.env,
            ...{
              cssblocks: JSON.stringify(
                blocks.map(([np]) => np.node.quasi.quasis[0].value.raw)
              ),
              config: JSON.stringify(config),
            },
          },
        });

        const err = data.stderr?.toString();

        if (err) throw new Error(err);

        const css = JSON.parse(data.stdout?.toString()).reduce(
          (acc: string, cf: ClassifyResponse, i: number) => {
            const [nodepath, componentName] = blocks[i];
            const classes = PreStyle.getClassString(cf.classNames);

            nodepath.replaceWith(
              componentName
                ? t.arrowFunctionExpression(
                    [jsxStyledPropName],
                    t.jsxElement(
                      t.jsxOpeningElement(
                        t.jsxIdentifier(componentName),
                        [
                          t.jsxSpreadAttribute(jsxStyledPropName),
                          t.jsxAttribute(
                            t.jsxIdentifier('className'),
                            t.jsxExpressionContainer(
                              t.binaryExpression(
                                '+',
                                t.StringLiteral(`${classes} `),
                                t.memberExpression(
                                  jsxStyledPropName,
                                  t.identifier('className')
                                )
                              )
                            )
                          ),
                        ],
                        true
                      ),
                      null,
                      [],
                      true
                    ),
                    false
                  )
                : t.StringLiteral(classes)
            );

            return acc + cf.css;
          },
          ''
        );

        finalizedCss = Noramlize(ATP(css));
      }

      fs.writeFileSync(cssFileDest, finalizedCss);

      console.log(
        `${chalk.green('File')} ${chalk.cyan(cssFileDest)} ${chalk.green(
          'created.'
        )}`
      );
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
      TaggedTemplateExpression: (
        nodepath: NodePath<TaggedTemplateExpression>
      ) => {
        let componentName;

        if (
          // Namespaces are case insensitive
          namespaces!.some((ns) => {
            const nsl = ns.toLowerCase();
            const tag = nodepath.node.tag as any;
            let name = tag.name?.toLowerCase();

            // If you use a TTE like this styled.div the above name will be undefined
            if (!name) {
              name = tag?.object?.name.toLowerCase();
              componentName = config.styled && tag?.property?.name;
            }

            return nsl === name;
          })
        ) {
          blocks.push([nodepath, componentName || undefined]);
        }
      },
    },
  };
}
