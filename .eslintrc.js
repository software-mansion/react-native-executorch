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
    'plugin:jsdoc/recommended-typescript',
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
    'jsdoc/require-jsdoc': 'off',
    'jsdoc/require-param': ['error', { checkDestructured: false }],
    'jsdoc/check-param-names': ['error', { checkDestructured: false }],
    'jsdoc/require-yields-type': 'off',
    'jsdoc/require-yields-description': 'warn',
    'jsdoc/check-tag-names': ['error', { definedTags: ['property'] }],
  },
  plugins: ['prettier', 'markdown', 'jsdoc'],
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
  settings: {
    jsdoc: {
      tagNamePreference: {
        typeParam: 'typeParam',
      },
    },
  },
};
