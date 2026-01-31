---
title: TextEmbeddingsModule
---

TypeScript API implementation of the [useTextEmbeddings](../../03-hooks/01-natural-language-processing/useTextEmbeddings.md) hook.

## API Reference

* For detailed API Reference for `TextEmbeddingsModule` see: [`TextEmbeddingsModule` API Reference](../../06-api-reference/classes/TextEmbeddingsModule.md).
* For all text embeddings models available out-of-the-box in React Native ExecuTorch see: [Text Embeddings Models](../../06-api-reference/index.md#models---text-embeddings).

## Reference

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

### Methods

All methods of `TextEmbeddingsModule` are explained in details here: [`TextEmbeddingsModule` API Reference](../../06-api-reference/classes/TextEmbeddingsModule.md)

## Loading the model

To load the model, use the [`load`](../../06-api-reference/classes/TextEmbeddingsModule.md#load) method. It accepts an object:

* [`model`](../../06-api-reference/classes/TextEmbeddingsModule.md#model) - Object containing:

    * [`modelSource`](../../06-api-reference/classes/TextEmbeddingsModule.md#modelsource) - Location of the used model. 
    * [`tokenizerSource`](../../06-api-reference/classes/TextEmbeddingsModule.md#tokenizersource) - Location of the used tokenizer.

* [`onDownloadProgressCallback`](../../06-api-reference/classes/TextEmbeddingsModule.md#ondownloadprogresscallback) - Callback to track download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

To run the model, you can use the [`forward`](../../06-api-reference/classes/TextEmbeddingsModule.md#forward) method. It accepts one argument, which is the text you want to embed. The method returns a promise, which can resolve either to an error or an array of numbers representing the embedding.
