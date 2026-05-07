# Native libraries pipeline

This document describes how native dependencies (ExecuTorch runtime, backends, OpenCV, phonemizer) are produced, shipped, and stitched into an app build. It is intended for maintainers — the user-facing summary lives in `docs/docs/01-fundamentals/01-getting-started.md`.

## High-level flow

```
 ┌──────────────────────┐      ┌────────────────────────┐      ┌───────────────────────┐
 │  ExecuTorch fork     │ ───▶ │  GitHub Release v<ver> │ ───▶ │  postinstall script   │
 │  + our patches       │      │  <artifact>.tar.gz     │      │  download-libs.js     │
 │  (separate repo)     │      │  <artifact>.tar.gz.256 │      │                       │
 └──────────────────────┘      └────────────────────────┘      └───────────┬───────────┘
                                                                            │
                                                                            ▼
                                                                ┌───────────────────────┐
                                                                │  third-party/android  │
                                                                │  third-party/ios      │
                                                                │  rne-build-config.json│
                                                                └───────────┬───────────┘
                                                                            │
                                                ┌───────────────────────────┴────────────────────────────┐
                                                ▼                                                        ▼
                                    ┌───────────────────────┐                              ┌─────────────────────────┐
                                    │  android/build.gradle │                              │  react-native-executorch │
                                    │  + CMakeLists.txt     │                              │  .podspec                │
                                    │    -DRNE_ENABLE_*     │                              │    -DRNE_ENABLE_*        │
                                    └───────────────────────┘                              │    force_load xcframeworks │
                                                                                           └─────────────────────────┘
```

## Install-time: `scripts/download-libs.js`

Runs at `postinstall`. Responsibilities:

1. Read `react-native-executorch.extras` from the app's `package.json` (uses `INIT_CWD`). Defaults to `["opencv", "phonemizer", "xnnpack", "coreml", "vulkan"]`.
2. Write `rne-build-config.json` at the package root with boolean flags — this file is the single source of truth consumed by both the Gradle build and the podspec.
3. Detect targets (`ios` on macOS; always `android-arm64-v8a` and, unless `RNET_NO_X86_64` is set, `android-x86_64`).
4. For each target × enabled extra, fetch the corresponding `<artifact>.tar.gz` from the GitHub Release tagged `v${PACKAGE_VERSION}`, verify the `.sha256`, and extract into `third-party/android/libs/` or `third-party/ios/`.
5. Cache validated tarballs under `~/.cache/react-native-executorch/<version>/` so subsequent installs skip the network.

Environment overrides: `RNET_SKIP_DOWNLOAD`, `RNET_LIBS_CACHE_DIR`, `RNET_TARGET`, `RNET_BASE_URL` (useful with `python3 -m http.server` against `dist-artifacts/` for local iteration), `GITHUB_TOKEN` (needed for draft releases).

The set of artifacts per target is defined in `getArtifacts()`:

| Artifact name                            | Target  | Produced by                              | Contents                                               |
| ---------------------------------------- | ------- | ---------------------------------------- | ------------------------------------------------------ |
| `core-android-arm64-v8a`                 | Android | ExecuTorch fork build                    | `libexecutorch.so` (no backends), headers              |
| `core-android-x86_64`                    | Android | ExecuTorch fork build                    | x86_64 `libexecutorch.so` for the simulator            |
| `xnnpack-android-*`                      | Android | ExecuTorch fork build                    | `libxnnpack_executorch_backend.so` (separately-loaded) |
| `vulkan-android-*`                       | Android | ExecuTorch fork build                    | `libvulkan_executorch_backend.so` (separately-loaded)  |
| `core-ios`                               | iOS     | `third-party/ios/ExecutorchLib/build.sh` | `ExecutorchLib.xcframework`                            |
| `xnnpack-ios`                            | iOS     | `third-party/ios/ExecutorchLib/build.sh` | `XnnpackBackend.xcframework`                           |
| `coreml-ios`                             | iOS     | `third-party/ios/ExecutorchLib/build.sh` | `CoreMLBackend.xcframework`                            |
| `opencv-android-*`                       | Android | OpenCV release process                   | Static OpenCV + KleidiCV HAL                           |
| `phonemizer-android-*`, `phonemizer-ios` | both    | phonemizer build                         | `libphonemis.a` (iOS: physical + simulator)            |

(`opencv-ios` is not a tarball — iOS consumes OpenCV through the `opencv-rne` CocoaPod.)

## Build-time: Android

`android/build.gradle` reads `rne-build-config.json` once and forwards the booleans to CMake:

```groovy
"-DRNE_ENABLE_OPENCV=${rneBuildConfig.enableOpencv ? 'ON' : 'OFF'}",
"-DRNE_ENABLE_PHONEMIZER=${rneBuildConfig.enablePhonemizer ? 'ON' : 'OFF'}",
"-DRNE_ENABLE_XNNPACK=${rneBuildConfig.enableXnnpack ? 'ON' : 'OFF'}",
"-DRNE_ENABLE_VULKAN=${rneBuildConfig.enableVulkan ? 'ON' : 'OFF'}"
```

