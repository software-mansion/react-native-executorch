---
title: useImageEmbeddings
keywords:
  [
    image embedding,
    image embeddings,
    embeddings,
    react native,
    executorch,
    ai,
    machine learning,
    on-device,
    mobile ai,
    clip,
  ]
description: "Learn how to use image embeddings models in your React Native applications with React Native ExecuTorch's useImageEmbeddings hook."
---

Image Embedding is the process of converting an image into a numerical representation. This representation can be used for tasks, such as classification, clustering and (using contrastive learning like e.g. CLIP model) image search.

:::warning
It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/image-embeddings-68d0eda599a9d37caaaf1ad0). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

## API Reference

* For detailed API Reference for `useImageEmbeddings` see: [`useImageEmbeddings` API Reference](../../06-api-reference/functions/useImageEmbeddings.md).
* For all image embeddings models available out-of-the-box in React Native ExecuTorch see: [Image Embeddings Models](../../06-api-reference/index.md#models---image-embeddings).

## Reference

```typescript
import {
  useImageEmbeddings,
  CLIP_VIT_BASE_PATCH32_IMAGE,
} from 'react-native-executorch';

const model = useImageEmbeddings({ model: CLIP_VIT_BASE_PATCH32_IMAGE });

try {
  const imageEmbedding = await model.forward('https://url-to-image.jpg');
} catch (error) {
  console.error(error);
}
```

### Arguments

`useImageEmbeddings` takes [`ImageEmbeddingsProps`](../../06-api-reference/interfaces/ImageEmbeddingsProps.md) that consists of:
* `model` containing [`modelSource`](../../06-api-reference/interfaces/ImageEmbeddingsProps.md#modelsource). 
* An optional flag [`preventLoad`](../../06-api-reference/interfaces/ImageEmbeddingsProps.md#preventload) which prevents auto-loading of the model.

You need more details? Check the following resources:
* For detailed information about `useImageEmbeddings` arguments check this section: [`useImageEmbeddings` arguments](../../06-api-reference/functions/useImageEmbeddings.md#parameters).
* For all image embeddings models available out-of-the-box in React Native ExecuTorch see: [Image Embeddings Models](../../06-api-reference/index.md#models---image-embeddings).
* For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

`useImageEmbeddings` returns an object called `ImageEmbeddingsType` containing bunch of functions to interact with image embeddings models. To get more details please read: [`ImageEmbeddingsType` API Reference](../../06-api-reference/interfaces/ImageEmbeddingsType.md).

## Running the model

To run the model, you can use the [`forward`](../../06-api-reference/interfaces/ImageEmbeddingsType.md#forward) method. It accepts one argument which is a URI/URL to an image you want to encode. The function returns a promise, which can resolve either to an error or an array of numbers representing the embedding.

## Example

```typescript
const dotProduct = (a: Float32Array, b: Float32Array) =>
  a.reduce((sum, val, i) => sum + val * b[i], 0);

const cosineSimilarity = (a: Float32Array, b: Float32Array) => {
  const dot = dotProduct(a, b);
  const normA = Math.sqrt(dotProduct(a, a));
  const normB = Math.sqrt(dotProduct(b, b));
  return dot / (normA * normB);
};

try {
  // we assume you've provided catImage and dogImage
  const catImageEmbedding = await model.forward(catImage);
  const dogImageEmbedding = await model.forward(dogImage);

  const similarity = cosineSimilarity(catImageEmbedding, dogImageEmbedding);

  console.log(`Cosine similarity: ${similarity}`);
} catch (error) {
  console.error(error);
}
```

## Supported models

| Model                                                                              | Language | Image size | Embedding dimensions | Description                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------------- | :------: | :--------: | :------------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [clip-vit-base-patch32-image](https://huggingface.co/collections/software-mansion/image-embeddings) | English  |  224×224   |         512          | CLIP (Contrastive Language-Image Pre-Training) is a neural network trained on a variety of (image, text) pairs. CLIP allows to embed images and text into the same vector space. This allows to find similar images as well as to implement image search. This is the image encoder part of the CLIP model. To embed text checkout [clip-vit-base-patch32-text](../01-natural-language-processing/useTextEmbeddings.md#supported-models). |

**`Image size`** - The size of an image that the model takes as an input. Resize will happen automatically.

**`Embedding Dimensions`** - The size of the output embedding vector. This is the number of dimensions in the vector representation of the input image.

:::info
For the supported models, the returned embedding vector is normalized, meaning that its length is equal to 1. This allows for easier comparison of vectors using cosine similarity, just calculate the dot product of two vectors to get the cosine similarity score.
:::
