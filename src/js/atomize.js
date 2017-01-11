const Gonzales = require('gonzales');

module.exports = function Atomize(cssObj, PLACEHOLDER) {
  const CSS = cssObj.css;
  const AST = Gonzales.srcToCSSP(CSS);

  function processRuleset(ruleset) {
    console.log(ruleset[0], Gonzales.csspToSrc(ruleset));
  }

  function seekOutRuleset(token) {
    if (token) {
      let i = 0;

      while (token[i]) {
        if (token[i] == 'ruleset') processRuleset(token);
        else seekOutRuleset(token[i + 1]);
        i++;
      }
    }
  }

  AST.forEach(seekOutRuleset);

  console.log('');
  console.log(CSS);
  console.log('');
  console.log( Gonzales.csspToTree(AST) );
};
