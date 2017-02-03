const fs = require('fs');

module.exports = function Adapter(config, cssStr, PLACEHOLDER) {
  //Get all of the prependedFiles and string them together
  const preStr = config.prependedFiles.map(fn => fs.readFileSync(fn).toString()).join('');

  //Pass the CSS string to the adapter
  return config.adapter(`${preStr} .${PLACEHOLDER} { ${cssStr.toString()} }`);
};
