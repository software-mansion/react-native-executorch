// Minimal mock for the bits of `react-native` that the package imports at
// module-load time during these contract tests. Extend as new APIs are
// reached.

export const Platform = {
  OS: 'ios' as 'ios' | 'android' | 'web',
  select: <T>(specifics: {
    ios?: T;
    android?: T;
    default?: T;
  }): T | undefined => specifics.ios ?? specifics.default,
};

export const NativeModules: Record<string, unknown> = {};

export const TurboModuleRegistry = {
  get: () => null,
  getEnforcing: () => {
    throw new Error('TurboModuleRegistry not available in test env');
  },
};
