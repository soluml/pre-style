const Sass = require('node-sass');
const CSSNano = require('cssnano');
const Gonzales = require('gonzales');
const SweatMap = require('sweatmap');
const config = require('../../PreStyleConfig');

const CSSNanoConfig = {
  autoprefixer: false,
  calc: true,
  colormin: true,
  convertValues: true,
  core: true,
  discardDuplicates: true,
  discardEmpty: true,
  discardOverridden: true,
};

module.exports = function PreStyle(cssstr) {
  const prestr = '';
  const sassObj = Sass.renderSync({
    data: `${prestr} .PLACEHOLDER { ${cssstr.toString()} }`,
    outputStyle: 'compact',
  });

  //First, process CSS via CSS Nano Config
  CSSNano.process(sassObj.css.toString(), CSSNanoConfig)
    .then((result) => {
      const AST = Gonzales.srcToCSSP(result.css);

      console.log( result.css );
      console.log( Gonzales.csspToTree(AST) );
    });
};
