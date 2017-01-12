const Gonzales = require('gonzales');

module.exports = function Sweat(cssObj, PLACEHOLDER, MAP) {
  const CSS = cssObj.css;
  const AST = Gonzales.srcToCSSP(CSS);
  const classes = AST.slice(1).map((token) => {
    //Stringify token and use as key for SweatMap
    const className = MAP.set(Gonzales.csspToSrc(token));

    //Process AST and replace PLACEHOLDER with new className
    token.forEach(function replacePlaceholder(subToken) {
      if (Array.isArray(subToken)) {
        for (let i = 0, ln = subToken.length; i < ln; i++) {
          if (Array.isArray(subToken[i])) replacePlaceholder(subToken[i]);
          else if (subToken[i] === 'ident' && subToken[i + 1] === PLACEHOLDER) {
            subToken[i + 1] = subToken[i + 1].replace(PLACEHOLDER, className); // eslint-disable-line no-param-reassign
          }
        }
      }
    });

    const ast = token;
    const css = Gonzales.csspToSrc(ast);

    return { ast, css, className };
  });

  //Return Classes generated from AST
  return classes;
};
