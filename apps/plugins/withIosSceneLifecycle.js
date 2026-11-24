const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

// iOS 27 terminates apps that have not adopted the UIScene life cycle. The Expo
// template still starts React Native from the app delegate, so hand the window
// to Expo's ExpoAppSceneDelegate instead. Remove once the template does this.

const WINDOW_SETUP = `#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif
`;

const withSceneDelegate = (config) =>
  withAppDelegate(config, (modConfig) => {
    if (modConfig.modResults.language !== 'swift') {
      throw new Error('withIosSceneLifecycle supports only a Swift AppDelegate');
    }
    let contents = modConfig.modResults.contents;
    if (!contents.includes('ExpoAppSceneDelegate')) {
      const declaration = 'class AppDelegate: ExpoAppDelegate {';
      if (!contents.includes(declaration) || !contents.includes(WINDOW_SETUP)) {
        throw new Error('withIosSceneLifecycle: unexpected AppDelegate.swift template');
      }
      contents = contents
        .replace(
          declaration,
          'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {'
        )
        .replace(WINDOW_SETUP, '')
        .concat('\nclass SceneDelegate: ExpoAppSceneDelegate {}\n');
    }
    modConfig.modResults.contents = contents;
    return modConfig;
  });

const withSceneManifest = (config) =>
  withInfoPlist(config, (modConfig) => {
    modConfig.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };
    return modConfig;
  });

module.exports = (config) => withSceneManifest(withSceneDelegate(config));
