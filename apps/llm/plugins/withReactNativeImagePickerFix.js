const { withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * In a Yarn workspace monorepo, react-native is hoisted to the repo root.
 * react-native-image-picker reads REACT_NATIVE_NODE_MODULES_DIR from
 * rootProject.ext, so it must be set in the root android/build.gradle.
 */
module.exports = function withReactNativeImagePickerFix(config) {
  return withProjectBuildGradle(config, (mod) => {
    if (!mod.modResults.contents.includes('REACT_NATIVE_NODE_MODULES_DIR')) {
      mod.modResults.contents = mod.modResults.contents.replace(
        /^(allprojects\s*\{)/m,
        `ext {
    REACT_NATIVE_NODE_MODULES_DIR = new File(["node", "--print", "require.resolve('react-native/package.json')"].execute(null, rootDir).text.trim()).parentFile.absolutePath
}

$1`
      );
    }
    return mod;
  });
};
