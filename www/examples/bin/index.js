const fs = require('fs');
const path = require('path');
const {Liquid} = require('liquidjs');
const {outputdir, pages} = require('./package.json').config;

const docsdir = path.resolve(__dirname, '../../../docs');
const engine = new Liquid({
  extname: '.liquid',
  globals: {title: 'LiquidJS Demo'},
  root: path.resolve(__dirname, outputdir),
  layouts: './layouts',
  partials: './partials',
});

pages.forEach((page) =>
  engine
    .renderFile(`pages/${page}`)
    .then((html) =>
      fs.promises.writeFile(path.resolve(docsdir, `${page}.html`), html)
    )
);
