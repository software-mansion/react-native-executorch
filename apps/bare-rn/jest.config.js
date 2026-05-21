module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '^react-native-executorch$':
      '<rootDir>/__mocks__/react-native-executorch.js',
    '^react-native-executorch-bare-resource-fetcher$':
      '<rootDir>/__mocks__/react-native-executorch-bare-resource-fetcher.js',
    '^@kesha-antonov/react-native-background-downloader$':
      '<rootDir>/__mocks__/background-downloader.js',
  },
};
