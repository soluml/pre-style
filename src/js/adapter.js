const fs = require('fs');

module.exports = function Adapter(config, cssStr) {
  //Get all of the prependedFiles and string them together
  const preStr = config.prependedFiles.map(fn => fs.readFileSync(fn).toString()).join('');

  //Determine PLACEHOLDER class
  let PLACEHOLDER = 'PLACEHOLDER';
  while (`${preStr} ${cssStr.toString()}`.match(new RegExp(PLACEHOLDER, 'g'))) PLACEHOLDER = `PLACEHOLDER_${Date.now()}`;

  //Pass the CSS string to the adapter
  return Promise.all([
    config.adapter(`${preStr} .${PLACEHOLDER} { ${cssStr.toString()} }`),
    PLACEHOLDER
  ]);
};
