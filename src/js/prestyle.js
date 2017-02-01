const Adapter = require('./adapter');
const Normalize = require('./normalize');
const Atomize = require('./atomize');
const Sweatmap = require('sweatmap');
const Classify = require('./classify');
const Write = require('./write');

const MAP = new Sweatmap({ cssSafe: true });

//Process our syntax
module.exports = function PreStyle(cssstr, config) {
  //Use the adapater specified in the config
  return Adapter(config, cssstr)

    //Next let's minify it to reduce AST size and normalize values
    .then(data => Normalize(data[0], data[1]))

    //Then let's run our CSS through the AST
    .then(data => Atomize(data[0], data[1]))

    //Create class names from AST
    .then(data => Classify(data[0], data[1], MAP))

    //Write CSS to outputFile and replace string with stringified classNames
    .then(data => Write(data));
};
