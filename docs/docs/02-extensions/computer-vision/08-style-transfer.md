---
title: Neural Style Transfer
slug: /extensions/style-transfer
description: 'Apply artistic styles like Candy, Mosaic, Rain Princess, and Udnie to photos and camera frames on-device in real time.'
keywords:
  [
    react native,
    style transfer,
    artistic filters,
    photo stylization,
    neural style transfer,
    candy,
    mosaic,
    rain princess,
    udnie,
    mobile ml,
    on-device ai,
  ]
---

# Neural Style Transfer

Neural style transfer renders an input image in the artistic style of another image (such as famous paintings or pattern textures) while preserving the semantic content and structure of the original photo.

Because the models run locally in real time on mobile hardware accelerators, you can apply artistic filters to live camera frames or photos without uploading user media to external servers.

<!-- GIF DEMO PLACEHOLDER: Place style transfer demo gif here, e.g. ![Style Transfer Demo](./media/style-transfer.gif) -->

## Quick Start

The [`useStyleTransfer`](../../06-api-reference/functions/useStyleTransfer.md) hook manages model downloading, initialization, and lifecycle:

```tsx
import { models, useStyleTransfer } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

function MyComponent() {
  const styleTransfer = useStyleTransfer(models.styleTransfer.CANDY.DEFAULT);

  // Hook state:
  // styleTransfer.isReady          — true once model is downloaded and loaded in memory
  // styleTransfer.downloadProgress — 0.0 to 1.0 download progress
  // styleTransfer.error            — Error instance if download or load failed

  const handleTransfer = async (imageBuffer: ImageBuffer) => {
    if (!styleTransfer.isReady || !styleTransfer.transferStyle) return;

    // Run inference on background thread
    const styledBuffer = await styleTransfer.transferStyle(imageBuffer);
    console.log('Styled image dimensions:', styledBuffer.width, styledBuffer.height);
  };

  // Trigger handleTransfer from an image picker, button press, or camera frame
}
```

<!-- TODO: Update gallery URL once repo is moved to software-mansion organization -->

:::tip Full Interactive Example in Gallery App
See [`src/app/style-transfer.tsx`](https://github.com/barhanc/react-native-executorch-gallery/blob/main/src/app/style-transfer.tsx) in the [React Native ExecuTorch Gallery](https://github.com/barhanc/react-native-executorch-gallery) for a complete, runnable screen with photo picker, side-by-side style comparisons, and latency tracking.
:::

## Output Format

`transferStyle()` returns an [`ImageBuffer`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md) object containing the styled RGBA image rendered at the input dimensions:

```typescript
type ImageBuffer = {
  readonly width: number;
  readonly height: number;
  readonly format: 'rgba';
  readonly data: Uint8Array;
};
```

The resulting buffer contains raw uncompressed RGBA pixel bytes that can be rendered directly via React Native Skia or passed into subsequent processing steps.

## Imperative API

For background photo processing, headless workflows, or manual lifecycle management outside React components, create the pipeline using [`createStyleTransfer`](../../06-api-reference/functions/createStyleTransfer.md):

```typescript
import { createStyleTransfer, models } from 'react-native-executorch';

const styleTransfer = await createStyleTransfer(models.styleTransfer.CANDY.DEFAULT);

try {
  const styledBuffer = await styleTransfer.transferStyle(imageBuffer);
  console.log('Styled output byte length:', styledBuffer.data.byteLength);
} finally {
  // Always release native resources when finished
  styleTransfer.dispose();
}
```

## Synchronous Execution

For high-throughput loops like live viewfinder styling or video recording, `createStyleTransfer` exposes a synchronous `transferStyleWorklet` function. This runs directly on the worklet thread with zero Promise scheduling overhead:

```typescript
// Called synchronously inside a VisionCamera frame processor on the UI worklet thread
const styledBuffer = styleTransfer.transferStyleWorklet(frameBuffer);
```

See [Worklets & Threading](../../03-core-and-advanced/06-worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models

The library provides ready-to-use style transfer models from the [Software Mansion HuggingFace Style Transfer Collection](https://huggingface.co/collections/software-mansion/style-transfer), available in [`models.styleTransfer`](../../06-api-reference/variables/models.md#styletransfer):

| Model             | Variant                                  | Size    | Platform / Acceleration   | Notes                                                 |
| :---------------- | :--------------------------------------- | :------ | :------------------------ | :---------------------------------------------------- |
| **Candy**         | `XNNPACK_INT8` (default)                 | 1.8 MB  | Universal (CPU)           | Vibrant, colorful candy aesthetic with bold outlines. |
| Candy             | `COREML_FP16`                            | 3.8 MB  | iOS (Neural Engine / GPU) | Accelerated via Apple Core ML on iOS 17+.             |
| **Mosaic**        | `XNNPACK_INT8` (default) / `COREML_FP16` | ~1.8 MB | Universal / iOS           | Classical geometric tile mosaic texture.              |
| **Rain Princess** | `XNNPACK_INT8` (default) / `COREML_FP16` | ~1.8 MB | Universal / iOS           | Painterly expressionist oil painting style.           |
| **Udnie**         | `XNNPACK_INT8` (default) / `COREML_FP16` | ~1.8 MB | Universal / iOS           | Francis Picabia abstract modernist art style.         |

:::tip Using Custom Models
To use your own trained feed-forward style transfer `.pte` model, pass a [`StyleTransferModel`](../../06-api-reference/type-aliases/StyleTransferModel.md) configuration object to `useStyleTransfer` or `createStyleTransfer`:

```typescript
const customStyleTransfer = await createStyleTransfer({
  modelPath: 'https://example.com/my-style.pte',
  modelOpts: {
    resizeMode: 'stretch',
    interpolation: 'linear',
    outInterpolation: 'lanczos',
    normalizeOpts: { alpha: 1 / 255.0, beta: 0.0 },
    outNormalizeOpts: { alpha: 255.0, beta: 0.0 },
  },
});
```

The pipeline automatically verifies that the model's exported input and output shapes match its requirements. To prepare and export your own `.pte` model to match this pipeline, see [Exporting Custom Models](../../03-core-and-advanced/07-exporting-custom-models.md#using-a-built-in-pipeline).
:::

## API Reference

### Hooks & Pipelines

- [`useStyleTransfer()`](../../06-api-reference/functions/useStyleTransfer.md) — React hook for style transfer model downloading, state, and lifecycle.
- [`createStyleTransfer()`](../../06-api-reference/functions/createStyleTransfer.md) — Imperative factory for style transfer pipelines.

### Types & Options

- [`StyleTransfer`](../../06-api-reference/type-aliases/StyleTransfer.md) — Style transfer runner interface (`transferStyle`, `transferStyleWorklet`).
- [`StyleTransferModel`](../../06-api-reference/type-aliases/StyleTransferModel.md) — Model configuration spec for style transfer models.
- [`StyleTransferOptions`](../../06-api-reference/type-aliases/StyleTransferOptions.md) — Options defining normalization, interpolation, and resize modes.
- [`ImageBuffer`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md) — Input and output image buffer structure.

### Model Presets

- [`models.styleTransfer`](../../06-api-reference/variables/models.md#styletransfer) — Pre-configured artistic style transfer models registry.
