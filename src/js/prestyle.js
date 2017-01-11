const Adapter = require('./adapter');
const Minify = require('./minify');
const Atomize = require('./atomize');
const defaultConfig = require('./config');

//Process our syntax
module.exports = function PreStyle(cssstr) {
  //Get hardcoded config for now
  const config = Object.assign({}, defaultConfig, require('../../test/PreStyleConfig'));

  //Use the adapater specified in the config
  Adapter(config, cssstr)

    //Next let's minify it to reduce AST size and normalize values
    .then(data => Minify(data[0], data[1]))

    //Then let's run our CSS through the AST
    .then(data => Atomize(data[0], data[1]))

    //Was there an error?
    .catch(console.error);
};
