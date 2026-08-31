---
title: Text to Image
slug: /extensions/text-to-image
description: 'Generate high-quality 512x512 images directly on-device from natural language prompts using SDXS (Stable Diffusion eXtreme Speed).'
keywords:
  [
    react native,
    text to image,
    image generation,
    stable diffusion,
    sdxs,
    dreamshaper,
    diffusion model,
    mobile ml,
    on-device ai,
  ]
---

# Text to Image

Text-to-image diffusion models generate photorealistic and artistic images directly from natural language descriptive prompts.

The library ships with SDXS-512 (Stable Diffusion eXtreme Speed) based on DreamShaper. Through architectural distillation, SDXS collapses multi-step denoising into a fast, single-step latent diffusion pipeline capable of generating 512x512 images completely on-device without cloud GPUs.

<!-- GIF DEMO PLACEHOLDER: Place text to image generation demo gif here, e.g. ![Text to Image Demo](./media/text-to-image.gif) -->

## Quick Start

The [`useTextToImage`](../../06-api-reference/functions/useTextToImage.md) hook manages model downloading, CLIP tokenizer loading, and lifecycle:

```tsx
import { models, useTextToImage } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

function MyComponent() {
  const generator = useTextToImage(models.textToImage.SDXS_512_DREAMSHAPER.DEFAULT);

  // Hook state:
  // generator.isReady          — true once model and tokenizer are downloaded and loaded
  // generator.downloadProgress — 0.0 to 1.0 download progress
  // generator.error            — Error instance if download or load failed

  const handleGenerate = async (prompt: string) => {
    if (!generator.isReady || !generator.generate) return;

    // Run inference on background thread (optional seed for deterministic output)
    const imageBuffer: ImageBuffer = await generator.generate(prompt, 42);
    console.log('Generated image:', imageBuffer.width, imageBuffer.height);
  };

  // Trigger handleGenerate on submit from a prompt input or button press
}
```

<!-- TODO: Update gallery URL once repo is moved to software-mansion organization -->

:::tip Full Interactive Example in Gallery App
See [`src/app/text-to-image.tsx`](https://github.com/barhanc/react-native-executorch-gallery/blob/main/src/app/text-to-image.tsx) in the [React Native ExecuTorch Gallery](https://github.com/barhanc/react-native-executorch-gallery) for a complete, runnable screen with prompt suggestions, generation progress, and Skia canvas rendering.
:::

## Output Format

`generate()` returns an [`ImageBuffer`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md) object with uncompressed 512x512 RGBA pixel bytes:

```typescript
type ImageBuffer = {
  readonly width: 512;
  readonly height: 512;
  readonly format: 'rgba';
  readonly data: Uint8Array;
};
```

You can render the output directly to screen using Skia (`Image`), convert it into canvas textures, or pipe it into subsequent visual processing pipelines.

## Determinism & Seeds

`generate(prompt, seed)` accepts an optional integer `seed` parameter:

- **With a seed** (e.g. `generate("sunset over ocean", 123)`): Reproduces the exact same image output deterministically.
- **Without a seed** (e.g. `generate("sunset over ocean")`): Uses a time-based random seed to produce a fresh variation on each execution.

## Imperative API

For background generation jobs, headless services, or manual lifecycle management outside React components, create the generator using [`createSdxsTextToImage`](../../06-api-reference/functions/createSdxsTextToImage.md):

```typescript
import { createSdxsTextToImage, models } from 'react-native-executorch';

const generator = await createSdxsTextToImage(models.textToImage.SDXS_512_DREAMSHAPER.DEFAULT);

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

## Real-Time & Worklet Execution

For synchronous worklet execution contexts, `createSdxsTextToImage` exposes a `generateWorklet` function that executes directly inside a worklet runtime without Promise scheduling overhead:

```typescript
// Called synchronously inside a worklet runtime
const imageBuffer = generator.generateWorklet(prompt, seed);
```

See [Worklets & Threading](../../03-core-and-advanced/06-worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models

The library provides ready-to-use text-to-image models from the [Software Mansion HuggingFace Text to Image Collection](https://huggingface.co/collections/software-mansion/text-to-image), available in [`models.textToImage`](../../06-api-reference/variables/models.md#texttoimage):

| Model                    | Variant                  | Size     | Platform / Acceleration   | Resolution | Notes                                                              |
| :----------------------- | :----------------------- | :------- | :------------------------ | :--------- | :----------------------------------------------------------------- |
| **SDXS 512 DreamShaper** | `XNNPACK_FP32` (default) | 1.76 GB  | Universal (CPU)           | 512x512    | Single-step distilled latent diffusion model based on DreamShaper. |
| SDXS 512 DreamShaper     | `COREML_FP16`            | 880.7 MB | iOS (Neural Engine / GPU) | 512x512    | Accelerated via Apple Core ML on iOS 17+.                          |

:::tip Using Custom Models
To use your own fine-tuned SDXS `.pte` model and CLIP tokenizer, pass a [`SdxsTextToImageModel`](../../06-api-reference/type-aliases/SdxsTextToImageModel.md) configuration object to `useTextToImage` or `createSdxsTextToImage`:

```typescript
const customGenerator = await createSdxsTextToImage({
  modelPath: 'https://example.com/my-sdxs.pte',
  tokenizerPath: 'https://example.com/tokenizer.json',
});
```

The pipeline automatically verifies that the model's exported methods (`encode`, `denoise`, `decode`) match its requirements. To prepare and export your own `.pte` model to match this pipeline, see [Exporting Custom Models](../../03-core-and-advanced/07-exporting-custom-models.md#using-a-built-in-pipeline).
:::

## API Reference

### Hooks & Pipelines

- [`useTextToImage()`](../../06-api-reference/functions/useTextToImage.md) — React hook for text-to-image model downloading, state, and lifecycle.
- [`createSdxsTextToImage()`](../../06-api-reference/functions/createSdxsTextToImage.md) — Imperative factory for SDXS text-to-image pipelines.

### Types & Options

- [`SdxsTextToImage`](../../06-api-reference/type-aliases/SdxsTextToImage.md) — Text-to-image generator runner interface (`generate`, `generateWorklet`).
- [`SdxsTextToImageModel`](../../06-api-reference/type-aliases/SdxsTextToImageModel.md) — Model configuration spec with `modelPath` and `tokenizerPath`.
- [`ImageBuffer`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md) — Generated RGBA output image buffer structure.

### Model Presets

- [`models.textToImage`](../../06-api-reference/variables/models.md#texttoimage) — Pre-configured text-to-image generation models registry.
