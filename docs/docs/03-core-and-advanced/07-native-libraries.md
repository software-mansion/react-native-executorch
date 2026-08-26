---
title: Native Libraries
slug: /fundamentals/native-libraries
description: 'How React Native ExecuTorch downloads, ships, and links native binaries on demand.'
keywords:
  [react native executorch, executorch, native libraries, backends, xnnpack, coreml, mlx, vulkan]
---

React Native ExecuTorch ships the ExecuTorch runtime, hardware backends, and third-party libraries as **separate downloadable artifacts**. At install time, a `postinstall` script pulls only what your app needs — by default, everything is enabled.

## How it works

1. **Reads config** from the `react-native-executorch` block in your `package.json` (if any).
2. **Writes `rne-build-config.json`** with boolean flags that the native build reads.
3. **Downloads binaries** from the GitHub Release tagged with your package version, verifying checksums.
4. **Caches them** under `~/.cache/react-native-executorch/<version>/`.

## Configuration

Add a `react-native-executorch` block to your `package.json`:

```json
{
  "react-native-executorch": {
    "features": ["classification", "styleTransfer"]
  }
}
```

### Options

| Option     | Purpose                                                       | Example values                                |
| ---------- | ------------------------------------------------------------- | --------------------------------------------- |
| `features` | High-level tasks — each expands to the backends/libs it needs | `"classification"`, `"llm"`, `"speechToText"` |
| `backends` | Hardware backends directly                                    | `"xnnpack"`, `"coreml"`, `"mlx"`, `"vulkan"`  |
| `libs`     | Extra native libraries                                        | `"opencv"`, `"phonemis"`                      |

The three lists are merged, so you can mix them. Re-run your install after editing.

### Features

| Feature                | Backends                | Extra libs |
| ---------------------- | ----------------------- | ---------- |
| `llm`                  | xnnpack, mlx            | —          |
| `multimodalLLM`        | xnnpack, mlx, vulkan    | opencv     |
| `privacyFilter`        | xnnpack, mlx            | —          |
| `speechToText`         | xnnpack, coreml         | —          |
| `textToSpeech`         | xnnpack                 | phonemis   |
| `vad`                  | xnnpack                 | —          |
| `textEmbeddings`       | xnnpack, mlx            | —          |
| `imageEmbeddings`      | xnnpack                 | opencv     |
| `classification`       | xnnpack, coreml         | opencv     |
| `objectDetection`      | xnnpack, coreml         | opencv     |
| `keypointDetection`    | xnnpack, coreml, mlx    | opencv     |
| `semanticSegmentation` | xnnpack                 | opencv     |
| `instanceSegmentation` | xnnpack, coreml         | opencv     |
| `ocr`                  | xnnpack, coreml, vulkan | opencv     |
| `verticalOCR`          | xnnpack                 | opencv     |
| `styleTransfer`        | xnnpack, coreml         | opencv     |
| `textToImage`          | xnnpack                 | opencv     |
| `segmentAnything`      | xnnpack, coreml         | opencv     |
| `tokenizer`            | —                       | —          |

### Platform notes

- **Core ML** — iOS only
- **MLX** — iOS only, device slice only (no simulator)
- **Vulkan** — Android only
- **OpenCV** — iOS via `opencv-rne` CocoaPod; Android as static libraries
- **phonemis** — compiled from source when enabled

## Environment variables

| Variable             | Purpose                                                                    |
| -------------------- | -------------------------------------------------------------------------- |
| `RNET_SKIP_DOWNLOAD` | Skip the network download (useful on CI)                                   |
| `RNET_BASE_URL`      | Override the download URL (e.g. `http://localhost:8080` for local testing) |
| `RNET_NO_X86_64`     | Skip the x86_64 Android emulator slice                                     |
| `RNET_HEADERS_ONLY`  | Fetch only headers, no native libs (for IDE tooling)                       |

## Downloaded artifacts

| Artifact                 | Target  | Contents                                                |
| ------------------------ | ------- | ------------------------------------------------------- |
| `headers`                | any     | ExecuTorch + c10/torch + tokenizer + OpenCV headers     |
| `core-android-arm64-v8a` | Android | `libexecutorch.so` + `executorch.jar`                   |
| `core-android-x86_64`    | Android | `libexecutorch.so` (emulator)                           |
| `xnnpack-android-*`      | Android | `libxnnpack_executorch_backend.so`                      |
| `vulkan-android-*`       | Android | `libvulkan_executorch_backend.so`                       |
| `opencv-android-*`       | Android | Static OpenCV + KleidiCV HAL                            |
| `core-ios`               | iOS     | `ExecutorchLib.xcframework`                             |
| `xnnpack-ios`            | iOS     | `XnnpackBackend.xcframework`                            |
| `coreml-ios`             | iOS     | `CoreMLBackend.xcframework`                             |
| `mlx-ios`                | iOS     | `MLXBackend.xcframework` (device only) + `mlx.metallib` |

## Why backends must be force-loaded

ExecuTorch registers kernels via `__attribute__((constructor))` functions — they run at load time with no external callers. Without force-loading (`-force_load` on iOS, `--whole-archive` on Android), the linker strips the registration symbols and you get `Missing operator: ...` at inference.

## Building from source

The binaries come from [`software-mansion-labs/executorchrne-split-build`](https://github.com/software-mansion-labs/executorch/tree/rne-split-build).

**Android:**

```bash
export ANDROID_NDK=$HOME/Library/Android/sdk/ndk/27.1.12297006
EXECUTORCH_BUILD_VULKAN=ON \
EXECUTORCH_BUILD_XNNPACK_BACKEND_SHARED=ON \
ANDROID_ABI=arm64-v8a ./scripts/build_android_library.sh
```

**iOS:**

```bash
rm -rf cmake-out
./scripts/build_apple_frameworks.sh --Release
```

**Package and upload:**

```bash
./scripts/package-release-artifacts.sh
```

Upload the tarballs from `dist-artifacts/` as GitHub Release assets. To test locally:

```bash
cd packages/react-native-executorch/dist-artifacts
python3 -m http.server 8080 &
RNET_BASE_URL=http://localhost:8080 yarn install
```
