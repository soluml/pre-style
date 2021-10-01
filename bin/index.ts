#!/usr/bin/env node

/* eslint-disable no-console */

// import fs from 'fs';
import path from 'path';
import {Command} from 'commander';
import chalk from 'chalk';
import type {OutputConfig, Config} from 'global';
import Quotes from './quotes';

export const defaultConfig = {
  quotes: Quotes.Double,
  filename: 'prestyle.css',
};

const program = new Command();

program
  .version(require(path.resolve(process.cwd(), 'package.json')).version)
  .option('-c, --config [file]', 'source config file')
  .option(
    '-d, --destination <dir>',
    'directory to put files processed by PreStyle'
  )
  .parse(process.argv);

try {
  const options = program.opts();
  const configFileLocation = options.config.trim();
  const config: OutputConfig = {
    ...defaultConfig,
    ...((configFileLocation
      ? require(path.resolve(configFileLocation))
      : {}) as Config),
  };

  if (!options.destination) {
    throw new Error(
      `You ${chalk.bold('MUST')} specify a destination with ${chalk.italic(
        '-d'
      )} or ${chalk.italic('--destination')}.`
    );
  }

  console.log({config});
} catch (e) {
  console.log(chalk.underline.red('Error:'));
  console.log(e);
}
