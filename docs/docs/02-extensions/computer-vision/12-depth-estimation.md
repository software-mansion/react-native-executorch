---
title: Depth Estimation
slug: /extensions/depth-estimation
description: 'Estimate pixel-level relative depth from a single image with Depth Anything V2 for portrait effects, scene understanding, and photo animation.'
keywords:
  [
    react native,
    depth estimation,
    depth anything,
    depth map,
    portrait effects,
    mobile ml,
    on-device ai,
  ]
---

# Depth Estimation

Depth estimation predicts a depth value for every pixel in an image. The pipeline returns a floating-point depth map matching the original image dimensions, which can be used for portrait blur, photo animation, and scene understanding.

Depth Anything V2 predicts **relative inverse depth**: larger values indicate closer surfaces. Its values are not distances in meters, and their scale is not calibrated across images.

## Quick Start

The [`useDepthEstimator`](../../06-api-reference/functions/useDepthEstimator.md) hook manages model downloading, initialization, and lifecycle:

```tsx
import { models, useDepthEstimator } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

function MyComponent() {
  const estimator = useDepthEstimator(models.depthEstimation.DEPTH_ANYTHING_V2_SMALL.DEFAULT);

  // Hook state:
  // estimator.isReady          — true once model is downloaded and loaded in memory
  // estimator.downloadProgress — 0 to 100 download progress
  // estimator.error            — Error instance if download or load failed
  // estimator.resource         — resolved config with all URLs replaced by local file paths

  const handleEstimate = async (imageBuffer: ImageBuffer) => {
    if (!estimator.isReady || !estimator.estimateDepth) return;

    // Run inference on a background thread
    const depth = await estimator.estimateDepth(imageBuffer);
    const x = Math.floor(depth.width / 2);
    const y = Math.floor(depth.height / 2);
    console.log('Center depth:', depth.data[y * depth.width + x]);
  };

  // Trigger handleEstimate from an image picker, button press, or camera frame
}
```

