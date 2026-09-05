# Removing Legacy Support Checklist

This document details all directories, files, configurations, and dependencies to remove or clean up when dropping legacy API support (`react-native-executorch/legacy` and `0.10.0-legacy`) from the repository.

Every legacy touchpoint in the codebase is demarcated with `// === LEGACY SUPPORT ===` or `# === LEGACY SUPPORT ===`.

---

## 1. Packages & Directories to Delete

### Example Apps

- [ ] Delete `apps/legacy/` completely:
  ```bash
  rm -rf apps/legacy
  ```

### Library Legacy Code

- [ ] Delete `packages/react-native-executorch/legacy/` completely:
  ```bash
  rm -rf packages/react-native-executorch/legacy
  ```

### Obsolete Resource Fetcher Packages

In the rewrite, resource fetching/caching was moved directly into core (`packages/react-native-executorch/src/fetcher/`). The standalone fetcher packages only exist to support the legacy example apps and can be completely removed:

- [ ] Delete `packages/expo-resource-fetcher/` completely:
  ```bash
  rm -rf packages/expo-resource-fetcher
  ```
- [ ] Delete `packages/bare-resource-fetcher/` completely:
  ```bash
  rm -rf packages/bare-resource-fetcher
  ```

### Documentation

- [ ] Delete legacy versioned docs and sidebars:
  ```bash
  rm -rf docs/versioned_docs/version-0.10.0-legacy
  rm -rf docs/versioned_sidebars/version-0.10.0-legacy-sidebars.json
  ```
- [ ] In `docs/versions.json`, remove `"0.10.0-legacy"`.
- [ ] In `docs/docusaurus.config.js`, remove the `'0.10.0-legacy'` entry in `versions`.

---

## 2. Files to Delete

- [ ] `packages/react-native-executorch/src/native/NativeETInstaller.ts`
- [ ] `packages/react-native-executorch/android/src/main/java/com/swmansion/rnexecutorch/ETInstaller.kt`
- [ ] `packages/react-native-executorch/android/src/main/java/com/swmansion/rnexecutorch/ETInstallerUnavailable.kt`

---

## 3. Configuration Edits

### Root `package.json`

- [ ] Under `"workspaces" -> "packages"`, remove:
  - `"apps/legacy/*"`
  - `"// === LEGACY SUPPORT: workspaces ==="`

### Root `.gitignore`

- [ ] Remove the `# === LEGACY SUPPORT ===` section:
  ```gitignore
  apps/legacy/*/ios/
  apps/legacy/*/android/
  !apps/legacy/bare-rn/ios/
  !apps/legacy/bare-rn/android/
  ```

### Root `.eslintrc.js`

- [ ] Remove the `overrides` block targeting `"packages/react-native-executorch/legacy/**/*"` and `"apps/legacy/**/*"`.

### `packages/react-native-executorch/package.json`

- [ ] In `"exports"`, remove:
  - `"./legacy": { ... }`
  - `"// === LEGACY SUPPORT: exports ==="`
- [ ] In `"files"`, remove `"legacy"`.
- [ ] In `"scripts"`, change `"prepare"` from:
  ```json
  "prepare": "bob build && tsc -p legacy/tsconfig.json"
  ```
  to:
  ```json
  "prepare": "bob build"
  ```
  and remove `"// === LEGACY SUPPORT: prepare script ==="`.
- [ ] In `"dependencies"`, remove legacy-only dependencies:
  - `"jsonrepair"`
  - `"jsonschema"`
  - `"react-native-device-info"`
  - `"zod"`
  - `"// === LEGACY SUPPORT: dependencies ==="`
- [ ] In `"peerDependencies"` and `"peerDependenciesMeta"`, remove:
  - `"@kesha-antonov/react-native-background-downloader"`
  - `"// === LEGACY SUPPORT: peerDependencies ==="`

### `packages/react-native-executorch/tsconfig.json`

