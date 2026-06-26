# third-party

Native ExecuTorch artifacts are split into **committed source** and
**on-demand binaries**.

## Committed to git

- `ios/ExecutorchLib/` — the Xcode project that wraps the prebuilt ExecuTorch
  static archives into `ExecutorchLib.xcframework` (used only when (re)building
  the iOS release artifacts).
- `common/phonemis` — git submodule (TTS phonemizer), built from source. Run
  `git submodule update --init` to fetch it.

## Downloaded on demand (NOT committed)

`scripts/download-libs.js` runs at **postinstall** and downloads the prebuilt
binaries from this repo's GitHub Releases (tag `v<package version>`), based on the
app's opted-in `backends` / `libs` / `features` (see the getting-started docs).
It writes `rne-build-config.json`, which the podspec and `android/build.gradle.kts`
read to gate `RNE_ENABLE_*` and link only the requested backends.

Extracted layout the podspec / `android/CMakeLists.txt` expect:

- `include/` — ExecuTorch + c10 + torch + `pytorch/tokenizers` + opencv headers
  (from `headers.tar.gz`, always downloaded; platform-independent)
- `android/libs/executorch/<abi>/libexecutorch.so` (+ `libxnnpack_executorch_backend.so`,
  `libvulkan_executorch_backend.so` when those backends are enabled)
- `android/libs/opencv/<abi>/*.a`, `android/libs/opencv-third-party/<abi>/libkleidicv*.a`
  (when opencv is enabled)
- `ios/ExecutorchLib.xcframework`, `ios/libs/executorch/*.a` (+ `mlx.metallib`),
  `ios/libs/{pthreadpool,cpuinfo}`
- `ios/{Xnnpack,CoreML,MLX}Backend.xcframework` (per enabled backend; MLX is the
  device slice only)

iOS OpenCV is provided via the `opencv-rne` CocoaPod, not a downloaded tarball.

## Provisioning / overrides (env vars for `download-libs.js`)

- `RNET_SKIP_DOWNLOAD=1` — skip download (CI / pre-cached libs); still writes config.
- `RNET_HEADERS_ONLY=1` — fetch only `headers.tar.gz` (no native libs), e.g. for
  clang-tidy / IDE tooling that needs include paths but never links the binaries.
- `RNET_NO_X86_64=1` — skip the `android-x86_64` (emulator) ABI.
- `RNET_BASE_URL=<url>` — override the release base URL (e.g. a local
  `python3 -m http.server` for testing).
- `RNET_TARGET=<target>` / `RNET_LIBS_CACHE_DIR=<dir>` / `GITHUB_TOKEN=<token>`.

The release tarballs are produced from the
`software-mansion-labs/executorch@ms/separate-backends` build via
`scripts/package-release-artifacts.sh`.
