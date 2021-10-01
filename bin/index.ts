#!/usr/bin/env node

/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';
import {Command} from 'commander';
import chalk from 'chalk';
import Quotes from './quotes';

const program = new Command();

program
  .version(
    require(path.resolve(process.cwd(), 'package.json')).version //eslint-disable-line
  )
  .option('-c, --config [file]', 'source config file')
  .option('-o, --output [file]', 'generated .css file')
  .parse(process.argv);

try {
  const options = program.opts();
  const configFileLocation = options.config.trim();
  const config = {
    quotes: Quotes.Double,
    ...(configFileLocation
      ? require(path.resolve(configFileLocation)) // eslint-disable-line
      : {}),
  };

  console.log({config});

  // if (!config.outputFile) {
  //   throw new Error(
  //     `You ${chalk.bold('MUST')} specify an output file with ${chalk.italic(
  //       '-o'
  //     )}, ${chalk.italic('--outputFile')}, or via the config file.`
  //   );
  // }
  //
} catch (e) {
  console.log(chalk.underline.red('Error:'));
  console.log(e);
}
