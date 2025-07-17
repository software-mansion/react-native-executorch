const path = require('path');

module.exports = {
  parserOptions: {
    requireConfigFile: false,
    babelOptions: {
      presets: ['@babel/preset-react'],
    },
  },
  root: true,
  extends: [
    '@react-native',
    'plugin:@cspell/recommended',
    'plugin:prettier/recommended',
    'plugin:markdown/recommended-legacy',
  ],
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
    'camelcase': 'error',
  },
  plugins: ['prettier', 'markdown'],
  overrides: [
    {
      files: ['packages/react-native-executorch/src/**/*.{js,jsx,ts,tsx}'],
      rules: {
        'no-console': 'warn',
      },
    },
    {
      files: ['**/*.md'],
      processor: 'markdown/markdown',
    },
    {
      files: ['**/*.md/*.{ts,tsx}'],
      rules: {
        'no-console': 'off',
        'react-hooks/rules-of-hooks': 'off',
        'react/jsx-no-undef': 'off',
        '@typescript-eslint/no-unused-vars': 'warn',
        'camelcase': 'warn',
      },
    },
  ],
  ignorePatterns: ['node_modules/', 'lib/'],
};
