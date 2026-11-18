const path = require('path');
const typedocConfig = require('./docs/typedoc.json');

const VALID_CATEGORIES = typedocConfig.categoryOrder.filter((cat) => cat !== '*');

const CATEGORY_TAG_MATCH = `^(${VALID_CATEGORIES.join('|')})$`;

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
    'jsdoc/match-description': [
      'error',
      {
        contexts: ['any'],
        mainDescription: false,
        tags: {
          category: {
            message: '@category must be one of categories defined in .eslintrc.js',
            match: CATEGORY_TAG_MATCH,
          },
        },
      },
    ],
  },
  plugins: ['prettier', 'markdown', 'jsdoc'],
  overrides: [
    {
      files: ['packages/react-native-executorch/src/constants.ts'],
      rules: {
        '@cspell/spellchecker': 'off',
      },
    },
    {
      files: ['packages/react-native-executorch/src/**/*.{js,jsx,ts,tsx}'],
      rules: {
        'no-console': 'warn',
      },
    },
    {
      // The JSDoc rules exist to keep the generated API reference complete.
      // Test helpers are not part of that surface, and requiring a tag per
      // parameter on a three-line fixture crowds out the prose that explains
      // why the fixture exists.
      files: ['packages/react-native-executorch/__tests__/**/*.{ts,tsx}'],
      rules: {
        'jsdoc/require-param': 'off',
        'jsdoc/require-param-description': 'off',
        'jsdoc/require-returns': 'off',
        'jsdoc/require-returns-description': 'off',
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
  ignorePatterns: ['node_modules/', 'lib/', '**/build/'],
  settings: {
    jsdoc: {
      tagNamePreference: {
        typeParam: 'typeParam',
      },
    },
  },
};
