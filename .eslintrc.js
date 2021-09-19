module.exports = {
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    'plugin:jest/recommended',
    'prettier',
  ],
  parserOptions: {
    ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
  },
  plugins: ['prettier'],
  env: {
    browser: true,
  },
  rules: {
    curly: 1,
    '@typescript-eslint/explicit-function-return-type': [0],
    '@typescript-eslint/no-explicit-any': [0],
    '@typescript-eslint/ban-ts-comment': [0],
    '@typescript-eslint/no-var-requires': [0],
    '@typescript-eslint/ban-types': [0],
    'prettier/prettier': 2, // Means error
    'ordered-imports': [0],
    'object-literal-sort-keys': [0],
    'max-len': [1, 120],
    'default-case': 0,
    'new-parens': 1,
    'no-bitwise': 0,
    'no-cond-assign': 1,
    'no-trailing-spaces': 0,
    'eol-last': 1,
    'func-style': ['error', 'declaration', {allowArrowFunctions: true}],
    semi: 1,
    'no-var': 0,
    'no-plusplus': 0,
    'func-names': 0,
    'consistent-return': 1,
    'import/no-unresolved': 0,
    'import/extensions': 0,
  },
};
