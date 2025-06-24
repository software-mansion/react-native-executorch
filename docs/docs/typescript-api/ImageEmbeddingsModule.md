---
title: ImageEmbeddingsModule
---

TypeScript API implementation of the [useImageEmbeddings](../computer-vision/useImageEmbeddings.md) hook.

## Reference

```typescript
import {
  ImageEmbeddingsModule,
  CLIP_VIT_BASE_PATCH_32_IMAGE_ENCODER,
} from 'react-native-executorch';

// Loading the model
await ImageEmbeddingsModule.load(CLIP_VIT_BASE_PATCH_32_IMAGE_ENCODER);

// Running the model
const embedding = await ImageEmbeddingsModule.forward(
  'https://url-to-image.jpg'
);
```

### Methods

| Method               | Type                                                  | Description                                                                                       |
| -------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `load`               | `(modelSource: ResourceSource): Promise<void>`        | Loads the model, where `modelSource` is a string that specifies the location of the model binary. |
| `forward`            | `(input: string): Promise<number[]>`                  | Executes the model's forward pass, where `input` is a URI/URL to image that will be embedded.     |
| `onDownloadProgress` | `(callback: (downloadProgress: number) => void): any` | Subscribe to the download progress event.                                                         |

<details>
<summary>Type definitions</summary>

```typescript
type ResourceSource = string | number | object;
```

</details>

## Loading the model

To load the model, use the `load` method. It accepts the `modelSource` which is a string that specifies the location of the model binary. For more information, take a look at [loading models](../fundamentals/loading-models.md) page. This method returns a promise, which can resolve to an error or void.

## Running the model

It accepts one argument, which is a URI/URL to an image you want to encode. The function returns a promise, which can resolve either to an error or an array of numbers representing the embedding.

:::info
The returned embedding vector is normalized, meaning that its length is equal to 1. This allows for easier comparison of vectors using cosine similarity, just calculate the dot product of two vectors to get the cosine similarity score.
:::
