# ColBERT Retrieval

A [Text Embeddings](https://docs.swmansion.com/react-native-executorch/docs/extensions/text-embeddings.md) model pools a whole text into one vector. A ColBERT model instead keeps **one vector per token** and scores a query against a document with **MaxSim**: for every query token, the similarity of the closest document token, summed over the query. Matching at the token level makes it more accurate on retrieval than a single pooled vector, at the cost of a larger index (one 128-dimensional vector per document token).

## Quick Start[​](#quick-start "Direct link to Quick Start")

The [`useColbertEmbedder`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useColbertEmbedder) hook manages model downloading, tokenizer loading, and lifecycle. Embed every document once with `'document'`, embed each search with `'query'`, and rank with [`maxSim()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ColbertEmbedder#maxsim):

```tsx
import { models, useColbertEmbedder, type ColbertTokenEmbeddings } from 'react-native-executorch';

function Search({ documents }: { documents: string[] }) {
  const colbert = useColbertEmbedder(models.colbertEmbeddings.LFM2_5_COLBERT_350M.DEFAULT);

  const search = async (query: string) => {
    const { embed, maxSim } = colbert;
    if (!embed || !maxSim) return;

    // Index once and keep the result, e.g. in state or a database.
    const index: ColbertTokenEmbeddings[] = [];
    for (const doc of documents) index.push(await embed(doc, 'document'));

    const q = await embed(query, 'query');
    return documents
      .map((text, i) => ({ text, score: maxSim(q, index[i]!) }))
      .sort((a, b) => b.score - a.score);
  };

  // ...
}

```

## Output Format[​](#output-format "Direct link to Output Format")

[`embed()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ColbertEmbedder#embed) returns a [`ColbertTokenEmbeddings`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ColbertTokenEmbeddings) object: a row-major `[numTokens, dimension]` matrix of L2-normalized vectors in a single `Float32Array`.

* A **query** always yields exactly 32 vectors. Shorter queries are padded with expansion tokens whose vectors take part in scoring (ColBERT's query augmentation).
* A **document** yields one vector per token, up to 512 tokens, with punctuation vectors dropped.

MaxSim scores are not bounded to `[0, 1]`: each query vector contributes a cosine similarity, so the score grows with the query length. Compare scores against the same query, not across queries.

## Imperative API[​](#imperative-api "Direct link to Imperative API")

For batch indexing or manual lifecycle management, use [`createColbertEmbedder`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createColbertEmbedder):

```typescript
import { createColbertEmbedder, download, models } from 'react-native-executorch';

const model = await download(models.colbertEmbeddings.LFM2_5_COLBERT_350M.DEFAULT);
const colbert = await createColbertEmbedder(model);

try {
  const doc = await colbert.embed('Canberra is the capital of Australia.', 'document');
  const query = await colbert.embed('What is the capital of Australia?', 'query');
  console.log('Relevance:', colbert.maxSim(query, doc));
} finally {
  colbert.dispose();
}

```

A synchronous [`embedWorklet`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ColbertEmbedder#embedworklet) is available for worklet runtimes, see [Worklets & Threading](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/worklets-and-threading.md).

## Available Models[​](#available-models "Direct link to Available Models")

| Model Family                    | Variants                                                                                                                           | Vector Dim | Languages | Size Range      | Supported Backends         |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------- | --------------- | -------------------------- |
| **Liquid LFM 2.5 ColBERT 350M** | [See](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#colbertembeddingslfm2_5_colbert_350m) | 128        | 11        | 188 MB – 373 MB | XNNPACK (CPU), MLX (Apple) |

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Using Custom Models

Any ColBERT model exported with a `[1, S]` token-id and attention-mask input and a `[1, S, D]` per-token output can be used, as long as its inputs are `[BOS, prefix, ...tokens]` with no trailing special token. Pass the settings from its [PyLate](https://github.com/lightonai/pylate) `config_sentence_transformers.json` as [`ColbertEmbedderOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ColbertEmbedderOptions):

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

## API Reference[​](#api-reference "Direct link to API Reference")

* [`useColbertEmbedder()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useColbertEmbedder) — React hook for ColBERT model downloading, state, and lifecycle.
* [`createColbertEmbedder()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createColbertEmbedder) — Imperative factory for ColBERT pipelines.
* [`ColbertEmbedder`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ColbertEmbedder), [`ColbertEmbedderModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ColbertEmbedderModel), [`ColbertTokenEmbeddings`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/ColbertTokenEmbeddings) — Types.
* [`models.colbertEmbeddings`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#colbertembeddings) — Pre-configured ColBERT models.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Source Code

View the implementation on GitHub:

* [`src/extensions/nlp/tasks/colbertEmbedding.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tasks/colbertEmbedding.ts)
