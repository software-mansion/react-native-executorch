# Consumer build matrix

<!-- cspell:ignore plutil Podfile prebuild XnnpackBackend bundletool -->

The [Consumer builds workflow](../workflows/consumer-builds.yml) installs one
published-format library tarball into fresh consumer applications outside the
checkout. All cells use the same tarball built from the current commit. They
cannot resolve the repository's workspace dependencies or library source files.

## Version coverage

[compatibility.json](./compatibility.json) declares supported RN minors for each
pinned Worklets release, pinned RN patches and peer versions, and the Expo
fixtures. [matrix.mjs](./matrix.mjs) generates every declared compatible pair and
expands it across Android and iOS. One workflow plans, packs and builds them.

| React Native                 | Compatible Worklets pins                                     | Release app builds |
| ---------------------------- | ------------------------------------------------------------ | ------------------ |
| 0.83.6                       | 0.10.4, 0.11.4, 0.12.2                                       | 6                  |
| 0.84.1                       | 0.10.4, 0.11.4, 0.12.2                                       | 6                  |
| 0.85.3                       | 0.10.4, 0.11.4, 0.12.2                                       | 6                  |
| 0.86.3                       | 0.10.4, 0.11.4, 0.12.2, 0.13.0                               | 8                  |
| 0.87.1                       | 0.12.2, 0.13.0                                               | 4                  |
| 0.88.1                       | 0.13.0                                                       | 2                  |
| Expo 55.0.32 / RN 0.83.10    | 0.10.4                                                       | 2                  |
| Expo 56.0.24 / RN 0.85.3     | 0.10.4                                                       | 2                  |
| Expo 57.0.28 / RN 0.86.3     | 0.13.0                                                       | 2                  |
| Expo 58.0.24 / RN 0.88.1     | 0.13.0                                                       | 2                  |
| Latest Expo, Windows Android | Same versions as the latest SDK                              | 1                  |
| Latest Expo, runtime smoke   | Same versions as the latest SDK                              | 2                  |
| Latest Expo, integrations    | Sentry, Firebase, Vision Camera, audio-api                   | 2                  |
| **Total**                    | **32 bare + 8 Expo + 1 Windows + 2 runtime + 2 integration** | **45**             |

- **Relevant pull requests:** thirteen app builds: eight SDK/platform builds,
  one additional Expo 58 Android build on Windows, and two latest-Expo runtime
  smoke apps (Android emulator on Linux, iOS simulator on macOS), plus two
  latest-Expo integration builds.
- **Manual dispatch:** `expo` (the default) runs those thirteen builds; `full`
  adds all 32 bare RN/Worklets builds for **45 app builds**. Use `full` for
  releases, native changes and compatibility investigations.
- **No scheduled runs yet.** A TODO tracks considering daily Expo coverage after
  validation; the broader bare RN matrix remains manual.

Each run also has one planning/test job and one shared library build/package job:
**15 jobs for regular coverage, 47 for manual full coverage**. Matrix jobs can
run concurrently, subject to GitHub runner availability and organization limits. The table above shows the complete manual matrix.

The compatibility rules match the pinned Worklets packages' published RN peer
ranges. For example, Worklets 0.13 supports RN 0.86–0.88, whereas 0.12 supports
0.83–0.87. The manual `full` scope builds every compatible combination of the declared pins;
this does not test every patch release or expand support to Worklets 0.14.
Expo RN/React/build-properties pins follow each SDK's `bundledNativeModules.json`.
SDKs 55 and 56 bundle Worklets below this library's minimum; these fixtures
explicitly install 0.10.4, as required by the integration documentation. SDKs 57
and 58 use 0.13.0. These are native prebuild tests, not Expo Go or EAS tests.

blob-util is pinned to 0.25.1 for RN 0.83 and 1.0.0 for newer RN versions, because
blob-util 1.0 requires RN >=0.84.

