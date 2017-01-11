const Gonzales = require('gonzales');

module.exports = function Sweat(cssObj, PLACEHOLDER, MAP) {
  const CSS = cssObj.css;
  const AST = Gonzales.srcToCSSP(CSS);

  console.log(MAP.size());
  console.log(CSS);
  console.log(Gonzales.csspToTree(AST));
};
