/* eslint no-console: 0, no-empty: 1 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const util = require('util');

module.exports = function writeFiles(data, config, hasWritten) {
  const { css, classNames } = data;

  try {
    fs.mkdirSync(path.resolve(config.destination));
  } catch (e) {}

  fs.writeFileSync(path.resolve(config.destination, config.outputFile), css);
  if (!hasWritten) console.log(`${chalk.green('File')} ${chalk.cyan(path.basename(config.outputFile))} ${chalk.green('created.')}`);

  fs.writeFileSync(path.resolve(config.destination, `${config.outputFile}.classNames.js`), `module.exports = ${util.inspect(classNames)};`);
  if (!hasWritten) console.log(`${chalk.green('File')} ${chalk.cyan(path.basename(`${config.outputFile}.classNames.js`))} ${chalk.green('created.')}`);
};
