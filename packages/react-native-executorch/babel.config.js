module.exports = {
  overrides: [
    {
      exclude: /\/node_modules\//,
      presets: ['module:react-native-builder-bob/babel-preset'],
      // `export * as ns` survives into lib/ otherwise, and the bare RN preset
      // apps compile node_modules with cannot transform it.
      plugins: ['@babel/plugin-transform-export-namespace-from'],
    },
    {
      include: /\/node_modules\//,
      presets: ['module:@react-native/babel-preset'],
    },
  ],
};
