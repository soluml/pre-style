const Gonzales = require('gonzales');
const Normalize = require('./normalize');

module.exports = function Write(cssObj) {
  const classNames = cssObj.map(cls => cls.className).join(' ');
  const uncss = Gonzales.csspToSrc(['stylesheet'].concat(cssObj.map(cls => cls.ast)));

  return new Promise((resolve, reject) => {
    Normalize(uncss)
      .then((data) => {
        const { css } = data[0];

        //Write stuff to file

        //Resolve with this
        resolve({ css, classNames });
      }, reject);
  });
};