- [ ] Re-enable `verbatimModuleSyntax: true` (or remove `verbatimModuleSyntax: false`).

### `packages/react-native-executorch/tsconfig.build.json`

- [ ] In `"exclude"`, remove `"legacy"`.

### `packages/react-native-executorch/react-native-executorch.podspec`

- [ ] Remove the `# === LEGACY SUPPORT ===` source files block:
  ```ruby
  source_files += [
    "legacy/ios/**/*.{h,m,mm}",
    "legacy/cpp/**/*.{cpp,c,h,hpp}",
  ]
  ```
- [ ] Remove the `# === LEGACY SUPPORT ===` exclusion block:
  ```ruby
  exclude_files += [
    "legacy/cpp/rnexecutorch/tests/**/*",
    "legacy/cpp/rnexecutorch/jsi/*.{h,hpp}",
  ]
  s.preserve_paths = "legacy/cpp/rnexecutorch/jsi/*.{h,hpp}"
  ```
- [ ] Remove the `# === LEGACY SUPPORT ===` header search path:
  ```ruby
  "\"$(PODS_TARGET_SRCROOT)/legacy/cpp\"",
  ```

### `packages/react-native-executorch/android/CMakeLists.txt`

- [ ] Remove directory definitions:
  ```cmake
  set(LEGACY_CPP_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../legacy/cpp")
  set(LEGACY_ANDROID_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../legacy/android")
  ```
- [ ] Remove `find_package(fbjni REQUIRED CONFIG)`.
- [ ] Remove `file(GLOB_RECURSE LEGACY_CPP_SOURCES ...)`.
- [ ] Remove `list(APPEND RNE_SOURCES ${LEGACY_CPP_SOURCES} ${LEGACY_ANDROID_DIR}/ETInstallerModule.cpp)`.
- [ ] Remove `${LEGACY_CPP_DIR}` and `${LEGACY_ANDROID_DIR}` from `target_include_directories`.
- [ ] In `target_link_libraries`, remove:
  ```cmake
  ReactAndroid::reactnative
  fbjni::fbjni
  android
  ```

### `packages/react-native-executorch/android/src/main/java/com/swmansion/rnexecutorch/RnExecutorchPackage.kt`

- [ ] In `getModule`, remove the `ETInstaller.NAME -> { ... }` case.
- [ ] In `getReactModuleInfoProvider`, remove the `ETInstaller.NAME to ReactModuleInfo(...)` entry.

---

## 4. Git Diff Verification Against `rne-rewrite`

Once the legacy support code and configurations have been removed, run a git diff against the `rne-rewrite` branch. These modified configuration and build files should match `rne-rewrite` (or only differ by legitimate subsequent bugfixes/updates):

```bash
# Check diff of all modified configuration/build files against rne-rewrite:
git diff origin/rne-rewrite -- \
  package.json \
  .gitignore \
  .eslintrc.js \
  packages/react-native-executorch/package.json \
  packages/react-native-executorch/tsconfig.json \
  packages/react-native-executorch/tsconfig.build.json \
  packages/react-native-executorch/react-native-executorch.podspec \
  packages/react-native-executorch/android/CMakeLists.txt \
  packages/react-native-executorch/android/src/main/java/com/swmansion/rnexecutorch/RnExecutorchPackage.kt

# Check overall branch diff (excluding newly added docs/features):
git diff --stat origin/rne-rewrite
```

Ensure no leftover legacy markers remain in the repository:

```bash
git grep "LEGACY SUPPORT"
```

_(This command should return 0 results after complete removal)._

---

## 5. Verification After Removal

Run the following commands to confirm that the clean repository builds and passes all checks:

```bash
# 1. Re-link workspace dependencies
yarn install

# 2. Build bundles
yarn prepare

# 3. Typecheck
yarn typecheck

# 4. Run test suites
yarn workspace react-native-executorch test

# 5. Lint
yarn lint
```
