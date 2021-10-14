const path = require('path');
const {override, addBabelPlugins, addWebpackAlias} = require('customize-cra');

const DIST_PATH = path.resolve(__dirname, '../../../dist');

module.exports = override(
  addBabelPlugins([
    path.resolve(DIST_PATH, '@babel'), // In a real project, the plugin path is just `pre-style/dist/@babel`
    {
      importAsCSS: true, // create-react-app supports importing CSS, so let's do that :)
      styled: true, // Leverage "Styled Components", have pre-style generate them for you and pre fill their className's. Uses `React.createElement`.
      destination: './src', // imported files must come from the "src" directory, so let's drop our generated file there
    },
  ]),
  // We need an alias to use the local `dist` as a node_module. In a real project, this line can be removed
  addWebpackAlias({'pre-style$': path.resolve(DIST_PATH, 'src/index.js')})
);
