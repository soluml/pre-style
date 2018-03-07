const Gonzales = require('gonzales');

module.exports = function Sweat(cssObj, PLACEHOLDER, MAP, blockMode) {
  const CSS = cssObj.css;
  const AST = Gonzales.srcToCSSP(CSS);

  if (blockMode) {
    const className = MAP.set(CSS);
    const css = CSS.replace(new RegExp(PLACEHOLDER, 'g'), className);
    const classNameObj = {};
    classNameObj[className] = className;

    return [{
      className: classNameObj,
      ast: AST,
      css,
    }];
  } else {
    const classes = AST.slice(1).map((token) => {
      //Stringify token and use as key for SweatMap
      const mapKey = Gonzales.csspToSrc(token);
      const hadMapKey = MAP.has(mapKey);
      const className = MAP.set(mapKey);
      const classNameObj = {};
      classNameObj[mapKey] = className;

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
      const css = hadMapKey ? '' : Gonzales.csspToSrc(ast);

      return { ast, css, className: classNameObj };
    });

    //Return Classes generated from AST
    return classes;
  }
};
