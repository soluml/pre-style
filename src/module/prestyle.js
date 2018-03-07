const Adapter = require('./adapter');
const Normalize = require('./normalize');
const Atomize = require('./atomize');
const Sweatmap = require('sweatmap');
const Classify = require('./classify');
const Write = require('./write');

//Process our syntax
module.exports = function PreStyle(cssstr, config, existing_strings = {}) {
  const MAP = new Sweatmap({ cssSafe: true, existing_strings });
  const PLACEHOLDER = '✨PLACEHOLDER✨';
  const { blockMode } = config;

  //Use the adapater specified in the config
  return Adapter(config, cssstr, PLACEHOLDER)

    //Next let's minify it to reduce AST size and normalize values
    .then(data => Normalize(data))

    //Then let's run our CSS through the AST
    .then(data => Atomize(data, PLACEHOLDER, blockMode))

    //Create class names from AST
    .then(data => Classify(data, PLACEHOLDER, MAP, blockMode))

    //Write CSS to outputFile and replace string with stringified classNames
    .then(data => Write(data, blockMode));
};
