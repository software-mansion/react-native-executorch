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
    // Workspace packages (react-native-executorch, bare-resource-fetcher) declare
    // their own `react` devDependency, so yarn installs a second React copy at
    // packages/*/node_modules/react. Without disabling hierarchical lookup, Metro
    // resolves `react` per-file and the bundle ends up with two React instances —
    // useState's dispatcher comes back null at runtime.
    disableHierarchicalLookup: true,
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
