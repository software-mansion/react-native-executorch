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

// Creating an instance
const imageEmbeddingsModule = new ImageEmbeddingsModule();

// Loading the model
await imageEmbeddingsModule.load(CLIP_VIT_BASE_PATCH32_IMAGE);

// Running the model
const embedding = await imageEmbeddingsModule.forward(
  'https://url-to-image.jpg'
);
```

### Methods

All methods of `ImageEmbeddingsModule` are explained in details here: [`ImageEmbeddingsModule` API Reference](../../06-api-reference/classes/ImageEmbeddingsModule.md)

## Loading the model

To initialize the module, create an instance and call the [`load`](../../06-api-reference/classes/ImageEmbeddingsModule.md#load) method with the following parameters:

- [`model`](../../06-api-reference/classes/ImageEmbeddingsModule.md#model) - Object containing:
  - [`modelSource`](../../06-api-reference/classes/ImageEmbeddingsModule.md#modelsource) - Location of the used model.

- [`onDownloadProgressCallback`](../../06-api-reference/classes/ImageEmbeddingsModule.md#ondownloadprogresscallback) - Callback to track download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

[`forward`](../../06-api-reference/classes/ImageEmbeddingsModule.md#forward) accepts one argument, which is a URI/URL to an image you want to encode. The function returns a promise, which can resolve either to an error or an array of numbers representing the embedding.
