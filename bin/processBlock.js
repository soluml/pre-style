/* eslint no-console: 0, no-cond-assign: 0 */

const path = require('path');
const spawnSync = require('child_process').spawnSync;

module.exports = function processFile(css, config, classNames) {
  const existing_strings = JSON.stringify(classNames);
  const data = spawnSync(
    'node',
    [path.resolve(__dirname, 'child.js')],
    {
      timeout: 60000,
      //stdio: 'inherit', //<- For debugging
      env: Object.assign({}, process.env, { css, config: JSON.stringify(config), existing_strings })
    }
  );

  if (data.stderr) throw new Error(data.stderr.toString());
  else return JSON.parse(data.stdout.toString());
};