`android/CMakeLists.txt` and `android/src/main/cpp/CMakeLists.txt` respond by:

- Adding `-DRNE_ENABLE_OPENCV` / `-DRNE_ENABLE_PHONEMIZER` compile definitions so C++ code can `#ifdef` around optional dependencies.
- Conditionally linking `libopencv_*.a`, KleidiCV HAL (arm64 only), and `libphonemis.a`.
- Always linking against the prebuilt `libexecutorch.so` downloaded into `third-party/android/libs/executorch/<abi>/`.
- When `RNE_ENABLE_XNNPACK=ON` / `RNE_ENABLE_VULKAN=ON`, importing the matching `libxnnpack_executorch_backend.so` / `libvulkan_executorch_backend.so` and linking `react-native-executorch.so` against it. Linking (rather than dynamic `dlopen`) lets Gradle bundle the `.so` into the APK and triggers the dynamic linker to load it whenever `libreact-native-executorch.so` is loaded — each `.so`'s load-time constructor then registers its backend with the runtime in `libexecutorch.so`.

## Build-time: iOS

`react-native-executorch.podspec` reads the same `rne-build-config.json` and:

- Excludes opencv/phonemizer C++ sources from compilation when those extras are off.
- Appends `-DRNE_ENABLE_*` to `OTHER_CPLUSPLUSFLAGS`.
- Assembles `OTHER_LDFLAGS[sdk=iphoneos*]` and `OTHER_LDFLAGS[sdk=iphonesimulator*]` with `-force_load` entries for each enabled backend xcframework.
- Declares `ExecutorchLib.xcframework` in `vendored_frameworks` but _not_ the backend xcframeworks — backend xcframeworks only live on the linker command line, never in the CocoaPods vendoring list (see next section for why).
- Adds `sqlite3` and the `CoreML` system framework to linkage only when Core ML is enabled.

## Why backends differ between platforms

ExecuTorch registers kernels statically via `__attribute__((constructor))` functions inside each backend's `.a`/`.so`. Two design points fall out of this:

