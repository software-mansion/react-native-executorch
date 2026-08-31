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

<!-- TODO: Update gallery URL once repo is moved to software-mansion organization -->

:::tip Full Interactive Example in Gallery App
See [`src/app/image-embeddings.tsx`](https://github.com/barhanc/react-native-executorch-gallery/blob/main/src/app/image-embeddings.tsx) in the [React Native ExecuTorch Gallery](https://github.com/barhanc/react-native-executorch-gallery) for an interactive example combining `useTextEmbedder` and `useImageEmbedder` for real-time cross-modal image retrieval.
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
import { createTextEmbedder, models } from 'react-native-executorch';

const embedder = await createTextEmbedder(models.textEmbeddings.ALL_MINILM_L6_V2.DEFAULT);

try {
  const vector = await embedder.embed('Vector search index item');
  console.log('Generated vector:', vector.slice(0, 5));
} finally {
  // Always release native resources when finished
  embedder.dispose();
}
```

## Real-Time & Worklet Execution

For synchronous worklet execution contexts or high-throughput indexing workers, `createTextEmbedder` exposes a synchronous `embedWorklet` function:

```typescript
// Called synchronously inside a worklet runtime without Promise scheduling overhead
const vector = embedder.embedWorklet(rawText);
```

See [Worklets & Threading](../../03-core-and-advanced/06-worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models

The library provides ready-to-use text embedding models from the [Software Mansion HuggingFace Text Embeddings Collection](https://huggingface.co/collections/software-mansion/text-embeddings), available in [`models.textEmbeddings`](../../06-api-reference/variables/models.md#textembeddings):

| Model                                     | Supported Variants                    | Size (Default) | Output Dim | Languages     | Notes                                                                            |
| :---------------------------------------- | :------------------------------------ | :------------- | :--------- | :------------ | :------------------------------------------------------------------------------- |
| **all-MiniLM-L6-v2**                      | `XNNPACK_FP32` (default)              | 90 MB          | 384        | English       | Fast, lightweight general-purpose sentence transformer for mobile vector search. |
| **all-mpnet-base-v2**                     | `XNNPACK_FP32` (default)              | 436 MB         | 768        | English       | High-capacity model based on MPNet with superior semantic retrieval accuracy.    |
| **multi-qa-MiniLM-L6-cos-v1**             | `XNNPACK_FP32` (default)              | 90 MB          | 384        | English       | Fine-tuned specifically for Question-Answering retrieval using cosine distance.  |
| **multi-qa-mpnet-base-dot-v1**            | `XNNPACK_FP32` (default)              | 436 MB         | 768        | English       | High-accuracy Question-Answering model optimized for dot-product matching.       |
| **paraphrase-multilingual-MiniLM-L12-v2** | `XNNPACK_8DA4W` (default)             | 397 MB         | 384        | 50+ languages | Multilingual semantic similarity and cross-lingual text matching.                |
| **distiluse-base-multilingual-cased-v2**  | `XNNPACK_8DA4W` (default), `MLX_INT8` | 393 MB         | 512        | 50+ languages | Distilled Universal Sentence Encoder supporting cross-lingual clustering.        |
| **CLIP ViT-B/32 Text**                    | `XNNPACK_FP32` (default)              | 247 MB         | 512        | English       | CLIP text encoder for joint image-text cross-modal search.                       |
| **LFM 2.5 Embedding 350M**                | `XNNPACK_8DA4W` (default), `MLX_INT4` | 575 MB         | 512        | Multilingual  | Liquid AI asymmetric search model with `query:` and `document:` prompting.       |

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
