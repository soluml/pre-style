#!/usr/bin/env node

/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';
import {Command} from 'commander';
import chalk from 'chalk';

const program = new Command();

program
  .version(
    require(path.resolve(process.cwd(), 'package.json')).version //eslint-disable-line
  )
  .option('-c, --config [file]', 'source config file')
  .option('-o, --outputFile [file]', 'generated .css file')
  .option(
    '-d, --destination <dir>',
    'directory to put files processed by PreStyle'
  )
  .parse(process.argv);

try {
  //
} catch (e) {
  console.log(chalk.underline.red('Error:'));
  console.log(e);
}
