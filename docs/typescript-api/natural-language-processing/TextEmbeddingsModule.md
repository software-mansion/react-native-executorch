# TextEmbeddingsModule

TypeScript API implementation of the [useTextEmbeddings](https://docs.swmansion.com/react-native-executorch/docs/hooks/natural-language-processing/useTextEmbeddings.md) hook.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `TextEmbeddingsModule` see: [`TextEmbeddingsModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextEmbeddingsModule).
* For all text embeddings models available out-of-the-box in React Native ExecuTorch see: [Text Embeddings Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---text-embeddings).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

```typescript
import {
  TextEmbeddingsModule,
  ALL_MINILM_L6_V2,
} from 'react-native-executorch';

// Creating an instance
const textEmbeddingsModule = new TextEmbeddingsModule();

// Loading the model
await textEmbeddingsModule.load(ALL_MINILM_L6_V2);

// Running the model
const embedding = await textEmbeddingsModule.forward('Hello World!');

```

### Methods[​](#methods "Direct link to Methods")

All methods of `TextEmbeddingsModule` are explained in details here: [`TextEmbeddingsModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextEmbeddingsModule)

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

To load the model, use the [`load`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextEmbeddingsModule#load) method. It accepts an object:

* [`model`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextEmbeddingsModule#model) - Object containing:

  * [`modelSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextEmbeddingsModule#modelsource) - Location of the used model.
  * [`tokenizerSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextEmbeddingsModule#tokenizersource) - Location of the used tokenizer.

* [`onDownloadProgressCallback`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextEmbeddingsModule#ondownloadprogresscallback) - Callback to track download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, you can use the [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextEmbeddingsModule#forward) method. It accepts one argument, which is the text you want to embed. The method returns a promise, which can resolve either to an error or an array of numbers representing the embedding.
