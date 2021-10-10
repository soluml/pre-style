const fs = require('fs');
const {Liquid} = require('liquidjs');

const engine = new Liquid({
  extname: '.liquid',
  globals: {title: 'LiquidJS Demo'},
  root: __dirname,
  layouts: './layouts',
  partials: './partials',
});

const ctx = {};

(async () => {
  const pages = ['index'];

  const html = await engine.renderFile('pages/index', ctx);

  console.log(html);
})();
