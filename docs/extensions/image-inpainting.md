# Image Inpainting

Image inpainting fills a region of a photo with content that matches its surroundings: paint over an unwanted object, a blemish, or a passer-by, and the model reconstructs what would plausibly be behind it.

The pipeline runs entirely on-device. It runs the model on the whole photo resized to the model's resolution and blends the result back into the full-resolution photo through the mask, so the rest of the image is returned pixel for pixel as it came in.

## Quick Start[​](#quick-start "Direct link to Quick Start")

The [`useInpainter`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useInpainter) hook manages model downloading, initialization, and lifecycle:

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

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Full Interactive Example

See [`apps/computer-vision/app/inpainting`](https://github.com/software-mansion/react-native-executorch/tree/main/apps/computer-vision/app/inpainting) in this repository for a complete screen with a photo picker, a brush to paint the mask over the photo, and before/after comparison.

## The Mask[​](#the-mask "Direct link to The Mask")

[`inpaint()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Inpainter#inpaint) takes two [`ImageBuffer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer)s of the same dimensions: the photo and the mask. The mask is a `'gray'` buffer, one byte per pixel, in which **any non-zero pixel marks the region to fill**, so the natural way to build one is to paint white strokes on a black canvas and read the pixels back as grayscale (Skia's `readPixels` with `ColorType.Gray_8`, for example). Other formats are rejected.

```typescript
// A mask with a 100x100 hole at (200, 150) over an 800x600 photo
const mask = new Uint8Array(800 * 600);
for (let y = 150; y < 250; y++) {
  for (let x = 200; x < 300; x++) mask[y * 800 + x] = 255;
}
const maskBuffer = { data: mask, width: 800, height: 600, format: 'gray', layout: 'hwc' } as const;

```

An all-zero mask returns the input unchanged, but the model still runs, so skip the call when there is nothing to fill.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Cover the whole object

Paint over the entire object, with a little margin. MI-GAN continues whatever touches the edge of the hole, so a mask that cuts through an object makes the model extend that object into the hole instead of removing it.

## Output Format[​](#output-format "Direct link to Output Format")

The result is an [`ImageBuffer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer) containing the whole frame as RGBA at the input dimensions, with the masked region filled:

```typescript
type ImageBuffer = {
  readonly width: number;
  readonly height: number;
  readonly format: 'rgba';
  readonly data: Uint8Array;
};

```

Pixels outside the mask are copied from the input; only the masked region changes.

## How It Works[​](#how-it-works "Direct link to How It Works")

The models run at a fixed resolution (256 or 512 px):

1. Resize the whole photo and the mask to the model input and run the model. A model pixel is part of the hole when any photo pixel it covers is, so thin strokes survive the downscale.
2. Resize the output back to the photo's resolution.
3. Blend it over the original photo through the full-resolution mask. [`blendOpts`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/InpainterOptions#blendopts) can erode the mask and feather its edge inward; the built-in models use neither, since the upsampled fill is already soft.

The fill is therefore generated at the model's resolution and upsampled. To fill a small hole in a large photo at higher detail, crop the region around it yourself, inpaint the crop, and paste the result back.

## Imperative API[​](#imperative-api "Direct link to Imperative API")

For background photo processing, headless workflows, or manual lifecycle management outside React components, create the pipeline using [`createInpainter`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createInpainter):

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

## Synchronous Execution[​](#synchronous-execution "Direct link to Synchronous Execution")

[`createInpainter`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createInpainter) also exposes a synchronous [`inpaintWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Inpainter#inpaintworklet) function that runs directly on the worklet thread with zero Promise scheduling overhead:

```typescript
// Called synchronously on the UI worklet thread
const result = inpainter.inpaintWorklet(imageBuffer, maskBuffer);

```

See [Worklets & Threading](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models[​](#available-models "Direct link to Available Models")

The library provides ready-to-use inpainting models from the [Software Mansion HuggingFace MI-GAN repository](https://huggingface.co/software-mansion/react-native-executorch-migan), available in [`models.inpainting`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#inpainting):

| Model Family         | Variants                                                                                                      | Size     | Supported Backends                           | Notes                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------- | ---------------------------------------------------------------------------------- |
| **MI-GAN 512**       | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#inpaintingmigan) | 14–25 MB | XNNPACK (CPU), Core ML (Apple), Vulkan (GPU) | Places2 (scenes) checkpoint at 512x512. The default; keeps the most detail.        |
| **MI-GAN 256**       | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#inpaintingmigan) | 12–24 MB | XNNPACK (CPU), Core ML (Apple), Vulkan (GPU) | Places2 checkpoint at 256x256, for lower latency.                                  |
| **MI-GAN Faces 256** | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#inpaintingmigan) | 12–24 MB | XNNPACK (CPU), Core ML (Apple), Vulkan (GPU) | FFHQ (faces) checkpoint. Reconstructs eyes and mouths the scene checkpoints smear. |

Every variant ships as FP16. MI-GAN is published by [Picsart AI Research](https://github.com/Picsart-AI-Research/MI-GAN) under the MIT license.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Using Custom Models

To use your own inpainting `.pte` model, pass an [`InpainterModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/InpainterModel) configuration object to [`useInpainter`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useInpainter) or [`createInpainter`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createInpainter). The model must take an RGB image in `[0, 1]` and a mask with `1` for known pixels and `0` for the hole, both `[1, 3|1, H, W]` or `[3|1, H, W]` `float32`, and return the filled RGB image in `[0, 1]` at the same shape as the image:

```typescript
const customInpainter = await createInpainter({
  modelPath: 'https://example.com/my-inpainter.pte',
  modelOpts: {
    resizeMode: 'stretch',
    interpolation: 'linear',
    normalizeOpts: { alpha: 1 / 255, beta: 0 },
    outNormalizeOpts: { alpha: 255, beta: 0 },
    outInterpolation: 'linear',
    blendOpts: { shrink: 0, feather: 0 },
  },
});

```

The pipeline automatically verifies that the model's exported input and output shapes match its requirements. To prepare and export your own `.pte` model to match this pipeline, see [Exporting Custom Models](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/exporting-custom-models.md#using-a-built-in-pipeline).

## API Reference[​](#api-reference "Direct link to API Reference")

### Hooks & Pipelines[​](#hooks--pipelines "Direct link to Hooks & Pipelines")

* [`useInpainter()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useInpainter) — React hook for inpainting model downloading, state, and lifecycle.
* [`createInpainter()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createInpainter) — Imperative factory for inpainting pipelines.

### Types & Options[​](#types--options "Direct link to Types & Options")

* [`Inpainter`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Inpainter) — Inpainting runner interface (`inpaint`, [`inpaintWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/Inpainter#inpaintworklet)).
* [`InpainterModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/InpainterModel) — Model configuration spec for inpainting models.
* [`InpainterOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/InpainterOptions) — Input preprocessing, output postprocessing and blend options.
* [`ImageBuffer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer) — Input, mask and output image buffer structure.

### Model Presets[​](#model-presets "Direct link to Model Presets")

* [`models.inpainting`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#inpainting) — Pre-configured inpainting models registry.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Source Code

View the implementation on GitHub:

* [`src/extensions/cv/tasks/inpainting.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/inpainting.ts)
