const fs = require('fs');
const CSSNano = require('cssnano');
const Gonzales = require('gonzales');
//const SweatMap = require('sweatmap');
const config = require('../../PreStyleConfig');

//Process our syntax
const Adapter =
  typeof config.adapter == 'function'
  ? config.adapter
  : require(config.adapter);

const CSSNanoConfig = {
  autoprefixer: false,
  calc: true,
  colormin: true,
  convertValues: true,
  core: true,
  discardDuplicates: true,
  discardEmpty: true,
  discardOverridden: true,
  discardUnused: false,
  filterOptimiser: true,
  functionOptimiser: true,
  mergeIdents: false,
  mergeLonghand: true,
  mergeRules: false,
  minifyFontValues: true,
  minifyGradients: true,
  minifyParams: true,
  minifySelectors: true,
  normalizeCharset: false,
  normalizeString: true,
  normalizeUnicode: true,
  normalizeUrl: true,
  orderedValues: true,
  reduceBackgroundRepeat: true,
  reduceDisplayValues: true,
  reduceIdents: false,
  reduceInitial: false,
  reducePositions: true,
  reduceTimingFunctions: true,
  reduceTransforms: true,
  uniqueSelectors: true,
  zindex: false,
};

module.exports = function PreStyle(cssstr) {
  //Get all of the prependedFiles and string them together
  const prestr = config.prependedFiles.map(fn => fs.readFileSync(fn).toString()).join('');

  //Use the adapater (by default Node-Sass) to process the statement
  Adapter(`${prestr} .PLACEHOLDER { ${cssstr.toString()} }`)

    //Next let's process it via CSS Nano
    .then(cssObj => CSSNano.process(cssObj.toString(), CSSNanoConfig))

    //Then let's run our CSS through the AST
    .then((result) => {
      const AST = Gonzales.srcToCSSP(result.css);

      console.log( result.css );
      console.log('');
      console.log( Gonzales.csspToTree(AST) );
    })

    .catch(console.error);
};
