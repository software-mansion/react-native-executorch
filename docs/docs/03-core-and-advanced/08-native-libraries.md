---
title: Native Libraries
slug: /core-and-advanced/native-libraries
description: 'How React Native ExecuTorch downloads, ships, and links native binaries on demand.'
keywords:
  [react native executorch, executorch, native libraries, backends, xnnpack, coreml, mlx, vulkan]
---

React Native ExecuTorch ships the core runtime, hardware-accelerated backends
(XNNPACK, Core ML, MLX, Vulkan), and native third-party libraries (OpenCV,
phonemis) as **separate downloadable artifacts**.

By default, **everything is downloaded and enabled**, so no configuration is
required to get started. However, because on-device AI backends and vision
libraries add substantial binary weight, you can tailor exactly what gets
pulled into your app. Declaring only the features or backends you use reduces
install times, speeds up builds, and significantly shrinks the final app bundle.
At install time, a postinstall script inspects your configuration and fetches only
the native artifacts your app needs.

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

| Option     | Purpose                                                                              | Accepted values                                                                                                                                                                                                                                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features` | High-level tasks — each automatically expands to the backends and libraries it needs | `"classification"`, `"imageEmbeddings"`, `"instanceSegmentation"`, `"keypointDetection"`, `"llm"`, `"multimodalLLM"`, `"objectDetection"`, `"ocr"`, `"privacyFilter"`, `"segmentAnything"`, `"semanticSegmentation"`, `"speechToText"`, `"styleTransfer"`, `"textEmbeddings"`, `"textToImage"`, `"textToSpeech"`, `"tokenizer"`, `"vad"`, `"verticalOCR"` |
| `backends` | Hardware acceleration backends directly                                              | `"xnnpack"`, `"coreml"`, `"mlx"`, `"vulkan"`                                                                                                                                                                                                                                                                                                              |
| `libs`     | Extra native C++ libraries                                                           | `"opencv"`, `"phonemis"`                                                                                                                                                                                                                                                                                                                                  |

The three lists are merged, so you can pair high-level `features` with specific `backends` or `libs`. Re-run your package manager install after editing.

:::note Monorepos
The block is read from the directory the install was run in, then from every
`package.json` above the installed package. A hoisted workspace resolves to the
**root** either way, so put the block there; an app that keeps its own
`node_modules` (pnpm, nohoist) is found from its own `package.json`.
`node_modules/react-native-executorch/rne-build-config.json` records what was
actually resolved, and the install log names the manifest it read.
:::

:::caution pnpm
pnpm 10 and later do not run dependency build scripts unless you allow them, so
the download never happens and the native build fails later on a missing file.
Run `pnpm approve-builds react-native-executorch` once. See
[Troubleshooting](../05-other/02-troubleshooting.md).
:::

### Backends

Hardware backends provide optimized execution kernels for specific processors and platforms. See the [ExecuTorch Backends documentation](https://docs.pytorch.org/executorch/stable/backends-section.html) for details on lowering and delegate compilation:

- **[XNNPACK](https://docs.pytorch.org/executorch/stable/backends/xnnpack/xnnpack-overview.html)** — High-efficiency floating-point and quantized neural network inference operators optimized for ARM and x86 CPUs. Supported on both **Android** and **iOS**.
- **[Core ML](https://docs.pytorch.org/executorch/stable/backends/coreml/coreml-overview.html)** — Apple's framework for hardware-accelerated machine learning on Apple Silicon, targeting the Apple Neural Engine (ANE) and GPU. Supported on **iOS only**.
- **[MLX](https://github.com/ml-explore/mlx)** — An array framework designed for efficient machine learning on Apple silicon via Metal compute shaders, used primarily for accelerated LLM generation. Supported on **iOS only** (physical device only, no simulator).
- **[Vulkan](https://docs.pytorch.org/executorch/stable/backends/vulkan/vulkan-overview.html)** — Cross-platform 3D graphics and compute API, leveraging mobile GPUs on **Android only** for accelerated neural network inference and tensor compute operations.

### Third-Party Libraries

- **[OpenCV](https://opencv.org/)** — High-performance computer vision library providing image transformations, color space conversions, resizing, and pixel format operations (used by vision pipelines and multimodal LLMs). Provided on iOS via CocoaPods and on Android as static prebuilt libraries.
- **[phonemis](https://github.com/IgorSwat/Phonemis)** — High-performance C++ library for Grapheme-to-Phoneme (G2P) conversion, delivering universal IPA phonemization as the frontend for [Text-to-Speech](../02-extensions/speech/02-text-to-speech.md) pipelines. Compiled from source on both Android and iOS when enabled.

### Features

Specifying a task under `features` is shorthand: it automatically expands to the union of backends and native libraries required by the pre-exported models in that domain.

| Feature                | Expanded Backends            | Expanded Extra Libs |
| ---------------------- | ---------------------------- | ------------------- |
| `llm`                  | xnnpack, mlx, vulkan         | —                   |
| `multimodalLLM`        | xnnpack, mlx, vulkan         | opencv              |
| `privacyFilter`        | xnnpack, mlx                 | —                   |
| `speechToText`         | xnnpack, coreml, mlx, vulkan | —                   |
| `textToSpeech`         | xnnpack, coreml, mlx, vulkan | phonemis            |
| `vad`                  | xnnpack                      | —                   |
| `textEmbeddings`       | xnnpack, coreml, mlx, vulkan | —                   |
| `imageEmbeddings`      | xnnpack, coreml, mlx, vulkan | opencv              |
| `classification`       | xnnpack, coreml              | opencv              |
| `objectDetection`      | xnnpack, coreml              | opencv              |
| `keypointDetection`    | xnnpack, coreml, mlx         | opencv              |
| `semanticSegmentation` | xnnpack, coreml              | opencv              |
| `instanceSegmentation` | xnnpack, coreml              | opencv              |
| `ocr`                  | xnnpack, coreml, vulkan      | opencv              |
| `verticalOCR`          | xnnpack                      | opencv              |
| `styleTransfer`        | xnnpack, coreml              | opencv              |
| `textToImage`          | xnnpack, coreml              | opencv              |
| `segmentAnything`      | xnnpack, coreml              | opencv              |
| `tokenizer`            | —                            | —                   |

## Binary size

What the backends actually cost, measured rather than estimated. Both tables come
from `apps/legacy/bare-rn` built in Release with OpenCV and phonemis enabled, so
the absolute figures move with which features you compile in. **The deltas between
rows are the transferable part.**

### Android

`arm64-v8a`, symbols stripped as the APK ships them. Covers `libexecutorch.so`,
the backend libraries, and `libRnExecutorch.so`; it excludes React Native's own
libraries, which do not change with this configuration.

| backends             | in the APK | ≈ Play download |
| -------------------- | ---------- | --------------- |
| `xnnpack`            | 25.18 MB   | 8.16 MB         |
| `vulkan`             | 33.83 MB   | 9.79 MB         |
| `xnnpack` + `vulkan` | 36.38 MB   | 10.68 MB        |

Per library:

| library                            | stripped | gzipped |
| ---------------------------------- | -------- | ------- |
| `libexecutorch.so`                 | 12.82 MB | 4.39 MB |
| `libvulkan_executorch_backend.so`  | 11.19 MB | 2.52 MB |
| `libRnExecutorch.so`               | 9.80 MB  | 2.87 MB |
| `libxnnpack_executorch_backend.so` | 2.54 MB  | 0.88 MB |

`extractNativeLibs=false` is the default from React Native 0.73, so the install
grows by the uncompressed figure; the Play column is the compressed transfer.

Vulkan is ~4.4x XNNPACK and almost entirely data: 8.73 MB of its 11.19 MB is
`.rodata`, effectively embedded SPIR-V, against 2.02 MB of `.text`. It also
compresses far better than its size suggests.

### iOS

Mach-O size of the app binary, `arm64`, device slice. Each row is a full relink.

| backends                     | app binary | added by the last backend |
| ---------------------------- | ---------- | ------------------------- |
| none                         | 19.33 MB   | —                         |
| `xnnpack`                    | 20.75 MB   | +1.41 MB                  |
| `xnnpack` + `coreml`         | 21.12 MB   | +0.37 MB                  |
| `xnnpack` + `coreml` + `mlx` | 26.07 MB   | +4.95 MB                  |

MLX also ships `mlx.metallib` (1.07 MB) as a bundle resource, which is on top of
the binary.

A backend costs roughly a third of its archive on disk: XNNPACK is a 3.79 MB
archive for 1.41 MB linked, MLX 15.09 MB for 4.95 MB. The backends are attached
with `-force_load`, which defeats archive member selection but **not**
dead-stripping, so the linker still drops what your app cannot reach.

iOS starts leaner than Android because the ExecuTorch runtime is dead-stripped
into the binary rather than shipped as a standalone library.
