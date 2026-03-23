const path = require('path');

const VALID_CATEGORIES = [
  'Base Classes',
  'Hooks',
  'Interfaces',
  'Models - Classification',
  'Models - Image Embeddings',
  'Models - Image Generation',
  'Models - LLM',
  'Models - Object Detection',
  'Models - Instance Segmentation',
  'Models - Semantic Segmentation',
  'Models - Speech To Text',
  'Models - Style Transfer',
  'Models - Text Embeddings',
  'Models - Text to Speech',
  'Models - VLM',
  'Models - Voice Activity Detection',
  'OCR Supported Alphabets',
  'TTS Supported Voices',
  'Types',
  'Typescript API',
  'Utils',
  'Utilities - General',
  'Utilities - LLM',
];

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
            message:
              '@category must be one of categories defined in .eslintrc.js',
            match: CATEGORY_TAG_MATCH,
          },
        },
      },
    ],
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
