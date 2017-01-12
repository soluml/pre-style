const CSSNano = require('cssnano');

module.exports = function Write(cssObj) {
  const className = cssObj.map(cls => cls.className).join(' ');

  console.log('------------');
  console.log(className);
  console.log(cssObj);
  console.log('------------');
};
