const Adapter = require('./adapter');
const Normalize = require('./normalize');
const Atomize = require('./atomize');
const Sweatmap = require('sweatmap');
const Classify = require('./classify');
const defaultConfig = require('./config');

const MAP = new Sweatmap({ cssSafe: true });

//Process our syntax
module.exports = function PreStyle(cssstr) {
  //Get hardcoded config for now
  const config = Object.assign({}, defaultConfig, require('../../test/PreStyleConfig'));

  //Use the adapater specified in the config
  Adapter(config, cssstr)

    //Next let's minify it to reduce AST size and normalize values
    .then(data => Normalize(data[0], data[1]))

    //Then let's run our CSS through the AST
    .then(data => Atomize(data[0], data[1]))

    //Create class names from AST
    .then(data => Classify(data[0], data[1], MAP))

    //Was there an error?
    .catch(console.error);
};
