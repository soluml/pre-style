import type {OutputConfig, ClassifyResponse} from 'global';
import path from 'path';
import fs from 'fs';
import util from 'util';
import chalk from 'chalk';
import glob from 'fast-glob';
import ATP from 'at-rule-packer';
import PreStyle from '../src';
import Noramlize from '../src/normalize';
import defaultConfig from './utils/defaultConfig';

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

export default async function Process(
  config: OutputConfig,
  destination: string,
  sourceDirectories: string[]
): Promise<void> {
  /* eslint-disable no-param-reassign */
  config = {
    ...defaultConfig,
    ...config,
    cache: Infinity, // Since we're starting fresh every process
  };
  /* eslint-enable no-param-reassign */

  // Clear Cache
  await PreStyle.clearCache();

  const files = await glob(sourceDirectories);
  const PS = new PreStyle(config);

  if (!files.length) {
    throw new Error(
      `No files were found using these fast-glob patterns: ${JSON.stringify(
        sourceDirectories
      )}.`
    );
  }

  // Create destination directory
  await fs.promises.mkdir(destination, {recursive: true});

  const [writes, fullcss] = (
    await Promise.all(
      (
        await Promise.all(
          files.map((file) => {
            console.log(`Processing file ${chalk.cyan(file)}`);
            return readFile(file).then((fileContents) => ({
              file,
              fileContents,
            }));
          })
        )
      )
        .map(({file, fileContents}) => {
          const fc = fileContents.toString();
          const mbs: Promise<ClassifyResponse & {match: string}>[] = [];

          config.namespaces?.forEach((ns) => {
            const re = new RegExp(`${ns}\`\\s*([\\s\\S]+?)\\s*\``, 'gmi');
            let matches;

            while ((matches = re.exec(fc)) !== null) {
              const {0: match, 1: css} = matches;

              mbs.push(PS.process(css).then((data) => ({match, ...data})));
            }
          });

          return Promise.all(mbs).then((changes) => ({
            file,
            fileContents: fc,
            changes,
          }));
        })
        .flat()
        .filter((f) => f)
    )
  ).reduce(
    (acc: [Promise<void>[], string], {file, fileContents, changes}) => {
      const fileDest = path.resolve(destination, path.basename(file));
      let newFileContents = fileContents;

      changes.forEach(({match, classNames, css}) => {
        newFileContents = newFileContents.replace(
          match,
          `${config.quotes}${Object.values(classNames).join(' ')}${
            config.quotes
          }`
        );

        acc[1] += css;
      });

      acc[0].push(
        writeFile(fileDest, newFileContents).then(() => {
          console.log(
            `${chalk.green('File')} ${chalk.cyan(`${fileDest}`)} ${chalk.green(
              'created.'
            )}`
          );
        })
      );

      return acc;
    },
    [[], '']
  );

  const cssFileDest = path.resolve(destination, config.filename as string);
  const finalizedCss = Noramlize(ATP(fullcss));

  await Promise.all(
    writes.concat([
      writeFile(path.resolve(cssFileDest), finalizedCss).then(() => {
        console.log(
          `${chalk.green('File')} ${chalk.cyan(`${cssFileDest}`)} ${chalk.green(
            'created.'
          )}`
        );
      }),
    ])
  );
}
