const Sass = require('node-sass');
const SweatMap = require('sweatmap');
const config = require('../../PreStyleConfig');

module.exports = function PreStyle(cssstr) {
  let prestr = '';
  Object.keys(config.vars).forEach((v) => { prestr += `$${v}: ${config.vars[v]};\n`; });

  console.log('PRE', prestr + cssstr.toString());

  const sassObj = Sass.renderSync({
    data: prestr + cssstr.toString(),
    outputStyle: 'compressed',
  });

  return sassObj.css.toString();
};
