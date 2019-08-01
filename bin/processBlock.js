/* eslint no-console: 0, no-cond-assign: 0 */

const path = require('path');
const { spawnSync } = require('child_process');

module.exports = function processBlock(css, config, classNames) {
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
  const err = data.stderr.toString();

  if (err) throw new Error(err);
  return JSON.parse(data.stdout.toString());
};
