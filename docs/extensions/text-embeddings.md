# Text Embeddings

Text embedding models convert sentences, paragraphs, or documents into dense numeric vectors (embeddings). Sentences with similar semantic meaning map to nearby points in the vector space, even when using completely different vocabulary.

This enables on-device semantic search, offline Retrieval-Augmented Generation (RAG) against local SQLite vector stores, intent classification, and cross-modal text-to-image queries when paired with [Image Embeddings](https://docs.swmansion.com/react-native-executorch/docs/extensions/image-embeddings.md) — entirely on the client without sending private text to cloud APIs.

| iOS                                                         | Android                                                         |
| ----------------------------------------------------------- | --------------------------------------------------------------- |
| [](/react-native-executorch/media/image-embeddings-ios.mp4) | [](/react-native-executorch/media/image-embeddings-android.mp4) |

## Quick Start[​](#quick-start "Direct link to Quick Start")

The [`useTextEmbedder`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useTextEmbedder) hook manages model downloading, tokenizer loading, and lifecycle:

```tsx
import { models, useTextEmbedder } from 'react-native-executorch';

function MyComponent() {
  const embedder = useTextEmbedder(models.textEmbeddings.ALL_MINILM_L6_V2.DEFAULT);

  // Hook state:
  // embedder.isReady          — true once model and tokenizer are downloaded and loaded in memory
  // embedder.downloadProgress — 0 to 100 download progress
  // embedder.error            — Error instance if download or load failed
  // embedder.resource         — resolved config with all URLs replaced by local file paths

  const handleEmbed = async (inputText: string) => {
    if (!embedder.isReady || !embedder.embed) return;

    // Run inference on background thread
    const vector = await embedder.embed(inputText);
    console.log('Embedding dimension:', vector.length); // 384
  };

  // Trigger handleEmbed on submit from a search input or indexing loop
}

```

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Full Interactive Example in Gallery App

See [`src/app/(screens)/image-embeddings.tsx`](https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/app/\(screens\)/image-embeddings.tsx) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for a complete, runnable screen combining text and image embeddings for real-time cross-modal search.

## Output Format[​](#output-format "Direct link to Output Format")

[`embed()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/TextEmbedder#embed) returns a 1D [`Float32Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float32Array) containing the normalized feature vector:

```typescript
// Float32Array of length D (e.g. 384 for all-MiniLM-L6-v2, 768 for all-mpnet-base-v2)
const vector: Float32Array = await embedder.embed('React Native ExecuTorch enables on-device ML.');

```

### Semantic Similarity Matching[​](#semantic-similarity-matching "Direct link to Semantic Similarity Matching")

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

## Asymmetric Retrieval & Prompt Prefixes[​](#asymmetric-retrieval--prompt-prefixes "Direct link to Asymmetric Retrieval & Prompt Prefixes")

Some embedding models (like [`LFM2_5_EMBEDDING_350M`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#textembeddingslfm2_5_embedding_350m)) are trained asymmetrically where search queries and indexed passages use different prompt prefixes:

* **Indexing documents**: [`embed(documentText, 'document: ')`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/TextEmbedder#embed)
* **Searching queries**: [`embed(queryText, 'query: ')`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/TextEmbedder#embed) (default)

You can pass a custom prefix string as the optional second [`prompt`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/TextEmbedder#prompt) argument to [`embed(input, prompt)`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/TextEmbedder#embed).

## Imperative API[​](#imperative-api "Direct link to Imperative API")

For batch indexing, SQLite vector ingestion, or manual lifecycle management outside React components, create the embedder using [`createTextEmbedder`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createTextEmbedder):

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

## Synchronous Execution[​](#synchronous-execution "Direct link to Synchronous Execution")

For synchronous worklet execution contexts or high-throughput indexing workers, [`createTextEmbedder`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createTextEmbedder) exposes a synchronous [`embedWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/TextEmbedder#embedworklet) function:

```typescript
// Called synchronously inside a worklet runtime without Promise scheduling overhead
const vector = embedder.embedWorklet(rawText);

```

See [Worklets & Threading](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/worklets-and-threading.md) for details on worklet execution contexts and zero-copy host objects.

## Available Models[​](#available-models "Direct link to Available Models")

The library provides ready-to-use text embedding models from the [Software Mansion HuggingFace Text Embeddings Collection](https://huggingface.co/collections/software-mansion/text-embeddings), available in [`models.textEmbeddings`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#textembeddings):

| Model Family                              | Variants                                                                                                                                          | Output Dim | Languages     | Size Range          | Supported Backends                                            | Notes                                                             |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------- | ------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------- |
| **all-MiniLM-L6-v2**                      | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#textembeddingsall_minilm_l6_v2)                      | 384        | English       | 86.2 MB             | XNNPACK (CPU), Core ML (Apple), Vulkan (Android)              | Fast, lightweight sentence transformer for mobile vector search.  |
| **all-mpnet-base-v2**                     | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#textembeddingsall_mpnet_base_v2)                     | 768        | English       | 415.6 MB            | XNNPACK (CPU), Vulkan (Android)                               | High-capacity model with superior semantic retrieval accuracy.    |
| **multi-qa-MiniLM-L6-cos-v1**             | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#textembeddingsmulti_qa_minilm_l6_cos_v1)             | 384        | English       | 86.2 MB             | XNNPACK (CPU), Core ML (Apple), Vulkan (Android)              | Fine-tuned specifically for Question-Answering retrieval.         |
| **multi-qa-mpnet-base-dot-v1**            | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#textembeddingsmulti_qa_mpnet_base_dot_v1)            | 768        | English       | 415.6 MB            | XNNPACK (CPU), Vulkan (Android)                               | Higher-capacity Question-Answering retrieval model.               |
| **paraphrase-multilingual-MiniLM-L12-v2** | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#textembeddingsparaphrase_multilingual_minilm_l12_v2) | 384        | 50+ languages | 378.9 MB            | XNNPACK (CPU), Core ML (Apple), Vulkan (Android)              | Multilingual semantic similarity and cross-lingual text matching. |
| **distiluse-base-multilingual-cased-v2**  | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#textembeddingsdistiluse_base_multilingual_cased_v2)  | 512        | 50+ languages | 133.1 MB – 375.1 MB | XNNPACK (CPU), Core ML (Apple), MLX (Apple), Vulkan (Android) | Distilled Universal Sentence Encoder for multilingual clustering. |
| **Liquid LFM 2.5 Embedding 350M**         | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#textembeddingslfm2_5_embedding_350m)                 | 512        | Multilingual  | 179.8 MB – 548.2 MB | XNNPACK (CPU), MLX (Apple)                                    | Asymmetric search with `query:` and `document:` prompting.        |
| **CLIP ViT-B/32 Text**                    | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#textembeddingsclip_vit_base_patch32_text)            | 512        | English       | 242.2 MB            | XNNPACK (CPU), Core ML (Apple), Vulkan (Android)              | Text encoder for joint cross-modal text-to-image search.          |

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Using Custom Models

To use your own fine-tuned sentence transformer `.pte` model, pass a [`TextEmbedderModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/TextEmbedderModel) configuration object to [`useTextEmbedder`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useTextEmbedder) or [`createTextEmbedder`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createTextEmbedder):

```typescript
const customEmbedder = await createTextEmbedder({
  modelPath: 'https://example.com/my-sentence-transformer.pte',
  tokenizerPath: 'https://example.com/tokenizer.json',
  defaultPrompt: 'passage: ', // Optional default prefix
});

```

The pipeline automatically verifies that the model's exported input and output shapes match its requirements. To prepare and export your own `.pte` model to match this pipeline, see [Exporting Custom Models](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/exporting-custom-models.md#using-a-built-in-pipeline).

## API Reference[​](#api-reference "Direct link to API Reference")

### Hooks & Pipelines[​](#hooks--pipelines "Direct link to Hooks & Pipelines")

* [`useTextEmbedder()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useTextEmbedder) — React hook for text embedding model downloading, state, and lifecycle.
* [`createTextEmbedder()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createTextEmbedder) — Imperative factory for text embedding pipelines.
* [`useImageEmbedder()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useImageEmbedder) — React hook for vision embedding models to pair with text embeddings.

### Types & Options[​](#types--options "Direct link to Types & Options")

* [`TextEmbedder`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/TextEmbedder) — Text embedder runner interface ([`embed`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/TextEmbedder#embed), [`embedWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/TextEmbedder#embedworklet)).
* [`TextEmbedderModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/TextEmbedderModel) — Model configuration spec with `modelPath`, `tokenizerPath`, and `defaultPrompt`.

### Model Presets[​](#model-presets "Direct link to Model Presets")

* [`models.textEmbeddings`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#textembeddings) — Pre-configured text embedding models registry.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Source Code

View the implementation on GitHub:

* [`src/extensions/nlp/tasks/textEmbedding.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/tasks/textEmbedding.ts)
