---
title: Image Embeddings
slug: /extensions/image-embeddings
description: 'Generate high-dimensional visual feature vectors from images using multimodal models like OpenAI CLIP for zero-shot classification and search.'
keywords:
  [
    react native,
    image embeddings,
    feature extraction,
    clip,
    vision transformer,
    multimodal,
    vector search,
    mobile ml,
    on-device ai,
  ]
---

# Image Embeddings

Image embedding models extract high-dimensional semantic feature vectors (embeddings) from raw images. When paired with multimodal models like OpenAI CLIP (Contrastive Language-Image Pretraining) and [Text Embeddings](../../02-extensions/natural-language/03-text-embeddings.md), image and text embeddings share the same joint vector space.

This enables on-device cross-modal photo search (finding pictures with natural language queries), zero-shot image classification, visual similarity clustering, and vector search against local SQLite vector stores — all computed entirely on-device without network latency or cloud costs.

<!-- GIF DEMO PLACEHOLDER: Place image embedding demo gif here, e.g. ![Image Embedding Demo](./media/image-embeddings.gif) -->

## Quick Start

The [`useImageEmbedder`](../../06-api-reference/functions/useImageEmbedder.md) hook manages model downloading, initialization, and lifecycle:

```tsx
import { models, useImageEmbedder } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

function MyComponent() {
  const imageEmbedder = useImageEmbedder(models.imageEmbeddings.CLIP_VIT_BASE_PATCH32.DEFAULT);

  // Hook state:
  // imageEmbedder.isReady          — true once model is downloaded and loaded in memory
  // imageEmbedder.downloadProgress — 0.0 to 1.0 download progress
  // imageEmbedder.error            — Error instance if download or load failed

  const handleEmbed = async (imageBuffer: ImageBuffer) => {
    if (!imageEmbedder.isReady || !imageEmbedder.embed) return;

    // Run inference on background thread
    const vector = await imageEmbedder.embed(imageBuffer);
    console.log('Embedding dimension:', vector.length); // 512
  };

  // Trigger handleEmbed from an image picker, button press, or camera frame
}
```

<!-- TODO: Update gallery URL once repo is moved to software-mansion organization -->

:::tip Full Interactive Example in Gallery App
See [`src/app/image-embeddings.tsx`](https://github.com/barhanc/react-native-executorch-gallery/blob/main/src/app/image-embeddings.tsx) in the [React Native ExecuTorch Gallery](https://github.com/barhanc/react-native-executorch-gallery) for a complete, runnable screen combining image and text embeddings for real-time zero-shot photo ranking.
:::

## Output Format

`embed()` returns a 1D [`Float32Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float32Array) containing the normalized feature vector:

```typescript
// Float32Array of length D (e.g. 512 for CLIP ViT-B/32)
const vector: Float32Array = await imageEmbedder.embed(imageBuffer);
```

### Cross-Modal Similarity Matching

To compute the cosine similarity between an image embedding and a text query embedding produced by [`useTextEmbedder`](../../06-api-reference/functions/useTextEmbedder.md), compute their dot product:

```typescript
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

// Compare image vector with query text vector
const score = cosineSimilarity(imageVector, textVector);
console.log('Match similarity score:', score);
```

## Imperative API

For background indexing, SQLite vector ingestion, or manual lifecycle management outside React components, create the embedder using [`createImageEmbedder`](../../06-api-reference/functions/createImageEmbedder.md):

```typescript
import { createImageEmbedder, models } from 'react-native-executorch';

const embedder = await createImageEmbedder(models.imageEmbeddings.CLIP_VIT_BASE_PATCH32.DEFAULT);

try {
  const vector = await embedder.embed(imageBuffer);
  console.log('Generated vector:', vector.slice(0, 5));
} finally {
  // Always release native resources when finished
  embedder.dispose();
}
```

## Synchronous Execution

For high-throughput loops or real-time camera feature extraction, `createImageEmbedder` exposes a synchronous `embedWorklet` function. This runs directly on the worklet thread with zero Promise scheduling overhead:

```typescript
// Called synchronously inside a worklet runtime on the UI thread
const vector = embedder.embedWorklet(frameBuffer);
```

See [Worklets & Threading](../../03-core-and-advanced/06-worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models

The library provides ready-to-use vision encoders from the [Software Mansion HuggingFace Image Embeddings Collection](https://huggingface.co/collections/software-mansion/image-embeddings), available in [`models.imageEmbeddings`](../../06-api-reference/variables/models.md#imageembeddings):

| Model             | Variant                  | Size     | Platform / Acceleration   | Output Dim | Notes                                                                       |
| :---------------- | :----------------------- | :------- | :------------------------ | :--------- | :-------------------------------------------------------------------------- |
| **CLIP ViT-B/32** | `XNNPACK_FP32` (default) | 351.6 MB | Universal (CPU)           | 512        | Vision Transformer encoder trained in joint vision-language representation. |
| CLIP ViT-B/32     | `COREML_FP16`            | 176.2 MB | iOS (Neural Engine / GPU) | 512        | Accelerated via Apple Core ML on iOS 17+.                                   |
| CLIP ViT-B/32     | `MLX_INT8`               | ~88 MB   | Apple Silicon (MLX)       | 512        | 8-bit quantized MLX backend for macOS/iOS.                                  |

:::tip Using Custom Models
To use your own fine-tuned vision encoder `.pte` model, pass an [`ImageEmbedderModel`](../../06-api-reference/type-aliases/ImageEmbedderModel.md) configuration object to `useImageEmbedder` or `createImageEmbedder`:

```typescript
const customEmbedder = await createImageEmbedder({
  modelPath: 'https://example.com/my-vision-encoder.pte',
  modelOpts: {
    resizeMode: 'stretch',
    interpolation: 'linear',
    normalizeOpts: { alpha: 1 / 255.0, beta: 0.0 },
  },
});
```

The pipeline automatically verifies that the model's exported input and output shapes match its requirements. To prepare and export your own `.pte` model to match this pipeline, see [Exporting Custom Models](../../03-core-and-advanced/07-exporting-custom-models.md#using-a-built-in-pipeline).
:::

## API Reference

### Hooks & Pipelines

- [`useImageEmbedder()`](../../06-api-reference/functions/useImageEmbedder.md) — React hook for vision embedding model downloading, state, and lifecycle.
- [`createImageEmbedder()`](../../06-api-reference/functions/createImageEmbedder.md) — Imperative factory for vision embedding pipelines.
- [`useTextEmbedder()`](../../06-api-reference/functions/useTextEmbedder.md) — React hook for text embedding models to pair with vision encoders.

### Types & Options

- [`ImageEmbedder`](../../06-api-reference/type-aliases/ImageEmbedder.md) — Image embedder runner interface (`embed`, `embedWorklet`).
- [`ImageEmbedderModel`](../../06-api-reference/type-aliases/ImageEmbedderModel.md) — Model configuration spec for vision embedders.
- [`ImagePreprocessorOptions`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/ImagePreprocessorOptions.md) — Options defining normalization, interpolation, and resize modes.
- [`ImageBuffer`](../../06-api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md) — Input image buffer structure.

### Model Presets

- [`models.imageEmbeddings`](../../06-api-reference/variables/models.md#imageembeddings) — Pre-configured vision encoder models registry.
