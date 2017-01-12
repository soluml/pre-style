module.exports = {
  // Final destination of output
  outputFile: '../../build/_atomic.css',

  // Adapter that processes our syntax. This file or function should return a promise.
  adapter(data) {
    try {
      const Sass = require('node-sass');
      return Promise.resolve(Sass.renderSync({ data, outputStyle: 'compressed' }).css);
    } catch (e) {
      return Promise.reject(e);
    }
  },

  /*
    Files to be prepended for each bit of CSS.
    Should be variables and mixins *ONLY* otherwise you'll really blaot your StyleSheet
  */
  prependedFiles: [],
};
