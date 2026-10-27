# Depth Estimation

Depth estimation predicts a depth value for every pixel in an image. The pipeline returns a floating-point depth map matching the original image dimensions, which can be used for portrait blur, photo animation, and scene understanding.

## Quick Start[​](#quick-start "Direct link to Quick Start")

The [`useDepthEstimator`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useDepthEstimator) hook manages model downloading, initialization, and lifecycle:

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

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Full Interactive Example

See [`apps/computer-vision/app/depthEstimation/index.tsx`](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/apps/computer-vision/app/depthEstimation/index.tsx) for a complete screen with model selection, photo capture, depth visualization, interactive photo effects, and latency tracking.

## Output Format[​](#output-format "Direct link to Output Format")

[`estimateDepth()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/DepthEstimator#estimatedepth) returns a [`DepthMap`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/DepthMap) object:

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

## Configuration & Options[​](#configuration--options "Direct link to Configuration & Options")

The [`DepthEstimatorOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/DepthEstimatorOptions) in `modelOpts` configure input preprocessing and output resizing. Hosted presets include these settings:

| Option             | Description                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------- |
| `resizeMode`       | Resize the full image to the model input dimensions. Currently only `'stretch'` is supported. |
| `interpolation`    | Interpolation used to resize the input image.                                                 |
| `normalizeOpts`    | Input channel scaling and normalization.                                                      |
| `outInterpolation` | Interpolation used to resize the float depth map to the source image dimensions.              |

ZipDepth applies ImageNet normalization inside the model, so its preset only scales input pixel values to `[0, 1]`.

There are no per-inference options. To change preprocessing for a different model, supply a custom model configuration.

## Imperative API[​](#imperative-api "Direct link to Imperative API")

For background processing or manual lifecycle management outside React components, create the estimator using [`createDepthEstimator`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createDepthEstimator):

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

## Synchronous Execution[​](#synchronous-execution "Direct link to Synchronous Execution")

For worklet-based processing, [`createDepthEstimator`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createDepthEstimator) exposes a synchronous [`estimateDepthWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/DepthEstimator#estimatedepthworklet) function:

```typescript
// Called synchronously on the worklet thread
const depth = estimator.estimateDepthWorklet(frameBuffer);

```

See [Worklets & Threading](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/worklets-and-threading.md) for details on worklet execution contexts.

## Available Models[​](#available-models "Direct link to Available Models")

Ready-to-use models are available in [`models.depthEstimation`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#depthestimation):

| Model Family                | Variants                                                                                                                             | Size Range         | Supported Backends                               | Notes                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ------------------------------------------------ | --------------------------------------------------------------------------- |
| **Depth Anything V2 Small** | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#depthestimationdepth_anything_v2_small) | 35.5 MB – 99.0 MB  | XNNPACK (CPU), Core ML (Apple), Vulkan (Android) | ViT-S/14 backbone with a 518 × 518 input and relative inverse depth output. |
| **Depth Anything 3 Small**  | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#depthestimationdepth_anything_v3_small) | 40.7 MB – 106.5 MB | XNNPACK (CPU), Core ML (Apple), Vulkan (Android) | Single-image relative depth with a 518 × 518 input.                         |
| **ZipDepth Base**           | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#depthestimationzipdepth_base)           | 12.8 MB – 24.9 MB  | XNNPACK (CPU), Core ML (Apple), Vulkan (Android) | Fast preset with a 384 × 384 input and relative inverse depth output.       |

Depth Anything V2 and ZipDepth return relative inverse depth (larger means nearer), while Depth Anything 3 returns relative depth (larger means farther). All presets return raw float values through the same `DepthMap` API.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Using Custom Models

Pass a [`DepthEstimatorModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/DepthEstimatorModel) configuration to [`useDepthEstimator`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useDepthEstimator) or download it before calling [`createDepthEstimator`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createDepthEstimator):

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

The pipeline verifies the exported input and output shapes automatically. See [Exporting Custom Models](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/exporting-custom-models.md#using-a-built-in-pipeline) for export requirements.

## API Reference[​](#api-reference "Direct link to API Reference")

### Hooks & Pipelines[​](#hooks--pipelines "Direct link to Hooks & Pipelines")

* [`useDepthEstimator()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useDepthEstimator) — React hook for model downloading, state, and lifecycle.
* [`createDepthEstimator()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createDepthEstimator) — Imperative factory for depth estimation pipelines.

### Types & Options[​](#types--options "Direct link to Types & Options")

* [`DepthEstimator`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/DepthEstimator) — Runner interface with `estimateDepth` and `estimateDepthWorklet`.
* [`DepthMap`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/DepthMap) — Floating-point depth data with width and height.
* [`DepthEstimatorModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/DepthEstimatorModel) — Model configuration spec.
* [`DepthEstimatorOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/DepthEstimatorOptions) — Input preprocessing and output interpolation options.
* [`ImageBuffer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer) — Input image buffer structure.

### Model Presets & Constants[​](#model-presets--constants "Direct link to Model Presets & Constants")

* [`models.depthEstimation`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#depthestimation) — Pre-configured depth estimation models registry.
* [`IMAGENET_NORM`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/IMAGENET_NORM) — Input normalization used by Depth Anything V2 and V3 presets.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Source Code

View the implementation on GitHub:

* [`src/extensions/cv/tasks/depthEstimation.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/depthEstimation.ts)
