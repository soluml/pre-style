const CSSNano = require('cssnano');

module.exports = function Minify(cssObj, PLACEHOLDER) {
  return Promise.all([
    CSSNano.process(
      cssObj.toString(),
      { //CSS Nano Config -> http://cssnano.co/optimisations/
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
      }
    ),
    PLACEHOLDER
  ]);
};
