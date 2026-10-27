const { withAppBuildGradle } = require('expo/config-plugins');

// React Native's bundle task tracks source files, but Expo's inlined benchmark
// settings come from the environment. Give Gradle those inputs as well so a
// release APK cannot reuse another device's collector or validation settings.
module.exports = (config) =>
  withAppBuildGradle(config, (modConfig) => {
    const marker = '// Benchmark environment inputs';
    if (!modConfig.modResults.contents.includes(marker)) {
      modConfig.modResults.contents += `
${marker}
tasks.withType(com.facebook.react.tasks.BundleHermesCTask).configureEach {
    inputs.property("benchmarkEnvironment", providers.environmentVariablesPrefixedBy("EXPO_PUBLIC_BENCH_"))
}
`;
    }
    return modConfig;
  });
