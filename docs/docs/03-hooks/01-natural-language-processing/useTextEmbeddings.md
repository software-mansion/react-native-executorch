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

:::warning
It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/text-embeddings-68d0ed42f8ca0200d0283362). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

## API Reference

* For detailed API Reference for `useTextEmbeddings` see: [`useTextEmbeddings` API Reference](../../06-api-reference/functions/useTextEmbeddings.md).
* For all text embeddings models available out-of-the-box in React Native ExecuTorch see: [Text Embeddings Models](../../06-api-reference/index.md#models---text-embeddings).

## Reference

```typescript
import { useTextEmbeddings, ALL_MINILM_L6_V2 } from 'react-native-executorch';

const model = useTextEmbeddings({ model: ALL_MINILM_L6_V2 });

try {
  const embedding = await model.forward('Hello World!');
} catch (error) {
  console.error(error);
}
```

### Arguments

`useTextEmbeddings` takes [`TextEmbeddingsProps`](../../06-api-reference/interfaces/TextEmbeddingsProps.md) that consists of:
* `model` of type `object` containing the [model source](../../06-api-reference/interfaces/TextEmbeddingsProps.md#modelsource) and [tokenizer source](../../06-api-reference/interfaces/TextEmbeddingsProps.md#tokenizersource). 
* An optional flag [`preventLoad`](../../06-api-reference/interfaces/TextEmbeddingsProps.md#preventload) which prevents auto-loading of the model.

You need more details? Check the following resources:
* For detailed information about `useTextEmbeddings` arguments check this section: [`useTextEmbeddings` arguments](../../06-api-reference/functions/useTextEmbeddings.md#parameters).
* For all text embeddings models available out-of-the-box in React Native ExecuTorch see: [Text Embeddings Models](../../06-api-reference/index.md#models---text-embeddings).
* For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

`useTextEmbeddings` returns an object called `TextEmbeddingsType` containing bunch of functions to interact with text embedding. To get more details please read: [`TextEmbeddingsType` API Reference](../../06-api-reference/interfaces/TextEmbeddingsType.md).

## Running the model

To run the model, you can use the `forward` method. It accepts one argument, which is a string representing the text you want to embed. The function returns a promise, which can resolve either to an error or an array of numbers representing the embedding.

## Example

```typescript
import { useTextEmbeddings, ALL_MINILM_L6_V2 } from 'react-native-executorch';

const dotProduct = (a: number[], b: number[]) =>
  a.reduce((sum, val, i) => sum + val * b[i], 0);

const cosineSimilarity = (a: number[], b: number[]) => {
  const dot = dotProduct(a, b);
  const normA = Math.sqrt(dotProduct(a, a));
  const normB = Math.sqrt(dotProduct(b, b));
  return dot / (normA * normB);
};

function App() {
  const model = useTextEmbeddings({ model: ALL_MINILM_L6_V2 });

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

| Model                                                                                                 | Language | Max Tokens | Embedding Dimensions | Description                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------- | :------: | :--------: | :------------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)                     | English  |    254     |         384          | All-round model tuned for many use-cases. Trained on a large and diverse dataset of over 1 billion training pairs.                                                                                                                                                                                                                                                                                                               |
| [all-mpnet-base-v2](https://huggingface.co/sentence-transformers/all-mpnet-base-v2)                   | English  |    382     |         768          | All-round model tuned for many use-cases. Trained on a large and diverse dataset of over 1 billion training pairs.                                                                                                                                                                                                                                                                                                               |
| [multi-qa-MiniLM-L6-cos-v1](https://huggingface.co/sentence-transformers/multi-qa-MiniLM-L6-cos-v1)   | English  |    509     |         384          | This model was tuned for semantic search: Given a query/question, it can find relevant passages. It was trained on a large and diverse set of (question, answer) pairs.                                                                                                                                                                                                                                                          |
| [multi-qa-mpnet-base-dot-v1](https://huggingface.co/sentence-transformers/multi-qa-mpnet-base-dot-v1) | English  |    510     |         768          | This model was tuned for semantic search: Given a query/question, it can find relevant passages. It was trained on a large and diverse set of (question, answer) pairs.                                                                                                                                                                                                                                                          |
| [clip-vit-base-patch32-text](https://huggingface.co/openai/clip-vit-base-patch32)                     | English  |     74     |         512          | CLIP (Contrastive Language-Image Pre-Training) is a neural network trained on a variety of (image, text) pairs. CLIP allows to embed images and text into the same vector space. This allows to find similar images as well as to implement image search. This is the text encoder part of the CLIP model. To embed images checkout [clip-vit-base-patch32-image](../02-computer-vision/useImageEmbeddings.md#supported-models). |

**`Max Tokens`** - the maximum number of tokens that can be processed by the model. If the input text exceeds this limit, it will be truncated.

**`Embedding Dimensions`** - the size of the output embedding vector. This is the number of dimensions in the vector representation of the input text.

:::info
For the supported models, the returned embedding vector is normalized, meaning that its length is equal to 1. This allows for easier comparison of vectors using cosine similarity, just calculate the dot product of two vectors to get the cosine similarity score.
:::
