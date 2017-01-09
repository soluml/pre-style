module.exports = {
  // Final destination of output
  cssDest: './src/client/css/_atomic.css',

  // Adapter that processes our syntax. This file should return a process.
  adapter: 'node-sass',

  /*
    Files to be prepended for each bit of CSS.
    Should be variables and mixins *ONLY* otherwise you'll really blaot your StyleSheet
  */
  preFiles: [],
};
