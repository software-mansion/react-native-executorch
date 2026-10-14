---
title: ColBERT Retrieval
slug: /extensions/colbert-retrieval
description: 'Late-interaction (ColBERT) multi-vector text embeddings with MaxSim scoring for accurate on-device semantic search and RAG retrieval.'
keywords:
  [
    react native,
    colbert,
    late interaction,
    multi-vector,
    maxsim,
    semantic search,
    rag,
    retrieval,
    lfm2.5,
    mobile ml,
    on-device ai,
  ]
---

# ColBERT Retrieval

A [Text Embeddings](./03-text-embeddings.md) model pools a whole text into one vector. A ColBERT model instead keeps **one vector per token** and scores a query against a document with **MaxSim**: for every query token, the similarity of the closest document token, summed over the query. Matching at the token level makes it more accurate on retrieval than a single pooled vector, at the cost of a larger index (one 128-dimensional vector per document token).

## Quick Start

The [`useColbertEmbedder`](../../06-api-reference/functions/useColbertEmbedder.md) hook manages model downloading, tokenizer loading, and lifecycle. Embed every document once with `'document'`, embed each search with `'query'`, and rank with [`maxSim`](../../06-api-reference/functions/maxSim.md):

```tsx
import { maxSim, models, useColbertEmbedder, type TokenEmbeddings } from 'react-native-executorch';

function Search({ documents }: { documents: string[] }) {
  const colbert = useColbertEmbedder(models.colbertEmbeddings.LFM2_5_COLBERT_350M.DEFAULT);

  const search = async (query: string) => {
    if (!colbert.embed) return;

    // Index once and keep the result, e.g. in state or a database.
    const index: TokenEmbeddings[] = [];
    for (const doc of documents) index.push(await colbert.embed(doc, 'document'));

    const q = await colbert.embed(query, 'query');
    return documents
      .map((text, i) => ({ text, score: maxSim(q, index[i]!) }))
      .sort((a, b) => b.score - a.score);
  };

  // ...
}
```

## Output Format

[`embed()`](../../06-api-reference/type-aliases/ColbertEmbedder.md#embed) returns a [`TokenEmbeddings`](../../06-api-reference/type-aliases/TokenEmbeddings.md) object: a row-major `[numTokens, dimension]` matrix of L2-normalized vectors in a single `Float32Array`.

- A **query** always yields exactly 32 vectors. Shorter queries are padded with expansion tokens whose vectors take part in scoring (ColBERT's query augmentation).
- A **document** yields one vector per token, up to 512 tokens, with punctuation vectors dropped.

MaxSim scores are not bounded to `[0, 1]`: each query vector contributes a cosine similarity, so the score grows with the query length. Compare scores against the same query, not across queries.

## Imperative API

For batch indexing or manual lifecycle management, use [`createColbertEmbedder`](../../06-api-reference/functions/createColbertEmbedder.md):

```typescript
import { createColbertEmbedder, download, maxSim, models } from 'react-native-executorch';

const model = await download(models.colbertEmbeddings.LFM2_5_COLBERT_350M.DEFAULT);
const colbert = await createColbertEmbedder(model);

try {
  const doc = await colbert.embed('Canberra is the capital of Australia.', 'document');
  const query = await colbert.embed('What is the capital of Australia?', 'query');
  console.log('Relevance:', maxSim(query, doc));
} finally {
  colbert.dispose();
}
```

A synchronous [`embedWorklet`](../../06-api-reference/type-aliases/ColbertEmbedder.md#embedworklet) is available for worklet runtimes, see [Worklets & Threading](../../03-core-and-advanced/06-worklets-and-threading.md).

## Available Models

| Model Family                    | Variants                                                                               | Vector Dim | Languages | Size Range      | Supported Backends         |
| :------------------------------ | :------------------------------------------------------------------------------------- | :--------- | :-------- | :-------------- | :------------------------- |
| **Liquid LFM 2.5 ColBERT 350M** | [See](../../06-api-reference/variables/models.md#colbertembeddingslfm2_5_colbert_350m) | 128        | 11        | 188 MB – 373 MB | XNNPACK (CPU), MLX (Apple) |

:::tip Using Custom Models
Any ColBERT model exported with a `[1, S]` token-id and attention-mask input and a `[1, S, D]` per-token output can be used, as long as its inputs are `[BOS, prefix, ...tokens]` with no trailing special token. Pass its PyLate settings (`config_sentence_transformers.json`) as [`ColbertEmbedderOptions`](../../06-api-reference/type-aliases/ColbertEmbedderOptions.md):

```typescript
const colbert = await createColbertEmbedder({
  modelPath: 'https://example.com/my-colbert.pte',
  tokenizerPath: 'https://example.com/tokenizer.json',
  modelOpts: {
    queryPrefixToken: '[Q] ',
    documentPrefixToken: '[D] ',
    queryLength: 32,
    queryExpansionToken: '<pad>',
    bosToken: '<s>',
    skiplistTokens: ['.', ',', '!', '?'],
  },
});
```

:::

## API Reference

- [`useColbertEmbedder()`](../../06-api-reference/functions/useColbertEmbedder.md) — React hook for ColBERT model downloading, state, and lifecycle.
- [`createColbertEmbedder()`](../../06-api-reference/functions/createColbertEmbedder.md) — Imperative factory for ColBERT pipelines.
- [`maxSim()`](../../06-api-reference/functions/maxSim.md) — Late-interaction relevance score of a document to a query.
- [`ColbertEmbedder`](../../06-api-reference/type-aliases/ColbertEmbedder.md), [`ColbertEmbedderModel`](../../06-api-reference/type-aliases/ColbertEmbedderModel.md), [`TokenEmbeddings`](../../06-api-reference/type-aliases/TokenEmbeddings.md) — Types.
- [`models.colbertEmbeddings`](../../06-api-reference/variables/models.md#colbertembeddings) — Pre-configured ColBERT models.

:::info Source Code
View the implementation on GitHub:

- [`src/extensions/nlp/tasks/colbertEmbedding.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/extensions/nlp/tasks/colbertEmbedding.ts)
  :::
