---
title: Native Libraries & Backend Splitting
slug: /fundamentals/native-libraries
description: 'How React Native ExecuTorch produces, ships, and links its native binaries on demand, with each ExecuTorch backend split into its own downloadable artifact.'
keywords:
  [
    react native executorch,
    executorch,
    native libraries,
    backend splitting,
    xnnpack,
    coreml,
    mlx,
    vulkan,
    on-device ai,
  ]
---

This page explains how the native dependencies (the ExecuTorch runtime, the hardware backends, OpenCV) are produced, shipped, and stitched into an app build. For the app-author summary — how to opt into a subset — see the [Selecting native libraries](./01-getting-started.md#selecting-native-libraries) section of Getting Started. This page is aimed at maintainers and anyone curious about how the split works under the hood.

## Why split the backends?

Every backend (XNNPACK, Core ML, MLX, Vulkan) and OpenCV adds size and build time. Instead of bundling one monolithic native library with everything baked in, each backend ships as its **own downloadable artifact**, and an app pulls only the ones it declares. The result is smaller apps and faster builds, with the full set still available by default.

## High-level flow

```
 ┌──────────────────────┐      ┌────────────────────────┐      ┌───────────────────────┐
 │  ExecuTorch fork     │ ───▶ │  GitHub Release v<ver> │ ───▶ │  postinstall script   │
 │  @ms/separate-       │      │  <artifact>.tar.gz     │      │  download-libs.js     │
 │  backends            │      │  <artifact>.tar.gz.256 │      │                       │
 └──────────────────────┘      └────────────────────────┘      └───────────┬───────────┘
                                                                            │
                                                                            ▼
                                                                ┌───────────────────────┐
                                                                │  third-party/android  │
                                                                │  third-party/ios      │
                                                                │  third-party/include  │
                                                                │  rne-build-config.json│
                                                                └───────────┬───────────┘
                                                                            │
                                          ┌─────────────────────────────────┴───────────────────────────┐
                                          ▼                                                              ▼
                              ┌───────────────────────┐                            ┌──────────────────────────┐
                              │  android/             │                            │  react-native-executorch  │
                              │  build.gradle.kts     │                            │  .podspec                 │
                              │  + CMakeLists.txt     │                            │    RNE_ENABLE_*           │
                              │    -DRNE_ENABLE_*     │                            │    force_load xcframeworks │
                              └───────────────────────┘                            └──────────────────────────┘
```

## Install-time: `scripts/download-libs.js`

Runs at `postinstall`. Responsibilities:

1. Read `react-native-executorch.{backends, libs, features}` from the app's `package.json` (via `INIT_CWD`). Each array is optional; `features` is expanded through `FEATURE_MAP` into (backends, libs) and merged with the explicit arrays. With no config, everything defaults to enabled. The legacy `extras` field is rejected with a migration error.
2. Write `rne-build-config.json` at the package root with boolean flags (`enableXnnpack`, `enableCoreml`, `enableMlx`, `enableVulkan`, `enableOpencv`, `enablePhonemis`). This file is the single source of truth consumed by both the Gradle build and the podspec.
3. Detect targets (`ios` on macOS; always `android-arm64-v8a` and, unless `RNET_NO_X86_64` is set, `android-x86_64`).
4. For each target × enabled backend/lib, fetch the matching `<artifact>.tar.gz` from the GitHub Release tagged `v<package-version>`, verify its `.sha256`, and extract it into `third-party/`. Platform-independent headers ride in a single always-downloaded `headers.tar.gz`.
5. Cache validated tarballs under `~/.cache/react-native-executorch/<version>/` so later installs skip the network.

Environment overrides: `RNET_SKIP_DOWNLOAD`, `RNET_LIBS_CACHE_DIR`, `RNET_TARGET`, `RNET_NO_X86_64`, `RNET_BASE_URL` (point it at a local `python3 -m http.server` serving `dist-artifacts/` for local iteration), and `GITHUB_TOKEN` (needed for draft releases).

The artifacts per target:

| Artifact name            | Target  | Contents                                                       |
| ------------------------ | ------- | -------------------------------------------------------------- |
| `headers`                | any     | ExecuTorch + c10/torch + tokenizer + OpenCV headers (platform-independent) |
| `core-android-arm64-v8a` | Android | `libexecutorch.so` (no backends) + the ABI-independent `executorch.jar` |
| `core-android-x86_64`    | Android | x86_64 `libexecutorch.so` for the emulator                     |
| `xnnpack-android-*`      | Android | `libxnnpack_executorch_backend.so` (separately loaded)         |
| `vulkan-android-*`       | Android | `libvulkan_executorch_backend.so` (separately loaded)          |
| `opencv-android-*`       | Android | Static OpenCV + KleidiCV HAL                                   |
| `core-ios`               | iOS     | `ExecutorchLib.xcframework` + merged ExecuTorch `.a` slices    |
| `xnnpack-ios`            | iOS     | `XnnpackBackend.xcframework`                                   |
| `coreml-ios`             | iOS     | `CoreMLBackend.xcframework`                                    |
| `mlx-ios`                | iOS     | `MLXBackend.xcframework` (device slice only) + `mlx.metallib`  |

iOS OpenCV is **not** a tarball — it is consumed through the `opencv-rne` CocoaPod. `phonemis` has **no** tarball either — it is a git submodule at `third-party/common/phonemis` compiled from source when enabled.

### Header provenance

`headers.tar.gz` is assembled by `scripts/vendor-headers.sh`, which is needed because the executorch header surface spans **four** sources — a copy of the CMake install tree alone is incomplete (it omits the source-only headers such as `extension/llm/{runner,custom_ops,apple}`, which the rewrite's LLM/multimodal tasks compile against directly):

1. **ExecuTorch C++ source headers** (`runtime`, `extension`, `kernels`, … from the executorch checkout) — the full public surface incl. the LLM runner helpers and the bundled tokenizer third-party (`abseil-cpp`/`re2`/`json`/…).
2. **Build-generated / installed headers** (`cmake-out*/include`) — flatbuffer `*_generated.h` and codegen'd `kernels/*/Functions.h`.
3. **c10 / torch** from the assembled `executorch.xcframework` public headers.
4. **opencv2** from the OpenCV prebuilt (same source as the `opencv-rne` pod), since OpenCV is not built from executorch.

Run it before `package-release-artifacts.sh`:

```bash
./scripts/vendor-headers.sh <executorch-dir> <opencv-include-dir>
```

Headers are **downloaded, not committed**.

## Build-time: Android

`android/build.gradle.kts` reads `rne-build-config.json` once (via `JsonSlurper`, falling back to all-on if the file is missing) and forwards the booleans to CMake:

```kotlin
"-DRNE_ENABLE_OPENCV=${rneFlag("enableOpencv")}",
"-DRNE_ENABLE_PHONEMIS=${rneFlag("enablePhonemis")}",
"-DRNE_ENABLE_XNNPACK=${rneFlag("enableXnnpack")}",
"-DRNE_ENABLE_VULKAN=${rneFlag("enableVulkan")}"
```

It also honours the app's `reactNativeArchitectures` Gradle property, so a device build that requests only `arm64-v8a` provisions and links only that ABI.

`android/CMakeLists.txt` responds by:

- Adding `-DRNE_ENABLE_OPENCV` / `-DRNE_ENABLE_PHONEMIS` compile definitions so C++ code can `#ifdef` around optional dependencies.
- Compiling the OpenCV-dependent source group and linking the static `libopencv_*.a` + KleidiCV HAL (arm64 only) when `RNE_ENABLE_OPENCV=ON`.
- Always importing and linking the prebuilt `libexecutorch.so` from `third-party/android/libs/executorch/<abi>/`.
- When `RNE_ENABLE_XNNPACK=ON` / `RNE_ENABLE_VULKAN=ON`, importing the matching `libxnnpack_executorch_backend.so` / `libvulkan_executorch_backend.so` and linking against it. Linking (rather than `dlopen`) lets Gradle bundle the `.so` into the APK and makes the dynamic linker load it whenever the main library loads — each backend's load-time constructor then registers itself with the runtime in `libexecutorch.so`.
- Statically linking the OpenMP runtime (`-fopenmp -static-openmp`) to resolve the optimized-kernel symbols `libexecutorch.so` references.

## Build-time: iOS

`react-native-executorch.podspec` reads the same `rne-build-config.json` and:

- Excludes the OpenCV C++ source group from compilation when `enableOpencv` is false.
- Appends `-DRNE_ENABLE_*` to `OTHER_CPLUSPLUSFLAGS`.
- Assembles `OTHER_LDFLAGS` with a `-force_load` entry for each enabled backend xcframework. MLX is force-loaded on the **device slice only** (`sdk=iphoneos*`).
- Vendors `ExecutorchLib.xcframework` only — the backend xcframeworks live on the linker command line, never in the CocoaPods vendoring list (see below for why).
- Adds the `opencv-rne` pod dependency, the `CoreML` / `Metal` system frameworks, and the `mlx.metallib` bundle resource conditionally, based on which backends are enabled.

## Why backends must be force-loaded

ExecuTorch registers kernels statically via `__attribute__((constructor))` functions inside each backend's `.a` / `.so`. Two consequences:

1. **Force-load is required.** Linkers drop unreferenced object files. The registrar symbols have no external callers (they run as global constructors at load time), so a plain link keeps the backend library on disk but strips the registration symbols — and the app then fails with `Missing operator: ...` at inference. Every backend library must be force-loaded (`-force_load` on iOS, `--whole-archive` on Android).
2. **Exactly one copy of each CPU-kernel registration must exist.** Multiple backend libraries that each whole-archive-link the CPU ops cause duplicate-registration aborts when both are force-loaded into the same process.

On **iOS** each backend ships as its own static xcframework and the podspec force-loads only the opted-in ones; `ExecutorchLib.xcframework` itself does not whole-archive the CPU ops, so there is no duplication. On **Android** the fork builds each backend as a standalone shared library (`EXECUTORCH_BUILD_XNNPACK_BACKEND_SHARED` / `EXECUTORCH_BUILD_VULKAN_BACKEND_SHARED`) that links only its own archive plus `executorch_core` — no kernel-registration archives — so loading it on top of `libexecutorch.so` duplicates nothing.

## Building the artifacts

The binaries come from the ExecuTorch fork [`software-mansion-labs/executorch@ms/separate-backends`](https://github.com/software-mansion-labs/executorch/tree/@ms/separate-backends), which is already on ExecuTorch **1.3.1** (the same version as `main`). Bumping the `react-native-executorch` package version means re-rolling the Release artifacts from the corresponding fork commit.

> **MLX-iOS note.** Building the iOS MLX backend requires the MLX-iOS work that lives in the `@nk/mlx-ios` line. That branch merges into `@ms/separate-backends` conflict-free; after the merge a single `build_apple_frameworks.sh --Release` pass produces the full set including a real `libbackend_mlx_ios.a` and `mlx.metallib`. Only the **device** slice is built and shipped — the iOS simulator cannot drive MLX-on-Metal.

### Android

From the fork (with `@ms/separate-backends` checked out), per ABI:

```bash
export ANDROID_NDK=$HOME/Library/Android/sdk/ndk/27.1.12297006
EXECUTORCH_BUILD_VULKAN=ON \
EXECUTORCH_BUILD_VULKAN_BACKEND_SHARED=ON \
EXECUTORCH_BUILD_XNNPACK_BACKEND_SHARED=ON \
ANDROID_ABI=arm64-v8a ./scripts/build_android_library.sh   # repeat with x86_64
```

This emits `libexecutorch.so`, `libxnnpack_executorch_backend.so`, and `libvulkan_executorch_backend.so`. Strip each with the NDK `llvm-strip` before packaging.

### iOS

```bash
rm -rf cmake-out
./scripts/build_apple_frameworks.sh --Release
```

This produces the merged per-slice `.a` archives. RNE's `third-party/ios/ExecutorchLib/build.sh` then repackages them into `ExecutorchLib.xcframework` plus the per-backend xcframeworks (`XnnpackBackend`, `CoreMLBackend`, `MLXBackend`). CocoaPods requires the library file name to be identical across an xcframework's slices, which is why `build.sh` renames each slice before calling `xcodebuild -create-xcframework`.

### Packaging and uploading

Stage the built outputs into `third-party/`, then run:

```bash
./scripts/package-release-artifacts.sh
```

This writes every `<artifact>.tar.gz` + `.sha256` into `dist-artifacts/`. Upload all of them as assets on the `v<version>` GitHub Release. To test the download flow before publishing, serve the directory locally and point the script at it:

```bash
cd packages/react-native-executorch/dist-artifacts
python3 -m http.server 8080 &
RNET_BASE_URL=http://localhost:8080 yarn install
```

The same checksum verification runs, so a stale cache is still rejected.
