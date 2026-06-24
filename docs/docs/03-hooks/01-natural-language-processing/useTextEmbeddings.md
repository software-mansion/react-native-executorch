---
title: useTextEmbeddings
keywords:
  [
    text embedding,
    text embeddings,
    embeddings,
    react native,
    executorch,
    ai,
    machine learning,
    on-device,
    mobile ai,
  ]
description: "Learn how to use text embeddings models in your React Native applications with React Native ExecuTorch's useTextEmbeddings hook."
---

Text Embedding is the process of converting text into a numerical representation. This representation can be used for various natural language processing tasks, such as semantic search, text classification, and clustering.

:::info
It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/text-embeddings-68d0ed42f8ca0200d0283362). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

## API Reference

- For detailed API Reference for `useTextEmbeddings` see: [`useTextEmbeddings` API Reference](../../06-api-reference/functions/useTextEmbeddings.md).
- For all text embeddings models available out-of-the-box in React Native ExecuTorch see: [Text Embeddings Models](../../06-api-reference/index.md#models---text-embeddings).

## High Level Overview

```typescript
import { models, useTextEmbeddings } from 'react-native-executorch';
const model = useTextEmbeddings({
  model: models.text_embedding.all_minilm_l6_v2(),
});

try {
  const embedding = await model.forward('Hello World!');
} catch (error) {
  console.error(error);
}
```

### Arguments

`useTextEmbeddings` takes [`TextEmbeddingsProps`](../../06-api-reference/interfaces/TextEmbeddingsProps.md) that consists of:

- `model` of type `object` ([`TextEmbeddingsModel`](../../06-api-reference/interfaces/TextEmbeddingsModel.md)) containing:
  - `modelName` - Unique name identifying the model.
  - `modelSource` - Location of the used model.
  - `tokenizerSource` - Location of the used tokenizer.
  - `prompts` _(optional)_ - Asymmetric `query`/`document` prompts the model is trained with. When present, `forward` requires a `role` and prepends the matching prompt.
  - `multiVector` _(optional)_ - When `true`, `forward` returns the per-token [`EmbeddingResult`](../../06-api-reference/interfaces/EmbeddingResult.md) instead of a single pooled `Float32Array`.
  - `skipListIds` _(optional)_ - Token ids to exclude from late-interaction (MaxSim) scoring.
- An optional flag [`preventLoad`](../../06-api-reference/interfaces/TextEmbeddingsProps.md#preventload) which prevents auto-loading of the model.

You need more details? Check the following resources:

- For detailed information about `useTextEmbeddings` arguments check this section: [`useTextEmbeddings` arguments](../../06-api-reference/functions/useTextEmbeddings.md#parameters).
- For all text embeddings models available out-of-the-box in React Native ExecuTorch see: [Text Embeddings Models](../../06-api-reference/index.md#models---text-embeddings).
- For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

`useTextEmbeddings` returns an object called `TextEmbeddingsType` containing bunch of functions to interact with text embedding. To get more details please read: [`TextEmbeddingsType` API Reference](../../06-api-reference/interfaces/TextEmbeddingsType.md).

## Running the model

To run the model, you can use the [`forward`](../../06-api-reference/interfaces/TextEmbeddingsType.md#forward) method. It accepts the text to embed and, for models trained with asymmetric prompts, an optional `role`. The return type depends on the model:

- **Pooled models** (the default, e.g. MiniLM, MPNet, LFM2.5-Embedding) resolve to a single `Float32Array` — one normalized vector for the whole input.
- **Multi-vector models** (`multiVector: true`, e.g. LFM2.5-ColBERT) resolve to an [`EmbeddingResult`](../../06-api-reference/interfaces/EmbeddingResult.md) with the per-token vectors (`vectors`, `numTokens`, `embeddingDim`, `tokenIds`).

For background on why a dense bi-encoder pools to one vector while a late-interaction model keeps per-token vectors, see Liquid AI's [LFM2.5 Retrievers blog post](https://www.liquid.ai/blog/lfm2-5-retrievers).

### Asymmetric prompts (`role`)

Some retrieval models are trained to embed queries and documents with different prefixes (e.g. LFM2.5 uses `query: `/`document: `, ColBERT uses `[Q] `/`[D] `). For these models the model config carries the prompts and `forward` requires a `role`:

```typescript
const queryEmbedding = await model.forward('What is the weather?', 'query');
const docEmbedding = await model.forward('It is sunny today.', 'document');
```

The matching prompt is prepended automatically; for models without prompts the `role` argument is absent.

## Example

```typescript
import { models, useTextEmbeddings, dotProduct } from 'react-native-executorch';

const cosineSimilarity = (a: Float32Array, b: Float32Array) => {
  const dot = dotProduct(a, b);
  const normA = Math.sqrt(dotProduct(a, a));
  const normB = Math.sqrt(dotProduct(b, b));
  return dot / (normA * normB);
};

function App() {
  const model = useTextEmbeddings({
    model: models.text_embedding.all_minilm_l6_v2(),
  });

  // ...

  try {
    const helloWorldEmbedding = await model.forward('Hello World!');
    const goodMorningEmbedding = await model.forward('Good Morning!');

    const similarity = cosineSimilarity(
      helloWorldEmbedding,
      goodMorningEmbedding
    );

    console.log(`Cosine similarity: ${similarity}`);
  } catch (error) {
    console.error(error);
  }

  // ...
}
```

## Supported models

| Model                                                                                                                       |   Language    | Max Tokens | Embedding Dimensions | Description                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------- | :-----------: | :--------: | :------------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)                                           |    English    |    254     |         384          | All-round model tuned for many use-cases. Trained on a large and diverse dataset of over 1 billion training pairs.                                                                                                                                                                                                                                                                                                               |
| [all-mpnet-base-v2](https://huggingface.co/sentence-transformers/all-mpnet-base-v2)                                         |    English    |    382     |         768          | All-round model tuned for many use-cases. Trained on a large and diverse dataset of over 1 billion training pairs.                                                                                                                                                                                                                                                                                                               |
| [multi-qa-MiniLM-L6-cos-v1](https://huggingface.co/sentence-transformers/multi-qa-MiniLM-L6-cos-v1)                         |    English    |    509     |         384          | This model was tuned for semantic search: Given a query/question, it can find relevant passages. It was trained on a large and diverse set of (question, answer) pairs.                                                                                                                                                                                                                                                          |
| [multi-qa-mpnet-base-dot-v1](https://huggingface.co/sentence-transformers/multi-qa-mpnet-base-dot-v1)                       |    English    |    510     |         768          | This model was tuned for semantic search: Given a query/question, it can find relevant passages. It was trained on a large and diverse set of (question, answer) pairs.                                                                                                                                                                                                                                                          |
| [distiluse-base-multilingual-cased-v2](https://huggingface.co/sentence-transformers/distiluse-base-multilingual-cased-v2)   | 50+ languages |    126     |         512          | Multilingual DistilBERT with a 768→512 projection head. Recommended when broader language coverage matters more than the exact English quality of MiniLM/MPNet.                                                                                                                                                                                                                                                                  |
| [paraphrase-multilingual-MiniLM-L12-v2](https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2) | 50+ languages |    126     |         384          | Multilingual MiniLM-L12 distilled from paraphrase-multilingual-mpnet-base-v2. Compact (≈118 M params) sentence encoder for cross-lingual semantic similarity and retrieval across 50+ languages.                                                                                                                                                                                                                                 |
| [clip-vit-base-patch32-text](https://huggingface.co/openai/clip-vit-base-patch32)                                           |    English    |     74     |         512          | CLIP (Contrastive Language-Image Pre-Training) is a neural network trained on a variety of (image, text) pairs. CLIP allows to embed images and text into the same vector space. This allows to find similar images as well as to implement image search. This is the text encoder part of the CLIP model. To embed images checkout [clip-vit-base-patch32-image](../02-computer-vision/useImageEmbeddings.md#supported-models). |
| [LFM2.5-Embedding-350M](https://huggingface.co/LiquidAI/LFM2.5-Embedding-350M)                                              | Multilingual  |    512     |         1024         | Dense bi-encoder from Liquid AI with CLS pooling. Trained with asymmetric `query: `/`document: ` prompts, so `forward` requires a `role`. On iOS it runs on the GPU via the MLX backend (physical device only); Android uses XNNPACK.                                                                                                                                                                                            |
| [LFM2.5-ColBERT-350M](https://huggingface.co/LiquidAI/LFM2.5-ColBERT-350M)                                                  | Multilingual  |    512     |   128 (per token)    | Late-interaction (multi-vector) retriever from Liquid AI: a `Linear(1024→128)` head emits one normalized vector per token. `forward` returns an `EmbeddingResult`; score query/document pairs with MaxSim (see below). Uses `[Q] `/`[D] ` role prompts.                                                                                                                                                                          |

**`Max Tokens`** - The maximum number of tokens that can be processed by the model. If the input text exceeds this limit, it will be truncated.

**`Embedding Dimensions`** - The size of the output embedding vector. This is the number of dimensions in the vector representation of the input text.

:::note
For the supported models, the returned embedding vector is normalized, meaning that its length is equal to 1. This allows for easier comparison of vectors using cosine similarity, just calculate the dot product of two vectors to get the cosine similarity score.
:::

## Late interaction (multi-vector models)

Multi-vector models such as LFM2.5-ColBERT do not pool the sequence into a single vector. Instead, `forward` returns an [`EmbeddingResult`](../../06-api-reference/interfaces/EmbeddingResult.md) holding one normalized vector per token. You score a query against a document with **MaxSim**: for every query-token vector, take its highest dot product against the document-token vectors, then sum those maxima. The model also ships a `skipListIds` array — the punctuation token ids excluded from scoring.

The library ships a `maxSim` helper (and a `dotProduct` helper for pooled models), so you can score directly without reimplementing it:

```typescript
import { models, useTextEmbeddings, maxSim } from 'react-native-executorch';

const colbert = models.text_embedding.lfm2_5_colbert_350m();
const skipListIds = colbert.skipListIds ?? [];

function App() {
  const model = useTextEmbeddings({ model: colbert });

  // ...

  const query = await model.forward('What is the weather?', 'query');
  const doc = await model.forward('It is sunny today.', 'document');
  const score = maxSim(query, doc, skipListIds);
}
```

The `skipListIds` shipped on the model config are the punctuation token ids excluded from scoring (derived from the model's training config). Per-token vectors are L2-normalized by the graph, so the dot product equals cosine similarity.
