const fs = require('fs');
const path = require('path');
const {Liquid} = require('liquidjs');
const {outputdir, docsdir, pages} = require('./package.json').config;

const dd = path.resolve(__dirname, docsdir);
const engine = new Liquid({
  extname: '.liquid',
  globals: {title: 'LiquidJS Demo'},
  root: path.resolve(__dirname, outputdir),
  layouts: path.resolve(__dirname, outputdir, 'layouts'),
  partials: path.resolve(__dirname, outputdir, 'partials'),
});

pages.forEach((page) =>
  engine
    .renderFile(`pages/${page}`)
    .then((html) =>
      fs.promises.writeFile(path.resolve(dd, `${page}.html`), html)
    )
);
