/* eslint no-console: 0, no-empty: 1 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const util = require('util');
const mkdirp = require('mkdirp');

module.exports = function writeFiles(data, config, hasWritten) {
  const { css, classNames } = data;
  const pathName = path.resolve(config.destination, config.outputFile);

  try {
    mkdirp.sync(path.dirname(pathName));
  } catch (e) {}

  fs.writeFileSync(pathName, css);
  if (!hasWritten) console.log(`${chalk.green('File')} ${chalk.cyan(path.basename(config.outputFile))} ${chalk.green('created.')}`);

  fs.writeFileSync(`${pathName}.classNames.js`, `module.exports = ${util.inspect(classNames)};`);
  if (!hasWritten) console.log(`${chalk.green('File')} ${chalk.cyan(path.basename(`${config.outputFile}.classNames.js`))} ${chalk.green('created.')}`);
};
