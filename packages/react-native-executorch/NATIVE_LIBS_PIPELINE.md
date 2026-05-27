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

| Artifact name            | Target  | Produced by                              | Contents                                               |
| ------------------------ | ------- | ---------------------------------------- | ------------------------------------------------------ |
| `core-android-arm64-v8a` | Android | ExecuTorch fork build                    | `libexecutorch.so` (no backends), headers              |
| `core-android-x86_64`    | Android | ExecuTorch fork build                    | x86_64 `libexecutorch.so` for the simulator            |
| `xnnpack-android-*`      | Android | ExecuTorch fork build                    | `libxnnpack_executorch_backend.so` (separately-loaded) |
| `vulkan-android-*`       | Android | ExecuTorch fork build                    | `libvulkan_executorch_backend.so` (separately-loaded)  |
| `core-ios`               | iOS     | `third-party/ios/ExecutorchLib/build.sh` | `ExecutorchLib.xcframework`                            |
| `xnnpack-ios`            | iOS     | `third-party/ios/ExecutorchLib/build.sh` | `XnnpackBackend.xcframework`                           |
| `coreml-ios`             | iOS     | `third-party/ios/ExecutorchLib/build.sh` | `CoreMLBackend.xcframework`                            |
| `opencv-android-*`       | Android | OpenCV release process                   | Static OpenCV + KleidiCV HAL                           |

(`opencv-ios` is not a tarball — iOS consumes OpenCV through the `opencv-rne` CocoaPod.)
(`phonemizer` has no tarball — phonemis is a git submodule at `third-party/common/phonemis` and is compiled from source on both Android and iOS when the extra is enabled.)

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
- Conditionally linking `libopencv_*.a` and KleidiCV HAL (arm64 only).
- When `RNE_ENABLE_PHONEMIZER=ON`, `add_subdirectory()`'ing the `third-party/common/phonemis` git submodule and linking the resulting `phonemis` CMake target into `libreact-native-executorch.so`. When off, the submodule is not entered and no phonemis code is compiled.
- Always linking against the prebuilt `libexecutorch.so` downloaded into `third-party/android/libs/executorch/<abi>/`.
- When `RNE_ENABLE_XNNPACK=ON` / `RNE_ENABLE_VULKAN=ON`, importing the matching `libxnnpack_executorch_backend.so` / `libvulkan_executorch_backend.so` and linking `react-native-executorch.so` against it. Linking (rather than dynamic `dlopen`) lets Gradle bundle the `.so` into the APK and triggers the dynamic linker to load it whenever `libreact-native-executorch.so` is loaded — each `.so`'s load-time constructor then registers its backend with the runtime in `libexecutorch.so`.

## Build-time: iOS

`react-native-executorch.podspec` reads the same `rne-build-config.json` and:

- Excludes opencv/phonemizer C++ sources from compilation when those extras are off.
- Conditionally adds `third-party/common/phonemis/src/**` to `s.source_files` (and excludes `phonemis/main.cpp`) so phonemis compiles into the pod when `enable_phonemizer` is true. The corresponding header path and `-DET_ON=1` flag are also gated.
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

