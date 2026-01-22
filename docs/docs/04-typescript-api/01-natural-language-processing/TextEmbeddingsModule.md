---
title: TextEmbeddingsModule
---

TypeScript API implementation of the [useTextEmbeddings](../../03-hooks/01-natural-language-processing/useTextEmbeddings.md) hook.

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

| Method               | Type                                                                                                                                                | Description                                                                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `load`               | `(model: { modelSource: ResourceSource; tokenizerSource: ResourceSource }, onDownloadProgressCallback?: (progress: number) => void): Promise<void>` | Loads the model, where `modelSource` is a string that specifies the location of the model binary, `tokenizerSource` is a string that specifies the location of the tokenizer JSON file. |
| `forward`            | `(input: string): Promise<number[]>`                                                                                                                | Executes the model's forward pass, where `input` is a text that will be embedded.                                                                                                       |
| `onDownloadProgress` | `(callback: (downloadProgress: number) => void): any`                                                                                               | Subscribe to the download progress event.                                                                                                                                               |

<details>
<summary>Type definitions</summary>

```typescript
type ResourceSource = string | number | object;
```

</details>

## Loading the model

To load the model, use the `load` method. It accepts an object:

**`model`** - Object containing the model source and tokenizer source.

- **`modelSource`** - A string that specifies the location of the model binary.
- **`tokenizerSource`** - A string that specifies the location of the tokenizer JSON file.

**`onDownloadProgressCallback`** - (Optional) Function called on download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

To run the model, you can use the `forward` method. It accepts one argument, which is the text you want to embed. The method returns a promise, which can resolve either to an error or an array of numbers representing the embedding.
