const Sass = require('node-sass');
const SassJsonImporter = require('node-sass-json-importer');
const SweatMap = require('sweatmap');

module.exports = function PreStyle(cssstr) {
  const sassObj = Sass.renderSync({
    data: cssstr[0],
    importer: SassJsonImporter,
    outputStyle: 'compressed',
  });

  return sassObj.css.toString();
};
