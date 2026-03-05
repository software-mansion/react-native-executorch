---
title: ImageEmbeddingsModule
---

TypeScript API implementation of the [useImageEmbeddings](../../03-hooks/02-computer-vision/useImageEmbeddings.md) hook.

## API Reference

- For detailed API Reference for `ImageEmbeddingsModule` see: [`ImageEmbeddingsModule` API Reference](../../06-api-reference/classes/ImageEmbeddingsModule.md).
- For all image embeddings models available out-of-the-box in React Native ExecuTorch see: [Image Embeddings Models](../../06-api-reference/index.md#models---image-embeddings).

## High Level Overview

```typescript
import {
  ImageEmbeddingsModule,
  CLIP_VIT_BASE_PATCH32_IMAGE,
} from 'react-native-executorch';

// Creating and loading the module
const imageEmbeddingsModule = await ImageEmbeddingsModule.fromModelName({
  modelSource: CLIP_VIT_BASE_PATCH32_IMAGE,
});

// Running the model
const embedding = await imageEmbeddingsModule.forward(
  'https://url-to-image.jpg'
);
```

### Methods

All methods of `ImageEmbeddingsModule` are explained in details here: [`ImageEmbeddingsModule` API Reference](../../06-api-reference/classes/ImageEmbeddingsModule.md)

## Loading the model

To create a ready-to-use instance, call the static [`fromModelName`](../../06-api-reference/classes/ImageEmbeddingsModule.md#frommodelname) factory with the following parameters:

- `model` - Object containing:
  - `modelSource` - Location of the model binary.

- `onDownloadProgress` - Optional callback to track download progress (value between 0 and 1).

The factory returns a promise that resolves to a loaded `ImageEmbeddingsModule` instance.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

[`forward`](../../06-api-reference/classes/ImageEmbeddingsModule.md#forward) accepts one argument: image. The image can be a remote URL, a local file URI, or a base64-encoded image (whole URI or only raw base64). The function returns a promise, which can resolve either to an error or an array of numbers representing the embedding.
