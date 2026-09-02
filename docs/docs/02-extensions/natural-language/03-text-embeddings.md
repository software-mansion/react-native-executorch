---
title: Text Embeddings
slug: /extensions/text-embeddings
description: 'Generate high-dimensional semantic dense vectors from natural language text for on-device semantic search, vector databases, RAG, and cross-modal matching.'
keywords:
  [
    react native,
    text embeddings,
    sentence transformers,
    semantic search,
    vector search,
    rag,
    minilm,
    mpnet,
    clip,
    mobile ml,
    on-device ai,
  ]
---

# Text Embeddings

Text embedding models convert sentences, paragraphs, or documents into dense numeric vectors (embeddings). Sentences with similar semantic meaning map to nearby points in the vector space, even when using completely different vocabulary.

This enables on-device semantic search, offline Retrieval-Augmented Generation (RAG) against local SQLite vector stores, intent classification, and cross-modal text-to-image queries when paired with [Image Embeddings](../computer-vision/09-image-embeddings.md) — entirely on the client without sending private text to cloud APIs.

<!-- GIF DEMO PLACEHOLDER: Place text embeddings demo gif here, e.g. ![Text Embeddings Demo](./media/text-embeddings.gif) -->

## Quick Start

The [`useTextEmbedder`](../../06-api-reference/functions/useTextEmbedder.md) hook manages model downloading, tokenizer loading, and lifecycle:

```tsx
import { models, useTextEmbedder } from 'react-native-executorch';

function MyComponent() {
  const embedder = useTextEmbedder(models.textEmbeddings.ALL_MINILM_L6_V2.DEFAULT);

  // Hook state:
  // embedder.isReady          — true once model and tokenizer are downloaded and loaded in memory
  // embedder.downloadProgress — 0.0 to 1.0 download progress
  // embedder.error            — Error instance if download or load failed

  const handleEmbed = async (inputText: string) => {
    if (!embedder.isReady || !embedder.embed) return;

    // Run inference on background thread
    const vector = await embedder.embed(inputText);
    console.log('Embedding dimension:', vector.length); // 384
  };

  // Trigger handleEmbed on submit from a search input or indexing loop
}
```

:::tip Full Interactive Example in Gallery App
See [`src/app/(screens)/image-embeddings.tsx`](<https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/app/(screens)/image-embeddings.tsx>) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for an interactive example combining `useTextEmbedder` and `useImageEmbedder` for real-time cross-modal image retrieval.
:::

## Output Format

