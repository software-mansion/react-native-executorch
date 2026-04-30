module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['unplugin-typegpu/babel', 'react-native-reanimated/plugin'],
  };
};
