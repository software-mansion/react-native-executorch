const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const workspaceRoot = path.resolve(__dirname, '../../'); // Adjust the path to your monorepo root
const projectRoot = __dirname;
const defaultConfig = getDefaultConfig(projectRoot);

const config = {
  watchFolders: [
    workspaceRoot, // Watch the entire monorepo
  ],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    assetExts: [
      ...defaultConfig.resolver.assetExts,
      'pte', // ExecuTorch model files
    ],
  },
};

module.exports = mergeConfig(defaultConfig, config);
