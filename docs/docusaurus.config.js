const lightCodeTheme = require('./src/theme/CodeBlock/highlighting-light.js');
const darkCodeTheme = require('./src/theme/CodeBlock/highlighting-dark.js');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'React Native ExecuTorch',
  tagline:
    'Declarative way to run AI models in React Native on device, powered by ExecuTorch',
  favicon: 'img/favicon.ico',

  url: 'https://docs.swmansion.com',

  baseUrl: '/react-native-executorch/',

  trailingSlash: false,

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
          editUrl:
            'https://github.com/software-mansion/react-native-executorch/edit/main/docs',
        },
        theme: {
          customCss: require.resolve('./src/css/index.css'),
        },
        gtag: {
          trackingID: 'G-TJND8QJM9P',
          anonymizeIP: true,
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
          ignorePatterns: ['/tags/**'],
          filename: 'sitemap.xml',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: 'dark',
      },
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
            to: 'docs/fundamentals/getting-started',
            activeBasePath: 'docs',
            label: 'Docs',
            position: 'right',
          },
          {
            'href': 'https://discord.gg/ZGqqY55qkP',
            'position': 'right',
            'className': 'header-discord',
            'aria-label': 'Discord server',
          },
          {
            'href':
              'https://github.com/software-mansion/react-native-executorch',
            'position': 'right',
            'className': 'header-github',
            'aria-label': 'GitHub repository',
          },
        ],
      },
      footer: {
        style: 'light',
        links: [],
        copyright:
          'All trademarks and copyrights belong to their respective owners.',
      },
      prism: {
        additionalLanguages: ['bash'],
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
      algolia: {
        appId: '9PIVJVUUXB',
        apiKey: '8634751cfd500c6708f63ea5fc7446c6',
        indexName: 'swmansion',
      },
    }),
};

module.exports = config;
