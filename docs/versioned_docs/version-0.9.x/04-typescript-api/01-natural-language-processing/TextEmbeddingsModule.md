---
title: TextEmbeddingsModule
---

TypeScript API implementation of the [useTextEmbeddings](../../03-hooks/01-natural-language-processing/useTextEmbeddings.md) hook.

## API Reference

- For detailed API Reference for `TextEmbeddingsModule` see: [`TextEmbeddingsModule` API Reference](../../06-api-reference/classes/TextEmbeddingsModule.md).
- For all text embeddings models available out-of-the-box in React Native ExecuTorch see: [Text Embeddings Models](../../06-api-reference/index.md#models---text-embeddings).

## High Level Overview

```typescript
import { models, TextEmbeddingsModule } from 'react-native-executorch';
// Creating an instance and loading the model
const textEmbeddingsModule = await TextEmbeddingsModule.fromModelName(
  models.text_embedding.all_minilm_l6_v2()
);

// Running the model
const embedding = await textEmbeddingsModule.forward('Hello World!');
```

### Methods

All methods of `TextEmbeddingsModule` are explained in details here: [`TextEmbeddingsModule` API Reference](../../06-api-reference/classes/TextEmbeddingsModule.md)

## Loading the model

Use the static [`fromModelName`](../../06-api-reference/classes/TextEmbeddingsModule.md#frommodelname) factory method. It accepts a model config object (e.g. `ALL_MINILM_L6_V2`) containing:

- `modelName` - Unique name identifying the model.
- `modelSource` - Location of the used model.
- `tokenizerSource` - Location of the used tokenizer.
- `prompts` _(optional)_ - Asymmetric `query`/`document` prompts the model is trained with. When present, `forward` requires a `role` and prepends the matching prompt.
- `multiVector` _(optional)_ - When `true`, `forward` returns the per-token `EmbeddingResult` instead of a single pooled `Float32Array`.
- `skipListIds` _(optional)_ - Token ids to exclude from late-interaction (MaxSim) scoring.

And an optional `onDownloadProgress` callback (receiving a value between 0 and 1). It returns a promise resolving to a `TextEmbeddingsModule` instance.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

To run the model, use the [`forward`](../../06-api-reference/classes/TextEmbeddingsModule.md#forward) method. It accepts the text to embed and, for models with asymmetric prompts, an optional `role` (`'query' | 'document'`). The method returns a promise resolving to:

- a `Float32Array` — a single pooled vector — for standard models, or
- an [`EmbeddingResult`](../../06-api-reference/interfaces/EmbeddingResult.md) with the per-token vectors for `multiVector` models.
