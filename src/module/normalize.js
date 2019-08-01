const CSSNano = require('cssnano');

module.exports = function Normalize(cssObj) {
  return CSSNano.process(
    cssObj.toString(),
    {
      from: 'undefined'
    },
    { //CSS Nano Config -> http://cssnano.co/optimisations/
      preset: [
        'advanced',
        {
          autoprefixer: false,
          cssDeclarationSorter: true,

          calc: true,
          colormin: true,
          convertValues: true,
          discardComments: true,
          discardDuplicates: true,
          discardEmpty: true,
          discardOverridden: true,
          discardUnused: false,
          mergeIdents: false,
          mergeLonghand: true,
          mergeRules: true,
          minifyFontValues: true,
          minifyGradients: true,
          minifyParams: true,
          minifySelectors: true,
          normalizeDisplayValues: true,
          normalizePositions: true,
          normalizeRepeatStyle: true,
          normalizeString: true,
          normalizeTimingFunctions: true,
          normalizeUnicode: true,
          normalizeUrl: true,
          normalizeWhitespace: true,
          orderedValues: true,
          reduceIdents: false,
          reduceInitial: false,
          reduceTransforms: true,
          svgo: false,
          uniqueSelectors: true,
          zindex: false
        }
      ]
    }
  );
};
