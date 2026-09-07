/**
 * Jest configuration for the TypeScript API test suites under `__tests__/`.
 *
 * See `__tests__/README.md` for what these suites cover and why the native
 * boundary is faked rather than stubbed.
 */
module.exports = {
  preset: 'react-native',
  rootDir: '.',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],

  // The fake JSI runtime has to be installed before any `src/` module is
  // imported: `src/native/bridge.ts` throws at import time when the
  // `__rnexecutorch_jsi__` global is missing. `setupFilesAfterEnv` runs before
  // the test file (and therefore before its imports) are evaluated.
  setupFilesAfterEnv: ['<rootDir>/__tests__/support/setup.ts'],

  // Mapped explicitly rather than relying on `__mocks__` auto-mocking: both
  // packages are hoisted to the monorepo root, so which `__mocks__` directory
  // sits "adjacent to node_modules" is not something this package controls.
  moduleNameMapper: {
    '^react-native-blob-util$': '<rootDir>/__tests__/support/blobUtilMock.ts',
    '^react-native-worklets$': '<rootDir>/__tests__/support/workletsMock.ts',
  },

  // Snapshot of the public export surface — see `api/apiSurface.test.ts`.
  snapshotFormat: { escapeString: false, printBasicPrototype: false },

  clearMocks: true,
  restoreMocks: true,
};
