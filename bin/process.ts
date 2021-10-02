import type {OutputConfig} from 'global';
import fs from 'fs';
import util from 'util';
import chalk from 'chalk';
import glob from 'fast-glob';

const readFile = util.promisify(fs.readFile);

interface MatchObject {
  full: string;
  css: string;
}

export default async function Process(
  config: OutputConfig,
  destination: string,
  sourceDirectories: string[]
) {
  const files = await glob(sourceDirectories);

  if (!files.length) {
    throw new Error(
      `No files were found using these fast-glob patterns: ${JSON.stringify(
        sourceDirectories
      )}.`
    );
  }

  const blocks = (
    await Promise.all(
      files.map((file) => {
        console.log(`Processing file ${chalk.cyan(file)}`);
        return readFile(file);
      })
    )
  )
    .map((fileContents) => {
      const fc = fileContents.toString();
      const mbs: MatchObject[] = [];

      config.namespaces?.forEach((ns) => {
        // Initially, look for PreStyle`...` type blocks
        const re = new RegExp(`${ns}\`\\s*([\\s\\S]+?)\\s*\``, 'gmi');

        let matches;

        while ((matches = re.exec(fc)) !== null) {
          const {0: full, 1: css} = matches;
          mbs.push({full, css});
        }
      });

      return mbs;
    })
    .flat()
    .filter((f) => f);

  console.log({blocks});
}
