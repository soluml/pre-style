#!/usr/bin/env node

/* eslint-disable no-console */

// import fs from 'fs';
import path from 'path';
import {Command} from 'commander';
import chalk from 'chalk';
import type {OutputConfig, Config} from 'global';
import Quotes from './quotes';
import processFiles from './process';

export const defaultConfig = {
  quotes: Quotes.Double,
  filename: 'prestyle.css',
  namespaces: ['prestyle', 'styled', 'css'],
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
  const {destination, ...options} = program.opts();
  const config: OutputConfig = {
    ...defaultConfig,
    ...((options.config
      ? require(path.resolve(options.config))
      : {}) as Config),
  };

  if (!destination) {
    throw new Error(
      `You ${chalk.bold('MUST')} specify a destination with ${chalk.italic(
        '-d'
      )} or ${chalk.italic('--destination')}.`
    );
  }

  const sourceDirectories = [...new Set(program.args)];

  if (!sourceDirectories.length) {
    throw new Error(`No source files or folders were specified.`);
  }

  processFiles(config, destination, sourceDirectories);
} catch (e) {
  console.log(chalk.underline.red('Error:'));
  console.log(e);
}