1. **Force-load is required.** Linkers drop unreferenced object files. The registrar symbols have no external users (they run as global constructors at load time), so a plain link keeps the backend library on disk but strips the registration symbols — and the app then fails with `Missing operator: ...` at inference. Every backend library must be force-loaded (`-force_load` on iOS, `--whole-archive` on Android, or `executorch_target_link_options_shared_lib(...)` in ExecuTorch's own CMake helpers).

2. **A single copy of each CPU-kernel registration must exist.** Multiple backend libraries that each whole-archive-link `optimized_native_cpu_ops_lib` cause duplicate kernel-registration aborts (`error 22 EEXIST`) when both get force-loaded into the same process.

On **iOS**, each backend ships as its own static xcframework (`XnnpackBackend.xcframework`, `CoreMLBackend.xcframework`). The podspec force-loads only the ones the user opted into, and `ExecutorchLib.xcframework` itself does not whole-archive the CPU ops — so there is no duplicate registration.

On **Android**, the first iteration of the split hit a duplicate-registration abort (`Error::RegistrationAlreadyRegistered`, 0x16) because the ExecuTorch Android build whole-archive-linked the CPU ops (`optimized_native_cpu_ops_lib`, `custom_ops`, `quantized_ops_lib`, `register_prim_ops`) into each backend shared library, AND `extension/llm/custom_ops` PUBLIC-linked `xnnpack_backend` so XNNCompiler/XNNExecutor were getting WHOLE_ARCHIVE-pulled into `libexecutorch_jni.so` via `custom_ops`. Two fixes in the ExecuTorch fork resolve this:

1. New `EXECUTORCH_BUILD_XNNPACK_BACKEND_SHARED` and `EXECUTORCH_BUILD_VULKAN_BACKEND_SHARED` switches build `libxnnpack_executorch_backend.so` / `libvulkan_executorch_backend.so` linking only the backend's own static archive (--whole-archive) + the backend's schema/third-party deps + `executorch_core` — no kernel-registration archives. Loading either on top of `libexecutorch.so` does not duplicate any registration.
2. When `EXECUTORCH_BUILD_XNNPACK_BACKEND_SHARED=ON`, `extension/llm/custom_ops` drops the `xnnpack_backend` link (custom_ops doesn't actually call into XNNPACK anyway) so the WHOLE_ARCHIVE on `custom_ops` no longer drags XNNPACK code into `libexecutorch_jni.so`.

Result: each Android backend ships as its own opt-in tarball, mirroring the iOS xcframework setup.

## Building artifacts from the ExecuTorch fork

Patched sources live in a separate repo (see `executorch/` in the maintainer's machine, typically checked out next to `react-native-executorch/`). The fork branch is [`msluszniak/executorch@ms/separate-backends`](https://github.com/msluszniak/executorch/tree/@ms/separate-backends), and the artifacts attached to the matching GitHub Release are produced from the pinned commit [`1a5c0f2670bed1c17c71928d142cbbaee5be4160`](https://github.com/msluszniak/executorch/commit/1a5c0f2670bed1c17c71928d142cbbaee5be4160). Bumping the `react-native-executorch` package version requires re-rolling the Release artifacts from a (possibly newer) pinned commit and updating this SHA. The branch carries:

- **chore: remove version script from `executorch_jni`** — reverts the Feb 2026 symbol-hiding change so RNE's C++ layer can resolve `Module`, `threadpool`, etc. directly.
- **feat: build `vulkan_backend` as a separate shared library on Android** — adds the `EXECUTORCH_BUILD_VULKAN_BACKEND_SHARED` CMake option. When ON, `libvulkan_executorch_backend.so` is produced alongside `libexecutorch_jni.so` instead of vulkan_backend being whole-archive-linked into the latter. Mirrors the QNN backend pattern.
- **feat: build `xnnpack_backend` as a separate shared library on Android** — same idea for XNNPACK via `EXECUTORCH_BUILD_XNNPACK_BACKEND_SHARED`. Also patches `extension/llm/custom_ops/CMakeLists.txt` to drop the (transitive) `xnnpack_backend` link when the switch is ON, so XNNPACK code does not leak into `libexecutorch_jni.so` via `custom_ops`.
- **build: disable `-Werror` for `flatcc_ep` on host clang** — Apple clang 21+ flags warnings flatcc has not yet cleaned up; needed to build on Xcode 26.4+.

### iOS

From inside `packages/react-native-executorch/third-party/ios/ExecutorchLib/`:

```bash
./build.sh
```

The script drives Xcode to archive the Obj-C++ wrapper for device and simulator, then uses `xcodebuild -create-xcframework` to produce:

- `output/ExecutorchLib.xcframework` — the high-level wrapper + ExecuTorch core + baked-in CPU ops.
- `output/XnnpackBackend.xcframework` — repackaged from `third-party/ios/libs/executorch/libbackend_xnnpack_{ios,simulator}.a`.
- `output/CoreMLBackend.xcframework` — repackaged from `libbackend_coreml_{ios,simulator}.a`.

Producing the underlying `.a` files (executorch + backend static libs for both slices) is a separate step inside the ExecuTorch fork, outside the scope of this script — run the fork's iOS build instructions with XNNPACK and Core ML enabled, then drop the resulting `.a` files into `third-party/ios/libs/executorch/` before invoking `build.sh`.

CocoaPods constraint: inside an xcframework, the library file name must be identical across slices, which is why `build.sh` copies each slice into a temp directory and renames before calling `-create-xcframework`. Do not skip this step.

### Android

Use `scripts/build_android_library.sh` from the fork (with the `@ms/separate-backends` branch checked out). It already passes the right preset and flags. Just enable the two extras we need:

```bash
# from the executorch fork
export ANDROID_NDK=$HOME/Library/Android/sdk/ndk/27.1.12297006
EXECUTORCH_BUILD_VULKAN=ON \
EXECUTORCH_BUILD_VULKAN_BACKEND_SHARED=ON \
EXECUTORCH_BUILD_XNNPACK_BACKEND_SHARED=ON \
ANDROID_ABI=arm64-v8a ./scripts/build_android_library.sh   # repeat with x86_64
```

Outputs land in `cmake-out-android-<abi>/extension/android/`:

- `libexecutorch_jni.so` → copy to `third-party/android/libs/executorch/<abi>/libexecutorch.so` (note the rename).
- `libxnnpack_executorch_backend.so` → copy to the same directory under its own name.
- `libvulkan_executorch_backend.so` → copy to the same directory under its own name.

Strip all three with `$ANDROID_NDK/toolchains/llvm/prebuilt/*/bin/llvm-strip` before committing. The headers under `third-party/include/` must match the fork commit that produced the binary — a mismatch shows up as runtime `dlopen` / symbol errors.

### Packaging for a release

For each `<artifact>` tarball:

```bash
tar -czf <artifact>.tar.gz -C <staging-dir> .
sha256sum <artifact>.tar.gz > <artifact>.tar.gz.sha256   # or shasum -a 256
```

Staging-dir layout must mirror the destination (`download-libs.js` extracts with `tar -xzf` into `third-party/android/libs/` or `third-party/ios/` without any path stripping). So `core-android-arm64-v8a.tar.gz` contains a top-level `executorch/arm64-v8a/libexecutorch.so`, `cpuinfo/arm64-v8a/libcpuinfo.a`, etc.

Upload every `<artifact>.tar.gz` **and** its `<artifact>.tar.gz.sha256` as release assets under the `v<version>` tag on GitHub. Publishing the release (out of draft) makes them fetchable anonymously; until then, consumers need `GITHUB_TOKEN` with `repo:read`.

### Iterating locally

Drop built artifacts (plus `.sha256` files) into `packages/react-native-executorch/dist-artifacts/`, then run a static server and point the script at it:

```bash
cd packages/react-native-executorch/dist-artifacts
python3 -m http.server 8080 &
RNET_BASE_URL=http://localhost:8080 yarn install
```

This skips GitHub entirely and re-extracts from the local tarballs — the same checksum verification still runs, so stale caches still get rejected.
