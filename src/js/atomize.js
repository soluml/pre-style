const Gonzales = require('gonzales');

module.exports = function Atomize(cssObj, PLACEHOLDER) {
  const CSS = cssObj.css;
  const AST = Gonzales.srcToCSSP(CSS);
  const ASTChanges = [];

  function processRuleset(ruleset) {
    //The selector should be used for every block declaration
    const selector = ruleset[1];

    //Block (ruleset[2]) contains all declarations for selector. In order to atomize, we need to create new rulesets for every block
    const declarations = ruleset[2].filter((token, i) => i % 2 === 1);

    //For every declaration, we need a selector, and a block in our new ruleset
    const newRulesets = declarations.map(declaration => ['ruleset', selector, ['block', declaration, ['decldelim']]]);

    return newRulesets;
  }

  function processAtruler(atruler) {
    console.log(atruler);
    return atruler;
  }

  function seekOutToken(name, token, ind) {
    if (token) {
      let i = 0;

      while (token[i]) {
        if (token[i] === name) ASTChanges.push({ ind, rules: (name === 'ruleset' ? processRuleset(token) : processAtruler(token)) });
        else seekOutToken(name, token[i + 1], ind.concat([i + 1]));
        i++;
      }
    }
  }

  function processChanges(changes) {
    changes.reverse().forEach((change) => {
      const spi = change.ind.pop(); //Last Index is where we'll actually be making the edits
      let ASTArr = AST;

      //Get nested array
      while (change.ind.length) ASTArr = ASTArr[change.ind.shift()];

      //Make changes to AST
      ASTArr.splice(spi, 1, ...change.rules);
    });
  }

  //Find and process ruleset changes that are needed for the AST
  AST.map((token, i) => seekOutToken('ruleset', token, [i]));
  processChanges(ASTChanges);


  //Return Atomized CSS and Placeholder
  return Promise.all([
    { css: Gonzales.csspToSrc(AST) },
    PLACEHOLDER
  ]);
};
