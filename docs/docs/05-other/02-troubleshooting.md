---
title: Troubleshooting
slug: /other/troubleshooting
description: 'Build and install failures caused by a project setup React Native ExecuTorch cannot control, and what to do about each.'
keywords:
  [react native executorch, troubleshooting, use_frameworks, pnpm, opencv, cocoapods, simulator]
---

Failures that come from how a project is set up rather than from the library
itself. Each one is reproducible, so the symptom is quoted exactly — search
this page for the error you got.

## `Build input files cannot be found` after install

```
error: Build input files cannot be found:
'.../XnnpackBackend.xcframework/ios-arm64-simulator/libXnnpackBackend.a'
```

The native artifacts are not in the npm tarball. They are downloaded by a
**postinstall** hook, and your package manager skipped it:

- **pnpm 10 and later block dependency build scripts by default** and print
  `Ignored build scripts: react-native-executorch` during install.
- `--ignore-scripts`, and `npm ci --ignore-scripts`, do the same.

Nothing fails at that point — not even `pod install`, which does not check that
a vendored framework exists — so the error only appears once Xcode goes looking
for the file. Recent versions fail during `pod install` (and during the Android
configure phase) with this fix in the message instead. Re-run the hook:

```bash
pnpm approve-builds react-native-executorch   # pnpm
npm rebuild react-native-executorch           # npm
node node_modules/react-native-executorch/scripts/download-libs.js
```

## `Multiple commands produce .../Headers/Types.h`

An app built with `use_frameworks!` — directly, as Firebase requires, or through
expo-build-properties' `"useFrameworks": "static"` — makes CocoaPods build the
pod as a framework and flat-copy its public headers into one directory.
Versions up to 0.10.0 published every header, and several share a basename, so
the build fails while it is still being planned.

Update the library. On 0.10.0 exactly, force the pod back to a static library:

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

Expo SDK 55 and later already do this for you: their autolinking downgrades
every pod that vendors an `.xcframework` to a static library, which is why an
Expo app usually never sees this. Setting `buildReactNativeFromSource: true`
turns that off again.

## `transitive dependencies that include statically linked binaries`

```
[!] The 'Pods-YourApp' target has transitive dependencies that include
statically linked binaries: (.../opencv-rne/opencv2.xcframework)
```

`use_frameworks!` with no argument means **dynamic** linkage, which CocoaPods
refuses to combine with a statically linked dependency. Ask for static
frameworks instead:

```ruby
use_frameworks! :linkage => :static
```

## `frameworks with conflicting names: opencv2.xcframework`

Another pod vendors OpenCV under the same framework name — `react-native-fast-opencv`
(via `FastOpenCV-iOS`) is the common one — and CocoaPods installs only one
framework called `opencv2`.

Recent versions handle this for you: when `react-native-fast-opencv` is
installed alongside this library, we depend on the OpenCV it vendors instead of
our own, and compile against that copy's headers. `pod install` prints which one
it chose. Nothing to configure, and both libraries work in the same app.

To force the choice, name the pod that should provide OpenCV:

```json
{
  "react-native-executorch": {
    "opencvPod": "opencv-rne"
  }
}
```

`opencv-rne` is ours; any pod that vendors an `opencv2.xcframework` is accepted.
We only use `opencv2/core.hpp` and `opencv2/imgproc.hpp`, so an OpenCV 4.x build
serves. Forcing ours while another OpenCV is installed brings the conflict back,
which is what the setting is for when you would rather drop the other library.

If you do not use this library's vision tasks at all, drop its OpenCV instead:

```json
{
  "react-native-executorch": {
    "backends": ["xnnpack", "coreml", "mlx"],
    "libs": ["phonemis"]
  }
}
```

Re-run your package manager's install afterwards. See
[Native Libraries](../03-core-and-advanced/08-native-libraries.md) for what each
entry covers — leaving `opencv` out disables every computer-vision task.

## `None of the architectures in ARCHS (x86_64) are valid`

The library ships `arm64` slices only, and the podspec excludes `x86_64` from
simulator builds. **Intel Macs cannot build for the iOS simulator**, and neither
can an Apple silicon Mac running Xcode under Rosetta, or an Intel macOS CI
image. Use an Apple silicon machine, or a physical device.

## `The platform of the target ... may not be compatible`

```
[!] The platform of the target `YourApp` (iOS 16.4) may not be compatible with
`react-native-executorch (0.10.0)` which has a minimum requirement of iOS 17.0.
```

This is a **warning**, so `pod install` still succeeds and the failure surfaces
later. The library needs iOS 17. In an Expo app, set it explicitly — the default
is lower:

```json
[
  "expo-build-properties",
  { "ios": { "deploymentTarget": "17.0" } }
]
```

## The `react-native-executorch` config block is ignored

The postinstall hook reads the block from the directory where the install was
invoked (`INIT_CWD`), then from every `package.json` above the installed
package. In a hoisted monorepo both land on the **workspace root**, so a block
in `apps/mobile/package.json` is never seen — put it in the root `package.json`
instead. The install log names the manifest that won, and
`node_modules/react-native-executorch/rne-build-config.json` records which flags
were written.

## An old Android device or emulator crashes on load

Native code is shipped for `arm64-v8a` and `x86_64` only. A build that also
produces `armeabi-v7a` or `x86` splits (React Native's default
`reactNativeArchitectures` lists all four) will package those without the
library's `.so`, and loading it fails at runtime on such a device. Restrict the
app to the supported ABIs:

```properties
reactNativeArchitectures=arm64-v8a,x86_64
```

## `global.loadOCR is not a function`

The deprecated legacy API registers one `load*` global per task, and the tasks
backed by a native third-party library are only registered when that library is
compiled in. Opting out of `opencv` therefore drops the legacy vision hooks
(`useOCR`, `useVerticalOCR`, `useClassification`, `useObjectDetection`,
`usePoseEstimation`, `useStyleTransfer`, `useSemanticSegmentation`,
`useInstanceSegmentation`, `useImageEmbeddings`, `useTextToImage`), and opting
out of `phonemis` drops `useTextToSpeech`. They build fine and throw this on
first use. Add the library back under `libs`, or list a `feature` that expands
to it, in [Native Libraries](../03-core-and-advanced/08-native-libraries.md).
