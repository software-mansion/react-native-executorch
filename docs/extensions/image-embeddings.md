# Image Embeddings

Image embedding models extract high-dimensional semantic feature vectors (embeddings) from raw images. When paired with multimodal models like OpenAI CLIP (Contrastive Language-Image Pretraining) and [Text Embeddings](https://docs.swmansion.com/react-native-executorch/docs/extensions/text-embeddings.md), image and text embeddings share the same joint vector space.

This enables on-device cross-modal photo search (finding pictures with natural language queries), zero-shot image classification, visual similarity clustering, and vector search against local SQLite vector stores — all computed entirely on-device without network latency or cloud costs.

| iOS                                                         | Android                                                         |
| ----------------------------------------------------------- | --------------------------------------------------------------- |
| [](/react-native-executorch/media/image-embeddings-ios.mp4) | [](/react-native-executorch/media/image-embeddings-android.mp4) |

## Quick Start[​](#quick-start "Direct link to Quick Start")

The [`useImageEmbedder`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useImageEmbedder) hook manages model downloading, initialization, and lifecycle:

```tsx
import { models, useImageEmbedder } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

function MyComponent() {
  const imageEmbedder = useImageEmbedder(models.imageEmbeddings.CLIP_VIT_BASE_PATCH32.DEFAULT);

  // Hook state:
  // imageEmbedder.isReady          — true once model is downloaded and loaded in memory
  // imageEmbedder.downloadProgress — 0 to 100 download progress
  // imageEmbedder.error            — Error instance if download or load failed
  // imageEmbedder.resource         — resolved config with all URLs replaced by local file paths

  const handleEmbed = async (imageBuffer: ImageBuffer) => {
    if (!imageEmbedder.isReady || !imageEmbedder.embed) return;

    // Run inference on background thread
    const vector = await imageEmbedder.embed(imageBuffer);
    console.log('Embedding dimension:', vector.length); // 512
  };

  // Trigger handleEmbed from an image picker, button press, or camera frame
}

```

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Full Interactive Example in Gallery App

See [`src/app/(screens)/image-embeddings.tsx`](https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/app/\(screens\)/image-embeddings.tsx) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for a complete, runnable screen combining image and text embeddings for real-time zero-shot photo ranking.

## Output Format[​](#output-format "Direct link to Output Format")

[`embed()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ImageEmbedder#embed) returns a 1D [`Float32Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float32Array) containing the normalized feature vector:

```typescript
// Float32Array of length D (e.g. 512 for CLIP ViT-B/32)
const vector: Float32Array = await imageEmbedder.embed(imageBuffer);

```

### Cross-Modal Similarity Matching[​](#cross-modal-similarity-matching "Direct link to Cross-Modal Similarity Matching")

To compute the cosine similarity between an image embedding and a text query embedding produced by [`useTextEmbedder`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useTextEmbedder), compute their dot product:

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

## Imperative API[​](#imperative-api "Direct link to Imperative API")

For background indexing, SQLite vector ingestion, or manual lifecycle management outside React components, create the embedder using [`createImageEmbedder`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createImageEmbedder):

```typescript
import { createImageEmbedder, download, models } from 'react-native-executorch';

// Download and cache model assets before creating the pipeline
const model = await download(models.imageEmbeddings.CLIP_VIT_BASE_PATCH32.DEFAULT);
const embedder = await createImageEmbedder(model);

try {
  const vector = await embedder.embed(imageBuffer);
  console.log('Generated vector:', vector.slice(0, 5));
} finally {
  // Always release native resources when finished
  embedder.dispose();
}

```

## Synchronous Execution[​](#synchronous-execution "Direct link to Synchronous Execution")

For high-throughput loops or real-time camera feature extraction, [`createImageEmbedder`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createImageEmbedder) exposes a synchronous [`embedWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ImageEmbedder#embedworklet) function. This runs directly on the worklet thread with zero Promise scheduling overhead:

```typescript
// Called synchronously inside a worklet runtime on the UI thread
const vector = embedder.embedWorklet(frameBuffer);

```

See [Worklets & Threading](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models[​](#available-models "Direct link to Available Models")

The library provides ready-to-use vision encoders from the [Software Mansion HuggingFace Image Embeddings Collection](https://huggingface.co/collections/software-mansion/image-embeddings), available in [`models.imageEmbeddings`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#imageembeddings):

| Model Family             | Variants                                                                                                                           | Output Dim | Size Range         | Supported Backends                                            | Notes                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------ | ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **CLIP ViT-B/32 Vision** | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#imageembeddingsclip_vit_base_patch32) | 512        | 93.7 MB – 335.3 MB | XNNPACK (CPU), Core ML (Apple), MLX (Apple), Vulkan (Android) | Joint image-text semantic search, image clustering, and zero-shot categorization. |

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Using Custom Models

To use your own fine-tuned vision encoder `.pte` model, pass an [`ImageEmbedderModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ImageEmbedderModel) configuration object to [`useImageEmbedder`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useImageEmbedder) or [`createImageEmbedder`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createImageEmbedder):

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

The pipeline automatically verifies that the model's exported input and output shapes match its requirements. To prepare and export your own `.pte` model to match this pipeline, see [Exporting Custom Models](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/exporting-custom-models.md#using-a-built-in-pipeline).

## API Reference[​](#api-reference "Direct link to API Reference")

### Hooks & Pipelines[​](#hooks--pipelines "Direct link to Hooks & Pipelines")

* [`useImageEmbedder()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useImageEmbedder) — React hook for vision embedding model downloading, state, and lifecycle.
* [`createImageEmbedder()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createImageEmbedder) — Imperative factory for vision embedding pipelines.
* [`useTextEmbedder()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useTextEmbedder) — React hook for text embedding models to pair with vision encoders.

### Types & Options[​](#types--options "Direct link to Types & Options")

* [`ImageEmbedder`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ImageEmbedder) — Image embedder runner interface (`embed`, `embedWorklet`).
* [`ImageEmbedderModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ImageEmbedderModel) — Model configuration spec for vision embedders.
* [`ImagePreprocessorOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/type-aliases/ImagePreprocessorOptions) — Options defining normalization, interpolation, and resize modes.
* [`ImageBuffer`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/cv/type-aliases/ImageBuffer) — Input image buffer structure.

### Model Presets[​](#model-presets "Direct link to Model Presets")

* [`models.imageEmbeddings`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#imageembeddings) — Pre-configured vision encoder models registry.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Source Code

View the implementation on GitHub:

* [`src/extensions/cv/tasks/imageEmbedding.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/imageEmbedding.ts)
