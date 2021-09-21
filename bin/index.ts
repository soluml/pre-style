#!/usr/bin/env node

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
  .parse(process.argv);

console.log(program.opts());
