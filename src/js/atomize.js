const Gonzales = require('gonzales');

module.exports = function Atomize(cssObj, PLACEHOLDER) {
  const CSS = cssObj.css;
  const AST = Gonzales.srcToCSSP(CSS);

  console.log(PLACEHOLDER);
  console.log(CSS);
  console.log('');
  console.log( Gonzales.csspToTree(AST) );
};
