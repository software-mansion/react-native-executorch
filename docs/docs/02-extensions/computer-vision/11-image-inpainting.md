---
title: Image Inpainting
slug: /extensions/image-inpainting
description: 'Remove objects and fill masked regions of photos on-device with MI-GAN, with the resizing, mask handling and seam blending built in.'
keywords:
  [
    react native,
    inpainting,
    object removal,
    photo cleanup,
    image editing,
    mi-gan,
    migan,
    mask,
    mobile ml,
    on-device ai,
  ]
---

# Image Inpainting

Image inpainting fills a region of a photo with content that matches its surroundings: paint over an unwanted object, a blemish, or a passer-by, and the model reconstructs what would plausibly be behind it.

The pipeline runs entirely on-device. It runs the model on the whole photo resized to the model's resolution and blends the result back into the full-resolution photo through the mask with a feathered seam, so the rest of the image is returned pixel for pixel as it came in.

## Quick Start

The [`useInpainter`](../../06-api-reference/functions/useInpainter.md) hook manages model downloading, initialization, and lifecycle:

```tsx
import { models, useInpainter } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

function MyComponent() {
  const inpainter = useInpainter(models.inpainting.MIGAN.DEFAULT);

  // Hook state:
  // inpainter.isReady          — true once model is downloaded and loaded in memory
  // inpainter.downloadProgress — 0 to 100 download progress
  // inpainter.error            — Error instance if download or load failed
  // inpainter.resource         — resolved config with all URLs replaced by local file paths

  const handleInpaint = async (image: ImageBuffer, mask: ImageBuffer) => {
    if (!inpainter.isReady || !inpainter.inpaint) return;

    // Run inference on background thread
    const result = await inpainter.inpaint(image, mask);
    console.log('Inpainted image dimensions:', result.width, result.height);
  };

  // Build `mask` from what the user painted, then call handleInpaint
}
```