:::tip Full Interactive Example
See [`apps/computer-vision/app/depthEstimation/index.tsx`](https://github.com/software-mansion/react-native-executorch/blob/main/apps/computer-vision/app/depthEstimation/index.tsx) for a complete screen with model selection, photo capture, depth visualization, interactive photo effects, and latency tracking.
:::

## Output Format

[`estimateDepth()`](../../06-api-reference/type-aliases/DepthEstimator.md#estimatedepth) returns a [`DepthMap`](../../06-api-reference/type-aliases/DepthMap.md) object:

```typescript
type DepthMap = {
  /** Raw depth values in row-major order: data[y * width + x] */
  readonly data: Float32Array;
  /** Width of the depth map in pixels */
  readonly width: number;
  /** Height of the depth map in pixels */
  readonly height: number;
};
```

The map contains one float per source image pixel. Each result owns its buffer and remains valid after subsequent inference or pipeline disposal.

Values retain the model's original scale. For visualization, normalize a copy of the data and apply a color map in your application.

## Configuration & Options

The [`DepthEstimatorOptions`](../../06-api-reference/type-aliases/DepthEstimatorOptions.md) in `modelOpts` configure input preprocessing and output resizing. Hosted presets include these settings:

| Option             | Depth Anything V2 preset | Description                                                                               |
| :----------------- | :----------------------- | :---------------------------------------------------------------------------------------- |
| `resizeMode`       | `'stretch'`              | Resize the full image to the model input dimensions. Currently only stretch is supported. |
| `interpolation`    | `'cubic'`                | Interpolation used to resize the input image.                                             |
| `normalizeOpts`    | `IMAGENET_NORM`          | Input channel scaling and normalization.                                                  |
| `outInterpolation` | `'linear'`               | Interpolation used to resize the float depth map to the source image dimensions.          |

There are no per-inference options. To change preprocessing for a different model, supply a custom model configuration.

## Imperative API

For background processing or manual lifecycle management outside React components, create the estimator using [`createDepthEstimator`](../../06-api-reference/functions/createDepthEstimator.md):

```typescript
import { createDepthEstimator, download, models } from 'react-native-executorch';

// Download and cache model assets before creating the pipeline
const model = await download(models.depthEstimation.DEPTH_ANYTHING_V2_SMALL.DEFAULT);
const estimator = await createDepthEstimator(model);

try {
  const depth = await estimator.estimateDepth(imageBuffer);
  console.log('Depth map dimensions:', depth.width, depth.height);
} finally {
  // Always release native resources when finished
  estimator.dispose();
}
```

## Synchronous Execution

For worklet-based processing, [`createDepthEstimator`](../../06-api-reference/functions/createDepthEstimator.md) exposes a synchronous [`estimateDepthWorklet`](../../06-api-reference/type-aliases/DepthEstimator.md#estimatedepthworklet) function:

```typescript
// Called synchronously on the worklet thread
const depth = estimator.estimateDepthWorklet(frameBuffer);
```

See [Worklets & Threading](../../03-core-and-advanced/06-worklets-and-threading.md) for details on worklet execution contexts.

## Available Models

Ready-to-use models are available in [`models.depthEstimation`](../../06-api-reference/variables/models.md#depthestimation):

| Model Family                | Variants                                                                                 | Size Range        | Supported Backends                               | Notes                                                                       |
| :-------------------------- | :--------------------------------------------------------------------------------------- | :---------------- | :----------------------------------------------- | :-------------------------------------------------------------------------- |
| **Depth Anything V2 Small** | [See](../../06-api-reference/variables/models.md#depthestimationdepth_anything_v2_small) | 35.5 MB – 99.0 MB | XNNPACK (CPU), Core ML (Apple), Vulkan (Android) | ViT-S/14 backbone with a 518 × 518 input and relative inverse depth output. |

Use `DEFAULT` for automatic backend selection, or choose `XNNPACK_INT8`, `XNNPACK_FP32`, `COREML_FP16`, or `VULKAN_FP16` explicitly. The exports are hosted in the [Depth Anything V2 Hugging Face repository](https://huggingface.co/software-mansion/react-native-executorch-depth-anything-v2).

:::tip Using Custom Models
Pass a [`DepthEstimatorModel`](../../06-api-reference/type-aliases/DepthEstimatorModel.md) configuration to [`useDepthEstimator`](../../06-api-reference/functions/useDepthEstimator.md) or download it before calling [`createDepthEstimator`](../../06-api-reference/functions/createDepthEstimator.md):

```typescript
import { createDepthEstimator, download, IMAGENET_NORM } from 'react-native-executorch';

const model = await download({
  modelPath: 'https://example.com/my-depth-model.pte',
  modelOpts: {
    resizeMode: 'stretch' as const,
    interpolation: 'cubic' as const,
    normalizeOpts: IMAGENET_NORM,
    outInterpolation: 'linear' as const,
  },
});
const estimator = await createDepthEstimator(model);
```

Choose normalization and interpolation settings for your model. The pipeline accepts static float32 RGB inputs `[1, 3, H, W]` with outputs `[1, OH, OW]`, or unbatched inputs `[3, H, W]` with outputs `[OH, OW]`. Input and output spatial dimensions may differ. Output values retain the custom model's meaning and units.

The pipeline verifies the exported input and output shapes automatically. See [Exporting Custom Models](../../03-core-and-advanced/07-exporting-custom-models.md#using-a-built-in-pipeline) for export requirements.
:::

## API Reference

### Hooks & Pipelines

- [`useDepthEstimator()`](../../06-api-reference/functions/useDepthEstimator.md) — React hook for model downloading, state, and lifecycle.
- [`createDepthEstimator()`](../../06-api-reference/functions/createDepthEstimator.md) — Imperative factory for depth estimation pipelines.

### Types & Options

- [`DepthEstimator`](../../06-api-reference/type-aliases/DepthEstimator.md) — Runner interface with `estimateDepth` and `estimateDepthWorklet`.
- [`DepthMap`](../../06-api-reference/type-aliases/DepthMap.md) — Floating-point depth data with width and height.
- [`DepthEstimatorModel`](../../06-api-reference/type-aliases/DepthEstimatorModel.md) — Model configuration spec.
- [`DepthEstimatorOptions`](../../06-api-reference/type-aliases/DepthEstimatorOptions.md) — Input preprocessing and output interpolation options.
- [`ImageBuffer`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md) — Input image buffer structure.

### Model Presets & Constants

- [`models.depthEstimation`](../../06-api-reference/variables/models.md#depthestimation) — Pre-configured depth estimation models registry.
- [`IMAGENET_NORM`](../../06-api-reference/variables/IMAGENET_NORM.md) — Input normalization used by Depth Anything V2 presets.

:::info Source Code
View the implementation on GitHub:

- [`src/extensions/cv/tasks/depthEstimation.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/extensions/cv/tasks/depthEstimation.ts)
  :::
