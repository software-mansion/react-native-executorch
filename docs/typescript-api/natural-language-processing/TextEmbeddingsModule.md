# TextEmbeddingsModule

TypeScript API implementation of the [useTextEmbeddings](https://docs.swmansion.com/react-native-executorch/docs/hooks/natural-language-processing/useTextEmbeddings.md) hook.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `TextEmbeddingsModule` see: [`TextEmbeddingsModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextEmbeddingsModule).
* For all text embeddings models available out-of-the-box in React Native ExecuTorch see: [Text Embeddings Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---text-embeddings).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

```typescript
import { models, TextEmbeddingsModule } from 'react-native-executorch';
// Creating an instance and loading the model
const textEmbeddingsModule = await TextEmbeddingsModule.fromModelName(
  models.text_embedding.all_minilm_l6_v2()
);

// Running the model
const embedding = await textEmbeddingsModule.forward('Hello World!');

```

### Methods[​](#methods "Direct link to Methods")

All methods of `TextEmbeddingsModule` are explained in details here: [`TextEmbeddingsModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextEmbeddingsModule)

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

Use the static [`fromModelName`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextEmbeddingsModule#frommodelname) factory method. It accepts a model config object (e.g. `ALL_MINILM_L6_V2`) containing:

* `modelName` - Unique name identifying the model.
* `modelSource` - Location of the used model.
* `tokenizerSource` - Location of the used tokenizer.
* `prompts` *(optional)* - Asymmetric `query`/`document` prompts the model is trained with. When present, `forward` requires a `role` and prepends the matching prompt.
* `multiVector` *(optional)* - When `true`, `forward` returns the per-token `EmbeddingResult` instead of a single pooled `Float32Array`.
* `skipListIds` *(optional)* - Token ids to exclude from late-interaction (MaxSim) scoring.

And an optional `onDownloadProgress` callback (receiving a value between 0 and 1). It returns a promise resolving to a `TextEmbeddingsModule` instance.

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, use the [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextEmbeddingsModule#forward) method. It accepts the text to embed and, for models with asymmetric prompts, an optional `role` (`'query' | 'document'`). The method returns a promise resolving to:

* a `Float32Array` — a single pooled vector — for standard models, or
* an [`EmbeddingResult`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/EmbeddingResult) with the per-token vectors for `multiVector` models.