All builds are Release. Android uses Java 17, the hosted runner's preinstalled
SDK, and R8. Regular Linux/Windows Android builds target arm64; the Linux runtime
app targets x86_64 for the emulator. Windows uses `windows-2025` and a short
`C:\rnet\app` consumer path, with direct npm JavaScript entry points instead of
spawning `.cmd` scripts. iOS builds run on Apple Silicon macOS 26: regular cells
archive for devices, while the runtime cell builds for a simulator.

App source lives in [apps/consumer-fixtures](../../apps/consumer-fixtures/), which
intentionally has no package manifest and is not a workspace. CI helpers stay in
`.github/consumer-builds/`. Preparation copies the app source into an isolated
consumer outside the repository.

Other framework linkage variants, backend subsets, Debug, RN nightly, EAS and OTA
remain separate coverage to add.

## What it checks

- The publishing script packs built JavaScript, declarations, native sources and
  the license, without bundling dependencies or downloaded native artifacts.
- npm installs the tarball and executes the real native-library postinstall hook.
- Bare RN and Expo autolinking, Worklets Babel configuration, native compilation,
  release JS bundling, and Android R8 complete successfully.
- APKs contain RNE, ExecuTorch, XNNPACK and Vulkan shared libraries for the
  selected ABI.
- iOS archives contain the application executable and JS bundle. When the package
  ships its privacy manifest, the resource bundle must appear in the archive and
  pass `plutil` validation.

All optional native libraries for the selected platform are enabled. Postinstall
fetches only that platform via `RNET_TARGET`. This does not test cross-host Expo
fingerprint equality or backend opt-outs.

## Production packaging and integration coverage

The latest regular Expo Android/Linux cell also runs `bundleRelease`, reusing
its compiled app. A pinned, SHA-256-verified bundletool validates the AAB; checks
require the JS bundle, dex, manifest, and arm64 RNE, ExecuTorch, XNNPACK and
Vulkan libraries. The AAB and validation logs are retained. This checks bundle
packaging, not Play Store upload acceptance or production signing.

Two latest-Expo build-only cells install Sentry 8.35.0, React Native Firebase
27.1.1 (App), Vision Camera 4.7.3, and audio-api 0.13.6 alongside RNE and Worklets.
Versions live in `compatibility.json`. Audio-api matches the repository apps;
Vision Camera 4 includes the Expo config plugin (version 5 does not ship it).
All four config plugins run during prebuild. Checks verify generated camera and
microphone permissions, iOS background audio, Firebase service configuration,
Sentry build hooks, and dynamic iOS frameworks required by Firebase 27. The app
references each library so Release bundling resolves its JS; native builds check
autolinking and linking on both platforms.

Firebase configuration is synthetic and points to no real project. Sentry uses
its Expo Metro integration, with upload disabled for these credential-free
builds. These cells do not launch the app or test service connectivity, camera
capture, audio recording, or telemetry delivery.

This extends #1609 with Android AAB packaging, iOS camera/audio build coexistence,
and Expo config-plugin coexistence. Linux/Windows hosts and bundled `.pte` are
already covered separately; EAS, OTA delivery and App Store upload validation
remain outstanding. Split combined checklist rows before marking only their
covered parts complete.

## Runtime smoke checks

Only the two latest-Expo smoke cells launch an app. They assert:

1. Native tensor allocation, data transfer and softmax produce expected values.
2. A sliced typed array survives a worklet round trip and native tensor use.
3. A bundled selfie-segmentation model loads with `XnnpackBackend` and executes
   on the worklet runtime, replacing NaN sentinel outputs with finite probabilities.

The approximately 486 KB model is downloaded during preparation at the exact
revision and SHA-256 used by the host-test fixture script. It is bundled as a
`.pte` asset and resolved to a local file by `expo-asset`. No model binary is
committed, and the app does not fetch a model from the network at runtime.

