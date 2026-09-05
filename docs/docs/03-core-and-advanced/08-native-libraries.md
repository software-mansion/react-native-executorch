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
