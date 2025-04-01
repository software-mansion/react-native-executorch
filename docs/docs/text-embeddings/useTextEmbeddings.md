---
title: useTextEmbeddings
sidebar_position: 1
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

:::caution
It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/software-mansion/react-native-executorch-all-MiniLM-L6-v2). You can also use [constants](https://github.com/software-mansion/react-native-executorch/tree/main/src/constants/modelUrls.ts) shipped with our library.
:::

## Reference

```typescript
import {
  useTextEmbeddings,
  ALL_MINILM_L6_V2,
  ALL_MINILM_L6_V2_TOKENIZER,
} from 'react-native-executorch';

const model = useTextEmbeddings({
  modelSource: ALL_MINILM_L6_V2,
  tokenizerSource: ALL_MINILM_L6_V2_TOKENIZER,
});

try {
  const embedding = await model.forward('Hello World!');
} catch (error) {
  console.error(error);
}
```

### Arguments

**`modelSource`**
A string that specifies the location of the model binary. For more information, take a look at [loading models](../fundamentals/loading-models.md) page.

**`tokenizerSource`**
A string that specifies the location of the tokenizer JSON file.

### Returns

| Field              | Type                                   | Description                                                                       |
| ------------------ | -------------------------------------- | --------------------------------------------------------------------------------- |
| `forward`          | `(input: string) => Promise<number[]>` | Executes the model's forward pass, where `input` is a text that will be embedded. |
| `error`            | <code>string &#124; null</code>        | Contains the error message if the model failed to load.                           |
| `isGenerating`     | `boolean`                              | Indicates whether the model is currently processing an inference.                 |
| `isReady`          | `boolean`                              | Indicates whether the model has successfully loaded and is ready for inference.   |
| `downloadProgress` | `number`                               | Represents the download progress as a value between 0 and 1.                      |

## Running the model

To run the model, you can use the `forward` method. It accepts one argument, which is a string representing the text you want to embed. The function returns a promise, which can resolve either to an error or an array of numbers representing the embedding.

:::info
The returned embedding vector is normalized, meaning that its length is equal to 1. This allows for easier comparison of vectors using cosine similarity, just calculate the dot product of two vectors to get the cosine similarity score.
:::

## Example

```typescript
import {
  useTextEmbeddings,
  ALL_MINILM_L6_V2,
  ALL_MINILM_L6_V2_TOKENIZER,
} from 'react-native-executorch';

const dotProduct = (a: number[], b: number[]) =>
  a.reduce((sum, val, i) => sum + val * b[i], 0);

function App() {
  const model = useTextEmbeddings({
    modelSource: ALL_MINILM_L6_V2,
    tokenizerSource: ALL_MINILM_L6_V2_TOKENIZER,
  });

  ...

  try {
    const helloWorldEmbedding = await model.forward('Hello World!');
    const goodMorningEmbedding = await model.forward('Good Morning!');

    // The embeddings are normalized, so we can use dot product to calculate cosine similarity
    const similarity = dotProduct(
      helloWorldEmbedding,
      goodMorningEmbedding
    );

    console.log(`Cosine similarity: ${similarity}`);
  } catch (error) {
    console.error(error);
  }

  ...
}
```

## Supported models

| Model                                                                             | Language | Max Tokens | Embedding Dimensions |
| --------------------------------------------------------------------------------- | :------: | :--------: | :------------------: |
| [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) | English  |    256     |         384          |

**`Max Tokens`** - the maximum number of tokens that can be processed by the model. If the input text exceeds this limit, it will be truncated.

**`Embedding Dimensions`** - the size of the output embedding vector. This is the number of dimensions in the vector representation of the input text.

## Benchmarks

### Model size

| Model            | XNNPACK [MB] |
| ---------------- | :----------: |
| ALL_MINILM_L6_V2 |      91      |

### Memory usage

| Model            | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| ---------------- | :--------------------: | :----------------: |
| ALL_MINILM_L6_V2 |          140           |         64         |

### Inference time

:::warning warning
Times presented in the tables are measured as consecutive runs of the model. Initial run times may be up to 2x longer due to model loading and initialization.
:::

| Model            | iPhone 16 Pro (XNNPACK) [ms] | iPhone 14 Pro Max (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) | OnePlus 12 (XNNPACK) [ms] |
| ---------------- | :--------------------------: | :------------------------------: | :------------------------: | :--------------------------: | :-----------------------: |
| ALL_MINILM_L6_V2 |             105              |               126                |            151             |             165              |            152            |
