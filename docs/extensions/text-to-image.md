# Text to Image

Text-to-image diffusion models generate photorealistic and artistic images directly from natural language descriptive prompts.

The library ships with SDXS-512 (Stable Diffusion eXtreme Speed) based on DreamShaper. Through architectural distillation, SDXS collapses multi-step denoising into a fast, single-step latent diffusion pipeline capable of generating 512x512 images completely on-device without cloud GPUs.

| iOS                                                      | Android                                                      |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| [](/react-native-executorch/media/text-to-image-ios.mp4) | [](/react-native-executorch/media/text-to-image-android.mp4) |

## Quick Start[​](#quick-start "Direct link to Quick Start")

The [`useTextToImage`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useTextToImage) hook manages model downloading, CLIP tokenizer loading, and lifecycle:

```tsx
import { models, useTextToImage } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

function MyComponent() {
  const generator = useTextToImage(models.textToImage.SDXS_512_DREAMSHAPER.DEFAULT);

  // Hook state:
  // generator.isReady          — true once model and tokenizer are downloaded and loaded
  // generator.downloadProgress — 0 to 100 download progress
  // generator.error            — Error instance if download or load failed
  // generator.resource         — resolved config with all URLs replaced by local file paths

  const handleGenerate = async (prompt: string) => {
    if (!generator.isReady || !generator.generate) return;

    // Run inference on background thread (optional seed for deterministic output)
    const imageBuffer: ImageBuffer = await generator.generate(prompt, 42);
    console.log('Generated image:', imageBuffer.width, imageBuffer.height);
  };

  // Trigger handleGenerate on submit from a prompt input or button press
}

```

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Full Interactive Example in Gallery App

See [`src/app/(screens)/text-to-image.tsx`](https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/app/\(screens\)/text-to-image.tsx) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for a complete, runnable screen with prompt suggestions, generation progress, and Skia canvas rendering.

## Output Format[​](#output-format "Direct link to Output Format")

[`generate()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SdxsTextToImage#generate) returns an [`ImageBuffer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer) object with uncompressed 512x512 RGBA pixel bytes:

```typescript
type ImageBuffer = {
  readonly width: 512;
  readonly height: 512;
  readonly format: 'rgba';
  readonly data: Uint8Array;
};

```

You can render the output directly to screen using [React Native Skia](https://shopify.github.io/react-native-skia/), convert it into canvas textures, or pipe it into subsequent visual processing pipelines.

## Determinism & Seeds[​](#determinism--seeds "Direct link to Determinism & Seeds")

[`generate(prompt, seed)`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SdxsTextToImage#generate) accepts an optional integer [`seed`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SdxsTextToImage#seed) parameter:

* **With a seed** (e.g. `generate("sunset over ocean", 123)`): Reproduces the exact same image output deterministically.
* **Without a seed** (e.g. `generate("sunset over ocean")`): Uses a time-based random seed to produce a fresh variation on each execution.

## Imperative API[​](#imperative-api "Direct link to Imperative API")

For background generation jobs, headless services, or manual lifecycle management outside React components, create the generator using [`createSdxsTextToImage`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createSdxsTextToImage):

```typescript
import { createSdxsTextToImage, download, models } from 'react-native-executorch';

// Download and cache model assets before creating the pipeline
const model = await download(models.textToImage.SDXS_512_DREAMSHAPER.DEFAULT);
const generator = await createSdxsTextToImage(model);

try {
  const imageBuffer = await generator.generate(
    'A serene mountain lake at sunrise, photorealistic, 8k',
    100
  );
  console.log('Generated image bytes:', imageBuffer.data.byteLength);
} finally {
  // Always release native resources when finished
  generator.dispose();
}

```

## Synchronous Execution[​](#synchronous-execution "Direct link to Synchronous Execution")

For synchronous worklet execution contexts, [`createSdxsTextToImage`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createSdxsTextToImage) exposes a [`generateWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SdxsTextToImage#generateworklet) function that executes directly inside a worklet runtime without Promise scheduling overhead:

```typescript
// Called synchronously inside a worklet runtime
const imageBuffer = generator.generateWorklet(prompt, seed);

```

See [Worklets & Threading](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models[​](#available-models "Direct link to Available Models")

The library provides ready-to-use text-to-image models from the [Software Mansion HuggingFace Text to Image Collection](https://huggingface.co/collections/software-mansion/text-to-image), available in [`models.textToImage`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#texttoimage):

| Model Family             | Variants                                                                                                                      | Resolution | Size Range         | Supported Backends             | Notes                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------ | ------------------------------ | -------------------------------------------------------------------------------- |
| **SDXS 512 DreamShaper** | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#texttoimagesdxs_512_dreamshaper) | 512x512    | 839.9 MB – 1.64 GB | XNNPACK (CPU), Core ML (Apple) | Single-step distilled latent diffusion for ultra-fast on-device image synthesis. |

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Using Custom Models

To use your own fine-tuned SDXS `.pte` model and CLIP tokenizer, pass a [`SdxsTextToImageModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SdxsTextToImageModel) configuration object to [`useTextToImage`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useTextToImage) or [`createSdxsTextToImage`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createSdxsTextToImage):

```typescript
const customGenerator = await createSdxsTextToImage({
  modelPath: 'https://example.com/my-sdxs.pte',
  tokenizerPath: 'https://example.com/tokenizer.json',
});

```

The pipeline automatically verifies that the model's exported methods (`encode`, `denoise`, `decode`) match its requirements. To prepare and export your own `.pte` model to match this pipeline, see [Exporting Custom Models](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/exporting-custom-models.md#using-a-built-in-pipeline).

## API Reference[​](#api-reference "Direct link to API Reference")

### Hooks & Pipelines[​](#hooks--pipelines "Direct link to Hooks & Pipelines")

* [`useTextToImage()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useTextToImage) — React hook for text-to-image model downloading, state, and lifecycle.
* [`createSdxsTextToImage()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createSdxsTextToImage) — Imperative factory for SDXS text-to-image pipelines.

### Types & Options[​](#types--options "Direct link to Types & Options")

* [`SdxsTextToImage`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SdxsTextToImage) — Text-to-image generator runner interface ([`generate`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SdxsTextToImage#generate), [`generateWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SdxsTextToImage#generateworklet)).
* [`SdxsTextToImageModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/SdxsTextToImageModel) — Model configuration spec with `modelPath` and `tokenizerPath`.
* [`ImageBuffer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer) — Generated RGBA output image buffer structure.

### Model Presets[​](#model-presets "Direct link to Model Presets")

* [`models.textToImage`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#texttoimage) — Pre-configured text-to-image generation models registry.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Source Code

View the implementation on GitHub:

* [`src/extensions/cv/tasks/sdxsTextToImage.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/rne-rewrite/packages/react-native-executorch/src/extensions/cv/tasks/sdxsTextToImage.ts)
