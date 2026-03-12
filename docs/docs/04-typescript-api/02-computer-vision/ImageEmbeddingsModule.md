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
const imageEmbeddingsModule = await ImageEmbeddingsModule.fromModelName(
  CLIP_VIT_BASE_PATCH32_IMAGE
);

// Running the model
const embedding = await imageEmbeddingsModule.forward(
  'https://url-to-image.jpg'
);
```

### Methods

All methods of `ImageEmbeddingsModule` are explained in details here: [`ImageEmbeddingsModule` API Reference](../../06-api-reference/classes/ImageEmbeddingsModule.md)

## Loading the model

To create a ready-to-use instance, call the static [`fromModelName`](../../06-api-reference/classes/ImageEmbeddingsModule.md#frommodelname) factory with the following parameters:

- `namedSources` - Object containing:
  - `modelName` - Model name identifier.
  - `modelSource` - Location of the model binary.

- `onDownloadProgress` - Optional callback to track download progress (value between 0 and 1).

The factory returns a promise that resolves to a loaded `ImageEmbeddingsModule` instance.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

[`forward`](../../06-api-reference/classes/ImageEmbeddingsModule.md#forward) accepts one argument — the image to embed. The image can be a remote URL, a local file URI, a base64-encoded image (whole URI or only raw base64), or a [`PixelData`](../../06-api-reference/interfaces/PixelData.md) object (raw RGB pixel buffer). The method returns a promise resolving to a `Float32Array` representing the embedding.

For real-time frame processing, use [`runOnFrame`](../../03-hooks/02-computer-vision/visioncamera-integration.md) instead.
