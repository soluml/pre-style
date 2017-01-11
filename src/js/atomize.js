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

    /*
    //Testing Stuff
    console.log(Gonzales.csspToSrc(ruleset));
    console.log('---');
    newRulesets.forEach(newRuleSet => console.log(Gonzales.csspToSrc(newRuleSet)));
    console.log('***');
    */

    return newRulesets;
  }

  function seekOutRuleset(token, ind) {
    if (token) {
      let i = 0;

      while (token[i]) {
        if (token[i] == 'ruleset') ASTChanges.push({ ind, rules: processRuleset(token) });
        else seekOutRuleset(token[i + 1], ind.concat([i + 1]));
        i++;
      }
    }
  }

  //Find changes that are needed for the AST
  AST.map((token, i) => seekOutRuleset(token, [i]));

  //Make those changes to newAST
  ASTChanges.reverse().forEach((change) => {
    const spi = change.ind.pop(); //Last Index is where we'll actually be making the edits
    let ASTArr = AST;

    //Get nested array
    while (change.ind.length) ASTArr = ASTArr[change.ind.shift()];

    //Make changes to AST
    ASTArr.splice(spi, 1, ...change.rules);
  });

  console.log('+++');
  console.log(Gonzales.csspToTree(AST));
  console.log('');
  console.log(Gonzales.csspToSrc(AST));
};