A loopback HTTP collector waits for a report containing all three assertions and
a per-build random token. App crashes, missing reports, assertion failures and
incomplete reports fail CI. The reporter's own tests verify those failure paths.
Android reaches the collector through `adb reverse`; iOS uses simulator loopback.
Simulator boot has a separate ten-minute deadline to allow first-boot data
migration. The three-minute assertion deadline starts immediately before app
launch, after boot and installation. Simulator boot output is saved in
`simulator-boot.log`; cleanup commands are limited to fifteen seconds each.
Cleartext loopback access is enabled only in the smoke fixtures. Native/runtime
logs and the successful report are retained in the cell's artifact.

This verifies XNNPACK inference on emulators/simulators. It does not establish
Core ML, Vulkan or MLX inference, real camera/audio behavior, App Store validation,
EAS or OTA compatibility. Version build cells remain build-only checks.

## Run locally

Use Node from `.nvmrc`, the repository's Yarn version, and the toolchains in the
[verification skill](../../.agents/skills/verify-and-build/SKILL.md). From the
repository root:

```bash
RNET_SKIP_DOWNLOAD=1 yarn install --immutable
(cd packages/react-native-executorch && RNET_SKIP_DOWNLOAD=1 RNE_SKIP_INSTALL=1 GIT_LFS_SKIP_SMUDGE=1 ./scripts/create-package.sh)

# Use a new directory outside the checkout. Leave RNET_SKIP_DOWNLOAD unset.
node .github/consumer-builds/prepare.mjs expo-55 android \
  packages/react-native-executorch/react-native-executorch-1.0.0.tgz \
  /tmp/ConsumerBuild

cd /tmp/ConsumerBuild/android
./gradlew :app:assembleRelease --no-daemon --stacktrace --max-workers=2
```

Adjust the tarball filename to the package version. For iOS, pass `ios` instead
of `android`, run `pod install` in the generated `ios/` directory, then use the
workflow's archive command. `expo-55`, `expo-56`, `expo-57` and `expo-58` work on either platform. iOS app
deployment targets are at least 17.0, preserving a higher RN requirement.
Use `expo-58-integration` for the plugin fixture, setting
`SENTRY_DISABLE_AUTO_UPLOAD=true` when running native builds.
To reproduce AAB coverage, run `:app:bundleRelease` in the regular latest-Expo
Android project and use `validate-aab.mjs <bundle.aab> <tool-cache> <logs>` from
the checkout with Java 17 on PATH.

Compatibility data pins the framework, Worklets, blob-util and CLI; other template and
transitive dependencies are resolved on each run. Every cell retains its resolved
profile, npm lockfile, Gradle files, Podfile configuration and lockfile when present, native
library configuration and logs in a seven-day artifact. Android artifacts also
contain the APK and, for the AAB cell, the app bundle; full iOS archives are not uploaded. No successful-build marker
cache skips compilation of a new library commit.

## Maintain the matrix

Update the JSON pins and compatibility declarations deliberately, checking the
published npm peer requirements. Every configured RN minor must have a compatible
Worklets version, every Worklets RN declaration must name a configured RN minor,
and Expo must use a declared compatible pair. The newest Expo profile also pins
`expoAsset` for the bundled-model smoke app. Windows and runtime cells follow
that newest profile automatically, as do the integration cells and AAB selection.
Review the `integrations` pins against the new RN/Expo versions when upgrading;
repeat both platform builds to establish compatibility. The tests verify full combination
coverage, unique artifact ids, default host/runtime selection and smoke report failures. The planning job reports
the actual build count in the GitHub job summary; update the table and expected
counts in the tests when changing support.

```bash
node --test .github/consumer-builds/*.test.mjs
node .github/consumer-builds/matrix.mjs full
node --check .github/consumer-builds/prepare.mjs
actionlint .github/workflows/consumer-builds.yml
yarn prettier --ignore-path /dev/null --check '.github/consumer-builds/*' '.github/workflows/consumer-build*.yml' 'apps/consumer-fixtures/*.jsx'
```

Exercise preparation and the affected platform build after changing templates or
build commands. `.github` is excluded by the repository's default Prettier ignore
file, so formatting these files needs `--ignore-path /dev/null`.
