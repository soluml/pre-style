const CSSO = require('csso');
const memoize = require('lodash/memoize');

const fn = memoize((cssStr) =>
  CSSO.minify(cssStr, { restructure: true })
);

module.exports = function Normalize(cssObj) {
  return Promise.resolve(
    fn(cssObj.toString())
  );
};