:::tip Full Interactive Example
See [`apps/computer-vision/app/inpainting`](https://github.com/software-mansion/react-native-executorch/tree/main/apps/computer-vision/app/inpainting) in this repository for a complete screen with a photo picker, a brush to paint the mask over the photo, and before/after comparison.
:::

## The Mask

[`inpaint()`](../../06-api-reference/type-aliases/Inpainter.md#inpaint) takes two [`ImageBuffer`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)s of the same dimensions: the photo and the mask. The mask is a `'gray'` buffer, one byte per pixel, in which **any non-zero pixel marks the region to fill**, so the natural way to build one is to paint white strokes on a black canvas and read the pixels back as grayscale (Skia's `readPixels` with `ColorType.Gray_8`, for example). Other formats are rejected.

```typescript
// A mask with a 100x100 hole at (200, 150) over an 800x600 photo
const mask = new Uint8Array(800 * 600);
for (let y = 150; y < 250; y++) {
  for (let x = 200; x < 300; x++) mask[y * 800 + x] = 255;
}
const maskBuffer = { data: mask, width: 800, height: 600, format: 'gray', layout: 'hwc' } as const;
```

An all-zero mask returns the input unchanged, but the model still runs, so skip the call when there is nothing to fill.

:::tip Cover the whole object
Paint over the entire object, with a little margin. MI-GAN continues whatever touches the edge of the hole, so a mask that cuts through an object makes the model extend that object into the hole instead of removing it.
:::

## Output Format

The result is an [`ImageBuffer`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md) containing the whole frame as RGBA at the input dimensions, with the masked region filled:

```typescript
type ImageBuffer = {
  readonly width: number;
  readonly height: number;
  readonly format: 'rgba';
  readonly data: Uint8Array;
};
```

Pixels outside the mask are copied from the input; only the masked region changes, with the seam feathered inward from its edge.

## How It Works

The models run at a fixed resolution (256 or 512 px):

1. Resize the whole photo and the mask to the model input and run the model. A model pixel is part of the hole when any photo pixel it covers is, so thin strokes survive the downscale.
2. Resize the output back to the photo's resolution.
3. Blend it over the original photo through the full-resolution mask, eroded and feathered per [`blend`](../../06-api-reference/type-aliases/InpainterOptions.md#blend).

The fill is therefore generated at the model's resolution and upsampled. To fill a small hole in a large photo at higher detail, crop the region around it yourself, inpaint the crop, and paste the result back.

## Imperative API

For background photo processing, headless workflows, or manual lifecycle management outside React components, create the pipeline using [`createInpainter`](../../06-api-reference/functions/createInpainter.md):

```typescript
import { createInpainter, download, models } from 'react-native-executorch';

// Download and cache model assets before creating the pipeline
const model = await download(models.inpainting.MIGAN.DEFAULT);
const inpainter = await createInpainter(model);

try {
  const result = await inpainter.inpaint(imageBuffer, maskBuffer);
  console.log('Inpainted output byte length:', result.data.byteLength);
} finally {
  // Always release native resources when finished
  inpainter.dispose();
}
```

## Synchronous Execution

[`createInpainter`](../../06-api-reference/functions/createInpainter.md) also exposes a synchronous [`inpaintWorklet`](../../06-api-reference/type-aliases/Inpainter.md#inpaintworklet) function that runs directly on the worklet thread with zero Promise scheduling overhead:

```typescript
// Called synchronously on the UI worklet thread
const result = inpainter.inpaintWorklet(imageBuffer, maskBuffer);
```

See [Worklets & Threading](../../03-core-and-advanced/06-worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models

The library provides ready-to-use inpainting models from the [Software Mansion HuggingFace MI-GAN repository](https://huggingface.co/software-mansion/react-native-executorch-migan), available in [`models.inpainting`](../../06-api-reference/variables/models.md#inpainting):

| Model Family         | Variants                                                          | Size     | Supported Backends                           | Notes                                                                              |
| :------------------- | :---------------------------------------------------------------- | :------- | :------------------------------------------- | :--------------------------------------------------------------------------------- |
| **MI-GAN 512**       | [See](../../06-api-reference/variables/models.md#inpaintingmigan) | 14–25 MB | XNNPACK (CPU), Core ML (Apple), Vulkan (GPU) | Places2 (scenes) checkpoint at 512x512. The default; keeps the most detail.        |
| **MI-GAN 256**       | [See](../../06-api-reference/variables/models.md#inpaintingmigan) | 12–24 MB | XNNPACK (CPU), Core ML (Apple), Vulkan (GPU) | Places2 checkpoint at 256x256, for lower latency.                                  |
| **MI-GAN Faces 256** | [See](../../06-api-reference/variables/models.md#inpaintingmigan) | 12–24 MB | XNNPACK (CPU), Core ML (Apple), Vulkan (GPU) | FFHQ (faces) checkpoint. Reconstructs eyes and mouths the scene checkpoints smear. |

Every variant ships as FP16. MI-GAN is published by [Picsart AI Research](https://github.com/Picsart-AI-Research/MI-GAN) under the MIT license.

:::tip Using Custom Models
To use your own inpainting `.pte` model, pass an [`InpainterModel`](../../06-api-reference/type-aliases/InpainterModel.md) configuration object to [`useInpainter`](../../06-api-reference/functions/useInpainter.md) or [`createInpainter`](../../06-api-reference/functions/createInpainter.md). The model must take an RGB image in `[0, 1]` and a mask with `1` for known pixels and `0` for the hole, both `[1, 3|1, H, W]` or `[3|1, H, W]` `float32`, and return the filled RGB image in `[0, 1]` at the same shape as the image:

```typescript
const customInpainter = await createInpainter({
  modelPath: 'https://example.com/my-inpainter.pte',
  modelOpts: {
    resizeMode: 'stretch',
    interpolation: 'linear',
    normalizeOpts: { alpha: 1 / 255, beta: 0 },
    outNormalizeOpts: { alpha: 255, beta: 0 },
    outInterpolation: 'linear',
    blend: { shrink: 1, feather: 5 },
  },
});
```

The pipeline automatically verifies that the model's exported input and output shapes match its requirements. To prepare and export your own `.pte` model to match this pipeline, see [Exporting Custom Models](../../03-core-and-advanced/07-exporting-custom-models.md#using-a-built-in-pipeline).
:::

## API Reference

### Hooks & Pipelines

- [`useInpainter()`](../../06-api-reference/functions/useInpainter.md) — React hook for inpainting model downloading, state, and lifecycle.
- [`createInpainter()`](../../06-api-reference/functions/createInpainter.md) — Imperative factory for inpainting pipelines.

### Types & Options

- [`Inpainter`](../../06-api-reference/type-aliases/Inpainter.md) — Inpainting runner interface (`inpaint`, [`inpaintWorklet`](../../06-api-reference/type-aliases/Inpainter.md#inpaintworklet)).
- [`InpainterModel`](../../06-api-reference/type-aliases/InpainterModel.md) — Model configuration spec for inpainting models.
- [`InpainterOptions`](../../06-api-reference/type-aliases/InpainterOptions.md) — Input preprocessing, output postprocessing and blend options.
- [`ImageBuffer`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md) — Input, mask and output image buffer structure.

### Model Presets

- [`models.inpainting`](../../06-api-reference/variables/models.md#inpainting) — Pre-configured inpainting models registry.

:::info Source Code
View the implementation on GitHub:

- [`src/extensions/cv/tasks/inpainting.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/extensions/cv/tasks/inpainting.ts)
  :::
