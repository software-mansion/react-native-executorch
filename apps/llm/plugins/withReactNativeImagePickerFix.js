const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * In a Yarn workspace monorepo, react-native is hoisted to the repo root.
 * react-native-image-picker's build.gradle can't find it automatically,
 * so we set REACT_NATIVE_NODE_MODULES_DIR explicitly.
 */
module.exports = function withReactNativeImagePickerFix(config) {
  return withAppBuildGradle(config, (mod) => {
    if (!mod.modResults.contents.includes('REACT_NATIVE_NODE_MODULES_DIR')) {
      mod.modResults.contents = mod.modResults.contents.replace(
        /^(android\s*\{)/m,
        `project.ext {
    REACT_NATIVE_NODE_MODULES_DIR = new File(["node", "--print", "require.resolve('react-native/package.json')"].execute(null, rootDir).text.trim()).parentFile.absolutePath
}

$1`
      );
    }
    return mod;
  });
};
