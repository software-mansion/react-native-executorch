// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const monorepoRoot = path.resolve(__dirname, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const { transformer, resolver } = config;

config.watchFolders = [monorepoRoot];

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
};
config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...resolver.sourceExts, 'svg'],
  nodeModulesPaths: [
    path.resolve(__dirname, 'node_modules'),
    path.resolve(monorepoRoot, 'node_modules'),
  ],
  // Always resolve react and react-native from the monorepo root so that
  // workspace packages with their own nested node_modules (e.g.
  // packages/react-native-executorch/node_modules/react) don't create a
  // second React instance and trigger "Invalid hook call".
  resolveRequest: (context, moduleName, platform) => {
    if (moduleName === 'react' || moduleName === 'react-native') {
      return {
        filePath: require.resolve(moduleName, { paths: [monorepoRoot] }),
        type: 'sourceFile',
      };
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

config.resolver.assetExts.push('pte');

module.exports = config;
