/* eslint no-console: 0, no-cond-assign: 0 */

const fs = require('fs');
const chalk = require('chalk');
const PreStyle = require('../src/module/prestyle');

module.exports = function processFile(file, config) {
  console.log(`Processing file ${chalk.cyan(file)}`);
  const fileContents = fs.readFileSync(file, { encoding: 'utf-8' });
  const blocks = [];

  //Initially, look for PreStyle`...` blocks
  let re = /PreStyle`\s*([\s\S]+?)\s*`/gm;
  let matches;

  while ((matches = re.exec(fileContents)) !== null) {
    const { 0: full, 1: css } = matches;
    blocks.push({ full, css });
  }

  //Then look for <PreStyle>...</PreStyle> blocks
  re = /<PreStyle>\s*([\s\S]+?)\s*<\/PreStyle>/gm;

  while ((matches = re.exec(fileContents)) !== null) {
    const { 0: full, 1: css } = matches;
    blocks.push({ full, css });
  }

  return new Promise((resolve, reject) => {
    Promise.all(blocks.map(block => PreStyle(block.css, config)))
      .then((data) => {
        let contents = fileContents;
        let css = '';
        let classNames = '';

        data.forEach((ps, i) => {
          css += ps.css;
          classNames += ` ${ps.classNames}`;
          contents = contents.replace(blocks[i].full, `"${ps.classNames}"`);
        });

        classNames = classNames.trim();

        resolve({ path: file, contents, css, classNames });
      }, reject);
  });
};