`embed()` returns a 1D [`Float32Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float32Array) containing the normalized feature vector:

```typescript
// Float32Array of length D (e.g. 384 for all-MiniLM-L6-v2, 768 for all-mpnet-base-v2)
const vector: Float32Array = await embedder.embed('React Native ExecuTorch enables on-device ML.');
```

### Semantic Similarity Matching

To compare semantic similarity between two text snippets (or between an asymmetric query and a document), calculate their cosine similarity / dot product:

```typescript
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

const v1 = await embedder.embed('How do I reset my password?');
const v2 = await embedder.embed('Steps to change account credentials');
const v3 = await embedder.embed('What is the weather in Tokyo?');

console.log('Similarity (related):', cosineSimilarity(v1, v2)); // ~0.85
console.log('Similarity (unrelated):', cosineSimilarity(v1, v3)); // ~0.15
```

## Asymmetric Retrieval & Prompt Prefixes

Some embedding models (like `LFM2_5_EMBEDDING_350M`) are trained asymmetrically where search queries and indexed passages use different prompt prefixes:

- **Indexing documents**: `embed(documentText, 'document: ')`
- **Searching queries**: `embed(queryText, 'query: ')` (default)

You can pass a custom prefix string as the optional second argument to `embed(input, prompt)`.

## Imperative API

For batch indexing, SQLite vector ingestion, or manual lifecycle management outside React components, create the embedder using [`createTextEmbedder`](../../06-api-reference/functions/createTextEmbedder.md):

```typescript
import { createTextEmbedder, download, models } from 'react-native-executorch';

// Download and cache model assets before creating the imperative pipeline
const model = await download(models.textEmbeddings.ALL_MINILM_L6_V2.DEFAULT);
const embedder = await createTextEmbedder(model);

try {
  const vector = await embedder.embed('Vector search index item');
  console.log('Generated vector:', vector.slice(0, 5));
} finally {
  // Always release native resources when finished
  embedder.dispose();
}
```

## Synchronous Execution

For synchronous worklet execution contexts or high-throughput indexing workers, `createTextEmbedder` exposes a synchronous `embedWorklet` function:

```typescript
// Called synchronously inside a worklet runtime without Promise scheduling overhead
const vector = embedder.embedWorklet(rawText);
```

See [Worklets & Threading](../../03-core-and-advanced/06-worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models

The library provides ready-to-use text embedding models from the [Software Mansion HuggingFace Text Embeddings Collection](https://huggingface.co/collections/software-mansion/text-embeddings), available in [`models.textEmbeddings`](../../06-api-reference/variables/models.md#textembeddings):

| Model Family                              | Variants                                                                                                                                                                                                                                                     | Output Dim | Languages     | Size Range          | Supported Backends                                            | Notes                                                             |
| :---------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------- | :------------ | :------------------ | :------------------------------------------------------------ | :---------------------------------------------------------------- |
| **all-MiniLM-L6-v2**                      | [`models.textEmbeddings.ALL_MINILM_L6_V2`](../../06-api-reference/variables/models.md#textembeddingsall_minilm_l6_v2)                                                                                                                                        | 384        | English       | 86.2 MB             | XNNPACK (CPU), Core ML (Apple), Vulkan (Android)              | Fast, lightweight sentence transformer for mobile vector search.  |
| **all-mpnet-base-v2**                     | [`models.textEmbeddings.ALL_MPNET_BASE_V2`](../../06-api-reference/variables/models.md#textembeddingsall_mpnet_base_v2)                                                                                                                                      | 768        | English       | 415.6 MB            | XNNPACK (CPU), Vulkan (Android)                               | High-capacity model with superior semantic retrieval accuracy.    |
| **multi-qa-MiniLM / mpnet**               | [`models.textEmbeddings.MULTI_QA_MINILM_L6_COS_V1`](../../06-api-reference/variables/models.md#textembeddingsmulti_qa_minilm_l6_cos_v1), [`MULTI_QA_MPNET_BASE_DOT_V1`](../../06-api-reference/variables/models.md#textembeddingsmulti_qa_mpnet_base_dot_v1) | 384 / 768  | English       | 86.2 MB – 415.6 MB  | XNNPACK (CPU), Core ML (Apple), Vulkan (Android)              | Fine-tuned specifically for Question-Answering retrieval.         |
| **paraphrase-multilingual-MiniLM-L12-v2** | [`models.textEmbeddings.PARAPHRASE_MULTILINGUAL_MINILM_L12_V2`](../../06-api-reference/variables/models.md#textembeddingsparaphrase_multilingual_minilm_l12_v2)                                                                                              | 384        | 50+ languages | 378.9 MB            | XNNPACK (CPU), Core ML (Apple), Vulkan (Android)              | Multilingual semantic similarity and cross-lingual text matching. |
| **distiluse-base-multilingual-cased-v2**  | [`models.textEmbeddings.DISTILUSE_BASE_MULTILINGUAL_CASED_V2`](../../06-api-reference/variables/models.md#textembeddingsdistiluse_base_multilingual_cased_v2)                                                                                                | 512        | 50+ languages | 133.1 MB – 375.1 MB | XNNPACK (CPU), Core ML (Apple), MLX (Apple), Vulkan (Android) | Distilled Universal Sentence Encoder for multilingual clustering. |
| **Liquid LFM 2.5 Embedding 350M**         | [`models.textEmbeddings.LFM2_5_EMBEDDING_350M`](../../06-api-reference/variables/models.md#textembeddingslfm2_5_embedding_350m)                                                                                                                              | 512        | Multilingual  | 179.8 MB – 548.2 MB | XNNPACK (CPU), MLX (Apple)                                    | Asymmetric search with `query:` and `document:` prompting.        |
| **CLIP ViT-B/32 Text**                    | [`models.textEmbeddings.CLIP_VIT_BASE_PATCH32_TEXT`](../../06-api-reference/variables/models.md#textembeddingsclip_vit_base_patch32_text)                                                                                                                    | 512        | English       | 242.2 MB            | XNNPACK (CPU), Core ML (Apple), Vulkan (Android)              | Text encoder for joint cross-modal text-to-image search.          |

:::tip Using Custom Models
To use your own fine-tuned sentence transformer `.pte` model, pass a [`TextEmbedderModel`](../../06-api-reference/type-aliases/TextEmbedderModel.md) configuration object to `useTextEmbedder` or `createTextEmbedder`:

```typescript
const customEmbedder = await createTextEmbedder({
  modelPath: 'https://example.com/my-sentence-transformer.pte',
  tokenizerPath: 'https://example.com/tokenizer.json',
  defaultPrompt: 'passage: ', // Optional default prefix
});
```

The pipeline automatically verifies that the model's exported input and output shapes match its requirements. To prepare and export your own `.pte` model to match this pipeline, see [Exporting Custom Models](../../03-core-and-advanced/07-exporting-custom-models.md#using-a-built-in-pipeline).
:::

## API Reference

### Hooks & Pipelines

- [`useTextEmbedder()`](../../06-api-reference/functions/useTextEmbedder.md) — React hook for text embedding model downloading, state, and lifecycle.
- [`createTextEmbedder()`](../../06-api-reference/functions/createTextEmbedder.md) — Imperative factory for text embedding pipelines.
- [`useImageEmbedder()`](../../06-api-reference/functions/useImageEmbedder.md) — React hook for vision embedding models to pair with text embeddings.

### Types & Options

- [`TextEmbedder`](../../06-api-reference/type-aliases/TextEmbedder.md) — Text embedder runner interface (`embed`, `embedWorklet`).
- [`TextEmbedderModel`](../../06-api-reference/type-aliases/TextEmbedderModel.md) — Model configuration spec with `modelPath`, `tokenizerPath`, and `defaultPrompt`.

### Model Presets

- [`models.textEmbeddings`](../../06-api-reference/variables/models.md#textembeddings) — Pre-configured text embedding models registry.
