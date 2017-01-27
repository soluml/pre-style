const Gonzales = require('gonzales');
const get = require('lodash/get');

module.exports = function Atomize(cssObj, PLACEHOLDER) {
  const CSS = cssObj.css;
  const AST = Gonzales.srcToCSSP(CSS);
  let ASTChanges;

  function splitOutDelim(token, ind) {
    if (typeof token === 'object') {
      let i = 0;

      while (token[i]) {
        splitOutDelim(token[i], ind.concat([i]));
        i++;
      }
    } else if (token === 'delim') {
      ASTChanges.push(ind.slice(0, -1));
    }
  }

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
    //Grab all pieces but last (@ declaration)
    const muler = atruler.slice(0, -1);

    //The rules inside of the @ declaration
    const atrulers = atruler.slice(-1)[0];

    //Create array of atrulers for every ruleset inside
    const newAtrulers = atrulers.slice(1).map(ruleset => muler.concat([['atrulers', ruleset]]));

    return newAtrulers;
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

  function processDelim(changes) {
    changes.reverse().forEach((changeArr) => {
      const orig = get(AST, changeArr.slice(0, -3).map(x => `[${x}]`).join(''), AST);
      const refBase = get(AST, changeArr.slice(0, -2).map(x => `[${x}]`).join(''), null).concat([]);
      const refBase2 = refBase.concat([]);
      const base = refBase[1].concat([]);
      const lastInd = changeArr.pop();
      const selectorString = base.shift();

      refBase[1] = [selectorString, ...base.slice(0, lastInd - 1)];
      refBase2[1] = [selectorString, ...base.slice(lastInd)];

      orig.splice(changeArr.slice(-2)[0], 1, refBase, refBase2);
    });
  }

  function processDeadRules(changes) {
    changes.reverse().forEach((change) => {
      const ruleset = get(AST, change.ind.map(x => `[${x}]`).join(''), null);
      const selector = Gonzales.csspToSrc(ruleset[1][1]);

      if (!~selector.indexOf(PLACEHOLDER)) {
        //You have been deemed.... unworthy...
        const orig = get(AST, change.ind.slice(0, -1).map(x => `[${x}]`).join(''), AST);

        //Remove the dead ruleset
        orig.splice(change.ind.pop(), 1);
      }
    });
  }

  //Find and process delimited selectors and break them into their own rulesets
  ASTChanges = [];
  AST.map((token, i) => splitOutDelim(token, [i]));
  processDelim(ASTChanges);

  //Find and process ruleset changes that are needed for the AST
  ASTChanges = [];
  AST.map((token, i) => seekOutToken('ruleset', token, [i]));
  processChanges(ASTChanges);

  //Find and process ruleset changes that are needed for the AST
  ASTChanges = [];
  AST.map((token, i) => seekOutToken('atruler', token, [i]));
  processChanges(ASTChanges);

  //Eliminate selectors without a PLACEHOLDER class in them
  ASTChanges = [];
  AST.map((token, i) => seekOutToken('ruleset', token, [i]));
  processDeadRules(ASTChanges);

  //Return Atomized CSS and Placeholder
  return Promise.all([{ css: Gonzales.csspToSrc(AST) }, PLACEHOLDER]);
};
