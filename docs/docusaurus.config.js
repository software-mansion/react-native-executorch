/*
In swizzled components look for "SWM -" string to see our modifications
*/

const lightCodeTheme = require('./src/theme/CodeBlock/highlighting-light.js');
const darkCodeTheme = require('./src/theme/CodeBlock/highlighting-dark.js');
// @ts-check
const webpack = require('webpack');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'React Native ExecuTorch',
  favicon: 'img/favicon.ico',

  url: 'https://docs.swmansion.com',

  baseUrl: '/react-native-executorch/',

  organizationName: 'software-mansion',
  projectName: 'react-native-executorch',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          breadcrumbs: false,
          sidebarPath: require.resolve('./sidebars.js'),
          sidebarCollapsible: false,
          editUrl: 'https://github.com/software-mansion/react-native-executorch/edit/main/docs',
        },
        theme: {
          customCss: require.resolve('./src/css/index.css'),
        },
        googleAnalytics: {
          trackingID: '...',
          anonymizeIP: true,
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/og-image.png',
      navbar: {
        title: 'React Native ExecuTorch',
        hideOnScroll: true,
        logo: {
          alt: 'React Native ExecuTorch',
          src: 'img/logo-hero.svg',
        },
        items: [
          {
            href: 'https://github.com/software-mansion/react-native-executorch',
            position: 'right',
            className: 'header-github',
            'aria-label': 'GitHub repository',
          },
        ],
      },
      announcementBar: {
        content: ' ',
        backgroundColor: '#03c',
        textColor: '#fff',
      },
      footer: {
        style: 'light',
        links: [],
        copyright:
          'All trademarks and copyrights belong to their respective owners.',
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
      algolia: {
        appId: '...',
        apiKey: '...',
        indexName: 'react-native-executorch',
      },
    }),
  plugins: [
    // ...[
    //   process.env.NODE_ENV === 'production' && '@docusaurus/plugin-debug',
    // ].filter(Boolean),
    // async function reanimatedDocusaurusPlugin(context, options) {
    //   return {
    //     name: 'react-native-reanimated/docusaurus-plugin',
    //     configureWebpack(config, isServer, utils) {
    //       const processMock = !isServer ? { process: { env: {} } } : {};

    //       const raf = require('raf');
    //       raf.polyfill();

    //       return {
    //         mergeStrategy: {
    //           'resolve.extensions': 'prepend',
    //         },
    //         plugins: [
    //           new webpack.DefinePlugin({
    //             ...processMock,
    //             __DEV__: 'false',
    //             setImmediate: () => {},
    //           }),
    //         ],
    //         module: {
    //           rules: [
    //             {
    //               test: /\.txt/,
    //               type: 'asset/source',
    //             },
    //           ],
    //         },
    //         resolve: {
    //           alias: { 'react-native$': 'react-native-web' },
    //           extensions: ['.web.js', '...'],
    //         },
    //       };
    //     },
    //   };
    // },
  ],
};

module.exports = config;
