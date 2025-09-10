const { getDefaultConfig } = require('expo/metro-config');
const {
  wrapWithAudioAPIMetroConfig,
} = require('react-native-audio-api/metro-config');

const config = getDefaultConfig(__dirname);

const { transformer, resolver } = config;

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
};
config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...resolver.sourceExts, 'svg'],
};

config.resolver.assetExts.push('pte');

module.exports = wrapWithAudioAPIMetroConfig(config);
