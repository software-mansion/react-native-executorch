const path = require('path');

module.exports = {
  parserOptions: {
    requireConfigFile: false,
    babelOptions: {
      presets: ['@babel/preset-react'],
    },
  },
  root: true,
  extends: ['@react-native', 'prettier', 'plugin:@cspell/recommended'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'prettier/prettier': [
      'error',
      {
        quoteProps: 'consistent',
        singleQuote: true,
        tabWidth: 2,
        trailingComma: 'es5',
        useTabs: false,
      },
    ],
    '@cspell/spellchecker': [
      'warn',
      {
        customWordListFile: path.resolve(__dirname, '.cspell-wordlist.txt'),
      },
    ],
  },
  plugins: ['prettier'],
  ignorePatterns: ['node_modules/', 'lib/'],
};
