const darkTheme = require('prism-react-renderer').themes.github;

module.exports = {
  ...darkTheme,
  plain: {
    color: 'var(--swm-navy-light-10)',
  },
  styles: [
    ...darkTheme.styles,
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: {
        color: 'var(--swm-navy-light-40)',
        fontStyle: 'italic',
      },
    },
    {
      types: ['namespace'],
      style: {
        opacity: 0.7,
      },
    },
    {
      // eslint-disable-next-line @cspell/spellchecker
      types: ['string', 'property', 'atrule', 'selector', 'tag'],
      style: {
        color: 'var(--swm-green-dark-80)',
      },
    },
    {
      types: ['punctuation'],
      style: {
        color: 'var(--swm-navy-light-20)',
      },
    },
    {
      types: [
        'entity',
        'url',
        'symbol',
        'number',
        'boolean',
        'variable',
        'constant',
        'regex',
        'inserted',
        'operator',
        'attr-value',
      ],
      style: {
        color: 'var(--swm-red-dark-80)',
      },
    },
    {
      types: ['function', 'function-variable', 'deleted'],
      style: {
        color: 'var(--swm-purple-dark-80)',
      },
    },
    {
      types: ['property', 'module', 'attr-name', 'keyword'],
      style: {
        color: 'var(--swm-blue-dark-80)',
      },
    },
  ],
};
