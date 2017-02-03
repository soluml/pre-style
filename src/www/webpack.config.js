/* eslint no-console: 0, global-require: 0, import/no-extraneous-dependencies: 0 */

const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const isDebug = !(process.argv.includes('--release') || process.argv.includes('-r'));
const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v');
const cssLoaderConfig = 'css-loader?-minimize&-import&-modules!postcss-loader!sass-loader';

const config = {
  context: path.join(__dirname),
  entry: {
    app: ['./js/app/index.js'],
    head: ['./js/head/index.js'],
  },
  output: {
    path: path.join(__dirname, '../../docs'),
    filename: isDebug ? 'js/[name].js' : 'js/[name].[chunkhash].js',
    publicPath: '/', // MUST HAVE TRAILING SLASH IF NOT /
    sourceMapFileName: isDebug ? 'js/[name].js' : 'js/[name].[chunkhash].js.map',
    chunkFilename: isDebug ? '' : 'js/[name].[chunkhash].js',
  },
  debug: isDebug,
  devtool: isDebug ? 'source-map' : false,
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html',
      inject: false,
      minify: { collapseWhitespace: true }
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': isDebug ? '"development"' : '"production"',
      __DEV__: isDebug,
    }),
  ],

  module: {
    loaders: [
      {
        test: /\.json$/, loader: 'json',
      },
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /(node_modules|\/js\/vendor)/,
      },
      {
        test: /app\.scss$/,
        loader:
          isDebug ?
            `style-loader!${cssLoaderConfig}`
          :
            ExtractTextPlugin.extract('style-loader', `!${cssLoaderConfig}`)
      },
      {
        test: /\/sprite\/.*\.svg$/,
        loader: 'svg-sprite?' + JSON.stringify({
          name: '[name]',
          prefixize: false,
        }) + '!img-loader?minimize',
      },
      {
        test: /\.(jpe?g|gif|png|svg)$/,
        exclude: [/sprite/],
        loader: 'file-loader?name=img/[name]_[hash].[ext]!img-loader?minimize',
      },
      {
        test: /\.(woff|woff2)$/,
        loader: 'url-loader?limit=10000',
      },
      {
        test: /\.(eot|ttf|wav|mp3)$/,
        loader: 'file-loader',
      },
    ],
  },

  // The list of plugins for PostCSS
  postcss() {
    return [
      require('cssnano')({
        autoprefixer: false,
        discardComments: { removeAll: true },
      }),
      // Add vendor prefixes to CSS rules using values from caniuse.com
      // https://github.com/postcss/autoprefixer
      require('autoprefixer')({
        remove: false,
      }),
    ];
  },

  imagemin: {
    gifsicle: {
      interlaced: false,
    },
    jpegtran: {
      progressive: false,
      arithmetic: false,
    },
    optipng: {
      optimizationLevel: 7,
    },
    pngquant: {
      floyd: 0.5,
      speed: 2,
    },
    svgo: {
      plugins: [{ // https://github.com/svg/svgo#what-it-can-do
        removeDoctype: true,
        convertPathData: false,
      }],
    },
  },
};

// Optimize the bundle in release (production) mode
if (!isDebug) {
  config.plugins.push(new ExtractTextPlugin('css/app.[hash].css'));
  config.plugins.push(new webpack.optimize.DedupePlugin());
  config.plugins.push(new webpack.optimize.UglifyJsPlugin({ compress: { warnings: isVerbose } }));
  config.plugins.push(new webpack.optimize.AggressiveMergingPlugin());
}

module.exports = config;
