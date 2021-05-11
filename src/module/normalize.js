const CSSO = require('csso');

module.exports = function Normalize(cssObj) {
  return Promise.resolve(CSSO.minify(
    cssObj.toString()
  ), {
    restructure: true
  });
};