Patched sources live in a separate repo (see `executorch/` in the maintainer's machine, typically checked out next to `react-native-executorch/`). The fork branch is [`msluszniak/executorch@ms/separate-backends`](https://github.com/msluszniak/executorch/tree/@ms/separate-backends), based on the upstream `release/1.2` tag, and the artifacts attached to the matching GitHub Release are produced from the pinned commit [`3ce953dbde73035e733442f99c082f5b6fedff5b`](https://github.com/msluszniak/executorch/commit/3ce953dbde73035e733442f99c082f5b6fedff5b). Bumping the `react-native-executorch` package version requires re-rolling the Release artifacts from a (possibly newer) pinned commit and updating this SHA. The branch carries (oldest → newest):

- **chore: remove version script from `executorch_jni`** — reverts the Feb 2026 symbol-hiding change so RNE's C++ layer can resolve `Module`, `threadpool`, etc. directly.
- **feat: build `vulkan_backend` as a separate shared library on Android** — adds the `EXECUTORCH_BUILD_VULKAN_BACKEND_SHARED` CMake option. When ON, `libvulkan_executorch_backend.so` is produced alongside `libexecutorch_jni.so` instead of vulkan_backend being whole-archive-linked into the latter. Mirrors the QNN backend pattern.
- **build: disable `-Werror` for `flatcc_ep` on host clang** — Apple clang 21+ flags warnings flatcc has not yet cleaned up; needed to build on Xcode 26.4+. Adds `-DFLATCC_ALLOW_WERROR=OFF` to the host-side `flatcc_ep` ExternalProject_Add in `third-party/CMakeLists.txt`.
- **feat: build `xnnpack_backend` as a separate shared library on Android** — same idea for XNNPACK via `EXECUTORCH_BUILD_XNNPACK_BACKEND_SHARED`. Also patches `extension/llm/custom_ops/CMakeLists.txt` to drop the (transitive) `xnnpack_backend` link when the switch is ON, so XNNPACK code does not leak into `libexecutorch_jni.so` via `custom_ops`.
- **chore: point tokenizers submodule at `software-mansion-labs/pytorch-tokenizers@build`** — replaces the old `meta-pytorch/tokenizers` pin with the SWM-internal build branch (`56a30afb…`). That branch carries support for new tokenizer types (Unigram, WordLevel) plus more normalizers / pre-tokenizers / decoders / post-processors. Headers in `third-party/include/executorch/extension/llm/tokenizers/` must match this commit; otherwise `HFTokenizer::setup_padding` / `setup_truncation` SIGSEGV when loading a real tokenizer.json.
- **build(android): forward `BACKEND_SHARED` env vars to cmake** — `build_android_library.sh` declared the `EXECUTORCH_BUILD_*_BACKEND_SHARED` env vars in surrounding docs but never passed them to cmake configure, so a fresh CMake configure produced backends baked into `libexecutorch_jni.so` even when the env vars were set.
- **fix(xnnpack): tolerate null ptr in `XNNWeightsCache::look_up_or_insert`** — `memcmp(ptr=NULL, saved_ptr, size)` crashed when XNNPACK re-checked the cache. Guard with `if (ptr == nullptr) ptr = saved_ptr;` before the compare.
- **build(android): pass `-DANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON`** — required for Android 16 KB-page devices (Pixel 9 / upcoming releases); without it the `.so` fails to map on those targets.
- **build(ios): keep merged intermediate `.a` files after `create_frameworks.sh`** — comments out the cleanup loop at the end of `create_frameworks.sh`. `build_apple_frameworks.sh` calls `create_frameworks.sh` to merge per-target archives via `libtool`, then deletes them by default. RNE's `third-party/ios/ExecutorchLib/build.sh` repackages those `.a` files into its own xcframeworks (with consistent slice library names that CocoaPods requires), so we need them to survive long enough to be repackaged.
- **build(ios): disable `XNNPACK_ENABLE_ARM_SME{,2}` on macOS / iOS presets** — the Apple SME backends in upstream XNNPACK fail to compile under Xcode 26's clang. Disable both for the `macos` / `ios` / `ios-simulator` presets in `CMakePresets.json` so the iOS build succeeds.
- **build(ios): disable `FLATCC_ALLOW_WERROR` on iOS / macOS presets** — the host-side `flatcc_ep` patch only affects the generator binary. Inside the iOS / macOS builds, flatcc's runtime (`flatccrt`) is rebuilt as a regular cmake target via `add_subdirectory(third-party/flatcc)`, which honors a separate cache variable. Pin `FLATCC_ALLOW_WERROR=OFF` for each Apple preset in `CMakePresets.json` so the runtime build also escapes Apple clang 21's stricter warnings (`-Wimplicit-int-conversion-on-negation`, `-Wunterminated-string-initialization`).

### iOS

Two-stage: the fork produces the merged per-slice `.a` files; RNE's `build.sh` repackages them into xcframeworks. Requires Xcode 26.x + Python 3.10.

> **iOS 26.4 simulator caveat.** Apps linked against the iOS 26.4 SDK fail `URLSessionConfiguration.background` downloads in the 26.4 simulator with `NSURLErrorUnknown`. Older SDK builds (e.g. 26.2) are unaffected, and physical devices behave normally. This is an Apple regression — there's no fix on our end. Either use an iOS 26.2 sim for `ExpoResourceFetcher`-driven testing, fall back to `FOREGROUND` session type temporarily, or test on a real device.

**1. Set up the Python env in the fork**

```bash
# from the executorch fork (with @ms/separate-backends checked out)
python3 -m venv .venv && source .venv/bin/activate
pip install certifi zstd                 # for tools/cmake/resolve_buck.py
pip install torch==2.11.0                # cmake's find_package_torch_headers needs the torch wheel
pip install -r requirements-dev.txt      # pyyaml, cmake, lintrunner, click — for codegen scripts
```

`install_executorch.sh` is **not** used: `torch_pin.py` pins a torch nightly (`2.11.0.dev20260215`) that's been pruned from the PyTorch nightly index, and the iOS build only needs the wheel installed for `find_package_torch_headers`. Pinning the matching stable `torch==2.11.0` is enough.

**2. Build merged `.a` files**

```bash
rm -rf cmake-out      # always start clean — partial builds cache stale CMake options
./scripts/build_apple_frameworks.sh --Release
```

This drives Buck2 + cmake for the `ios`, `ios-simulator`, and `macos` presets, then calls the patched `create_frameworks.sh` with the right `--directory` / `--framework` flags to merge per-target archives via `libtool`. Outputs land in `cmake-out/`:

- `cmake-out/libexecutorch_{ios,simulator,macos}.a`, `libexecutorch_llm_*`, `libkernels_*`, `libbackend_{xnnpack,coreml,mps}_*`, `libthreadpool_*` — the merged static archives the patched cleanup loop keeps around.
- `cmake-out/<framework>.xcframework` — produced by `xcodebuild -create-xcframework`, **not** what RNE consumes (RNE builds its own slimmer set via `ExecutorchLib/build.sh`).

> The Swift Package generation step at the very end of the script prints
> `error: local binary target '<name>_debug' at 'cmake-out/<name>_debug.xcframework' does not contain a binary artifact` for each framework. That's harmless — it only fires when `--Debug` artifacts are missing — and `--Release` exits 0 anyway. The `.a` files are produced before this step runs.

**3. Stage `.a` files into RNE**

Copy only the `_ios` and `_simulator` slices into `packages/react-native-executorch/third-party/ios/libs/executorch/`. Skip the `_macos` files (RNE doesn't ship a macOS slice). Per-slice list to copy:

```
libbackend_coreml_{ios,simulator}.a
libbackend_mps_{ios,simulator}.a
libbackend_xnnpack_{ios,simulator}.a
libexecutorch_{ios,simulator}.a
libexecutorch_llm_{ios,simulator}.a
libkernels_llm_{ios,simulator}.a
libkernels_optimized_{ios,simulator}.a
libkernels_quantized_{ios,simulator}.a
libkernels_torchao_{ios,simulator}.a
libthreadpool_{ios,simulator}.a
```

Keep the existing `libkleidiai_{ios,simulator}.a` — kleidiai is merged into `libexecutorch_llm_*.a` by upstream's framework definitions, but RNE's `ExecutorchLib.xcodeproj` still references the standalone libs explicitly. They're stable and don't need rebuilding.

The non-executorch prebuilts (`libs/cpuinfo/libcpuinfo.a`, `libs/pthreadpool/{physical-arm64-release,simulator-arm64-debug}/libpthreadpool.a`) live in their existing directories and are not produced by the executorch fork build — they ship as-is from prior tarballs.

Phonemis is now built from in-tree source (the `third-party/common/phonemis` git submodule, pinned via `.gitmodules` to <https://github.com/IgorSwat/Phonemis>). Initialize it with `git submodule update --init --recursive` after cloning — the podspec and Android CMake will pick it up automatically when `enable_phonemizer` is true.

**4. Build xcframeworks**

```bash
# from RNE
rm -rf packages/react-native-executorch/third-party/ios/ExecutorchLib.xcframework
rm -rf packages/react-native-executorch/third-party/ios/CoreMLBackend.xcframework
rm -rf packages/react-native-executorch/third-party/ios/XnnpackBackend.xcframework
cd packages/react-native-executorch/third-party/ios/ExecutorchLib
./build.sh
```

The script drives Xcode to archive the Obj-C++ wrapper for device and simulator, then uses `xcodebuild -create-xcframework` to produce:

- `output/ExecutorchLib.xcframework` — the high-level wrapper + ExecuTorch core + kernels + threadpool + MPS backend. Does **not** contain XNNPACK or CoreML code (those live in their own xcframeworks).
- `output/XnnpackBackend.xcframework` — repackaged from `third-party/ios/libs/executorch/libbackend_xnnpack_{ios,simulator}.a`.
- `output/CoreMLBackend.xcframework` — repackaged from `libbackend_coreml_{ios,simulator}.a`.

Move each `.xcframework` from `output/` up one level into `third-party/ios/`, then delete `output/` and `build/`.

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
