const fs = require('fs');

function builtInAdapter(data) {
  try {
    const Sass = require('node-sass');
    return Promise.resolve(Sass.renderSync({ data, outputStyle: 'compressed' }).css);
  } catch (e) {
    return Promise.reject(e);
  }
}

module.exports = function Adapter(config, cssStr, PLACEHOLDER) {
  //Get all of the prependedFiles and string them together
  const preStr = (config.prependedFiles || []).map(fn => fs.readFileSync(fn).toString()).join('');

  //Pass the CSS string to the adapter
  const adapter = config.adapter ? require(config.adapter) : builtInAdapter;
  return adapter(`${preStr} .${PLACEHOLDER} { ${cssStr.toString()} }`);
};
