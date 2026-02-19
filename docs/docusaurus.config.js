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
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          breadcrumbs: true,
          sidebarPath: require.resolve('./sidebars.js'),
          sidebarCollapsible: false,
          editUrl:
            'https://github.com/software-mansion/react-native-executorch/edit/main/docs',
        },
        theme: {
          customCss: require.resolve('./src/css/index.css'),
        },
        googleTagManager: {
          containerId: 'GTM-WNBF6SVN',
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

  plugins: [
    [
      'docusaurus-plugin-typedoc',
      {
        // 1. Point to the specific entry point inside the package
        entryPoints: ['../packages/react-native-executorch/src/index.ts'],

        // 2. Point to the specific tsconfig inside that package
        tsconfig: '../packages/react-native-executorch/tsconfig.doc.json',

        out: './docs/06-api-reference',

        // Remove invalid 'sidebar' option (v4+)
        // sidebar: { ... }
      },
    ],
    [
      '@signalwire/docusaurus-plugin-llms-txt',
      /** @type {import('@signalwire/docusaurus-plugin-llms-txt/public').PluginOptions} */
      ({
        markdown: {
          enableFiles: true,
          excludeRoutes: [
            '**/react-native-executorch/search',
            '**/api-reference/**',
          ],
          includeVersionedDocs: false,
          relativePaths: false,
        },
        llmsTxt: {
          siteTitle: 'React Native ExecuTorch',
          siteDescription:
            "React Native ExecuTorch brings Meta's ExecuTorch AI framework into the React Native ecosystem, enabling developers to run AI models and LLMs locally, directly on mobile devices. It provides a declarative API for on-device inference, allowing you to use local AI models without relying on cloud infrastructure. Built on the ExecuTorch foundation - part of the PyTorch Edge ecosystem - it extends efficient on-device AI deployment to cross-platform mobile applications in React Native.",
          autoSectionDepth: 3,
          autoSectionPosition: 1,
          enableDescriptions: true,
          sections: [
            {
              id: 'benchmarks',
              name: 'Benchmarks',
              routes: [{ route: '**/docs/benchmarks/**' }],
              position: 2,
            },
            {
              id: 'category',
              name: 'Category',
              routes: [{ route: '**/docs/category/**' }],
              position: 3,
            },
          ],
        },
        ui: {
          copyPageContent: {
            buttonLabel: 'Copy Page',
            contentStrategy: 'prefer-markdown',
            display: {
              excludeRoutes: ['**/docs/category/**'],
            },
            actions: {
              viewMarkdown: true,
              ai: {
                chatGPT: {
                  prompt: 'Check this link out GPT',
                },
                claude: {
                  prompt: 'Check this link out Claude',
                },
              },
            },
          },
        },
      }),
    ],
  ],
  themes: [require.resolve('@signalwire/docusaurus-theme-llms-txt')],
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
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            label: 'Docs',
            position: 'right',
          },
          {
            type: 'docsVersionDropdown',
            position: 'right',
            dropdownActiveClassDisabled: true,
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
        // eslint-disable-next-line @cspell/spellchecker
        appId: '9PIVJVUUXB',
        apiKey: '8634751cfd500c6708f63ea5fc7446c6',
        indexName: 'swmansion',
        askAi: {
          appId: '9PIVJVUUXB',
          apiKey: '8634751cfd500c6708f63ea5fc7446c6',
          assistantId: 'MZHkLL8cFqAN',
          indexName: 'swmansion-markdown-for-llms',
        },
      },
    }),
  customFields: {
    algolia: {
      suggestedQuestions: true,
      enableSidePanel: true,
    },
  },
};

module.exports = config;
