# Troubleshooting

Failures that come from how a project is set up rather than from the library itself. Each one is reproducible against `0.10.0`, so the symptom is quoted exactly — search this page for the error you got.

## `Build input files cannot be found` after install[​](#build-input-files-cannot-be-found-after-install "Direct link to build-input-files-cannot-be-found-after-install")

```text
error: Build input files cannot be found:
'.../XnnpackBackend.xcframework/ios-arm64-simulator/libXnnpackBackend.a'

```

The native artifacts are not in the npm tarball. They are downloaded by a **postinstall** hook, and your package manager skipped it:

* **pnpm 10 and later block dependency build scripts by default** and print `Ignored build scripts: react-native-executorch` during install.
* `--ignore-scripts`, and `npm ci --ignore-scripts`, do the same.

Nothing fails at that point — not even `pod install`, which does not check that a vendored framework exists — so the error only appears once Xcode goes looking for the file. Re-run the hook:

```bash
pnpm approve-builds react-native-executorch   # pnpm
npm rebuild react-native-executorch           # npm
node node_modules/react-native-executorch/scripts/download-libs.js

```

## `Multiple commands produce .../Headers/Types.h`[​](#multiple-commands-produce-headerstypesh "Direct link to multiple-commands-produce-headerstypesh")

An app built with `use_frameworks!` — directly, as Firebase requires, or through expo-build-properties' `"useFrameworks": "static"` — makes CocoaPods build the pod as a framework and flat-copy its public headers into one directory. `0.10.0` publishes every header, and several share a basename, so the build fails while it is still being planned.

Force the pod back to a static library in your `Podfile`:

```ruby
pre_install do |installer|
  installer.pod_targets.each do |pod|
    if pod.name == 'react-native-executorch'
      def pod.build_type
        Pod::BuildType.static_library
      end
    end
  end
end

```

Expo SDK 55 and later already do this for you: their autolinking downgrades every pod that vendors an `.xcframework` to a static library, which is why an Expo app usually never sees this. Setting `buildReactNativeFromSource: true` turns that off again.

## `transitive dependencies that include statically linked binaries`[​](#transitive-dependencies-that-include-statically-linked-binaries "Direct link to transitive-dependencies-that-include-statically-linked-binaries")

```text
[!] The 'Pods-YourApp' target has transitive dependencies that include
statically linked binaries: (.../opencv-rne/opencv2.xcframework)

```

`use_frameworks!` with no argument means **dynamic** linkage, which CocoaPods refuses to combine with a statically linked dependency. Ask for static frameworks instead:

```ruby
use_frameworks! :linkage => :static

```

## `frameworks with conflicting names: opencv2.xcframework`[​](#frameworks-with-conflicting-names-opencv2xcframework "Direct link to frameworks-with-conflicting-names-opencv2xcframework")

Another pod vendors OpenCV under the same framework name — `react-native-fast-opencv` (via `FastOpenCV-iOS`) is the common one — and CocoaPods installs only one framework called `opencv2`. On `0.10.0` the two cannot be installed together.

If you do not use this library's vision tasks, drop its OpenCV:

```json
{
  "react-native-executorch": {
    "backends": ["xnnpack", "coreml", "mlx"],
    "libs": ["phonemis"]
  }
}

```

Re-run your package manager's install afterwards. See [Native Libraries](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/native-libraries.md) for what each entry covers — leaving `opencv` out disables every computer-vision task.

## `None of the architectures in ARCHS (x86_64) are valid`[​](#none-of-the-architectures-in-archs-x86_64-are-valid "Direct link to none-of-the-architectures-in-archs-x86_64-are-valid")

The library ships `arm64` slices only, and the podspec excludes `x86_64` from simulator builds. **Intel Macs cannot build for the iOS simulator**, and neither can an Apple silicon Mac running Xcode under Rosetta, or an Intel macOS CI image. Use an Apple silicon machine, or a physical device.

## `The platform of the target ... may not be compatible`[​](#the-platform-of-the-target--may-not-be-compatible "Direct link to the-platform-of-the-target--may-not-be-compatible")

```text
[!] The platform of the target `YourApp` (iOS 16.4) may not be compatible with
`react-native-executorch (0.10.0)` which has a minimum requirement of iOS 17.0.

```

This is a **warning**, so `pod install` still succeeds and the failure surfaces later. The library needs iOS 17. In an Expo app, set it explicitly — the default is lower:

```json
[
  "expo-build-properties",
  { "ios": { "deploymentTarget": "17.0" } }
]

```

## The `react-native-executorch` config block is ignored[​](#the-react-native-executorch-config-block-is-ignored "Direct link to the-react-native-executorch-config-block-is-ignored")

The postinstall hook reads the block from the directory where the install was invoked (`INIT_CWD`). In a monorepo that is the **workspace root**, so a block in `apps/mobile/package.json` is never seen — put it in the root `package.json` instead. Check `node_modules/react-native-executorch/rne-build-config.json` after installing to confirm which flags were written.

## An old Android device or emulator crashes on load[​](#an-old-android-device-or-emulator-crashes-on-load "Direct link to An old Android device or emulator crashes on load")

Two separate causes, and both end in the same runtime failure.

The shipped `.so` files are built against **API 26**, while `0.10.0` declares `minSdkVersion 21`, so nothing stops a lower-API build. Raise it in your app's `android/build.gradle`:

```groovy
ext {
    minSdkVersion = 26
}

```

Native code is also shipped for `arm64-v8a` and `x86_64` only. A build that produces `armeabi-v7a` or `x86` splits (React Native's default `reactNativeArchitectures` lists all four) will package those without the library's `.so`, and loading it fails at runtime on such a device. Restrict the app to the supported ABIs in `android/gradle.properties`:

```properties
reactNativeArchitectures=arm64-v8a,x86_64

```
