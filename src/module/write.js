const Gonzales = require('gonzales');
const MQpacker = require('css-mqpacker');
const Normalize = require('./normalize');

module.exports = function Write(cssObj, blockMode) {
  const classNames = Object.assign(...cssObj.map(cls => cls.className));
  const uncss = blockMode ? cssObj[0].css : Gonzales.csspToSrc(['stylesheet'].concat(cssObj.filter(cls => cls.css).map(cls => cls.ast)));

  return new Promise((resolve, reject) => {
    Normalize(uncss)
      .then((data) => {
        const { css } = MQpacker.pack(data.css);

        //Resolve with this
        resolve({ css, classNames });
      }, reject);
  });
};
