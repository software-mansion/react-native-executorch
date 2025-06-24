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

:::caution
It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/software-mansion/react-native-executorch-clip-vit-base-patch32-image-encoder). You can also use [constants](https://github.com/software-mansion/react-native-executorch/tree/main/src/constants/modelUrls.ts) shipped with our library.
:::

## Reference

```typescript
import {
  useImageEmbeddings,
  CLIP_VIT_BASE_PATCH_32_IMAGE_ENCODER_MODEL,
} from 'react-native-executorch';

const model = useImageEmbeddings({
  modelSource: CLIP_VIT_BASE_PATCH_32_IMAGE_ENCODER_MODEL,
});

try {
  const imageEmbedding = await model.forward('https://url-to-image.jpg');
} catch (error) {
  console.error(error);
}
```

### Arguments

**`modelSource`**
A string that specifies the location of the model binary. For more information, take a look at [loading models](../fundamentals/loading-models.md) page.

**`preventLoad?`** - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.

### Returns

| Field              | Type                                        | Description                                                                                   |
| ------------------ | ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `forward`          | `(input: imageSource) => Promise<number[]>` | Executes the model's forward pass, where `input` is a URI/URL to image that will be embedded. |
| `error`            | <code>string &#124; null</code>             | Contains the error message if the model failed to load.                                       |
| `isGenerating`     | `boolean`                                   | Indicates whether the model is currently processing an inference.                             |
| `isReady`          | `boolean`                                   | Indicates whether the model has successfully loaded and is ready for inference.               |
| `downloadProgress` | `number`                                    | Represents the download progress as a value between 0 and 1.                                  |

## Running the model

To run the model, you can use the `forward` method. It accepts one argument, which is a URI/URL to an image you want to encode. The function returns a promise, which can resolve either to an error or an array of numbers representing the embedding.

:::info
The returned embedding vector is normalized, meaning that its length is equal to 1. This allows for easier comparison of vectors using cosine similarity, just calculate the dot product of two vectors to get the cosine similarity score.
:::

## Example

```typescript
const dotProduct = (a: number[], b: number[]) =>
  a.reduce((sum, val, i) => sum + val * b[i], 0);

try {
  // we assume you've provided catImage and dogImage
  const catImageEmbedding = await model.forward(catImage);
  const dogImageEmbedding = await model.forward(dogImage);

  // The embeddings are normalized, so we can use dot product to calculate cosine similarity
  const similarity = dotProduct(catImageEmbedding, dogImageEmbedding);

  console.log(`Cosine similarity: ${similarity}`);
} catch (error) {
  console.error(error);
}
```

## Supported models

| Model                                                                                      | Language | Image size | Embedding Dimensions | Description                                                    |
| ------------------------------------------------------------------------------------------ | :------: | :--------: | :------------------: | -------------------------------------------------------------- |
| [clip-vit-base-patch32-image-encoder](https://huggingface.co/openai/clip-vit-base-patch32) | English  | 224 x 224  |         512          | Trained using contrastive learning for image search use cases. |

**`Image size`** - the size of an image that a models takes as an input. Resize will happen automatically.

**`Embedding Dimensions`** - the size of the output embedding vector. This is the number of dimensions in the vector representation of the input image.

## Benchmarks

### Model size

| Model                  | XNNPACK [MB] |
| ---------------------- | :----------: |
| CLIP_VIT_BASE_PATCH_32 |     352      |

### Memory usage

| Model                  | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| ---------------------- | :--------------------: | :----------------: |
| CLIP_VIT_BASE_PATCH_32 |          324           |        347         |

### Inference time

:::warning warning
Times presented in the tables are measured as consecutive runs of the model. Initial run times may be up to 2x longer due to model loading and initialization.
:::

| Model                  | iPhone 16 Pro (XNNPACK) [ms] | iPhone 14 Pro Max (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ---------------------- | :--------------------------: | :------------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| CLIP_VIT_BASE_PATCH_32 |             TODO             |               TODO               |            TODO            |                265                |           TODO            |
