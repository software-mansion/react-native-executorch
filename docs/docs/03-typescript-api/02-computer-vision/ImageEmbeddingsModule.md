---
title: ImageEmbeddingsModule
---

TypeScript API implementation of the [useImageEmbeddings](../../02-hooks/02-computer-vision/useImageEmbeddings.md) hook.

## Reference

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

| Method               | Type                                                                                                               | Description                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `load`               | `(model: { modelSource: ResourceSource }, onDownloadProgressCallback?: (progress: number) => void): Promise<void>` | Loads the model, where `modelSource` is a string that specifies the location of the model binary. |
| `forward`            | `(input: string): Promise<number[]>`                                                                               | Executes the model's forward pass, where `input` is a URI/URL to image that will be embedded.     |
| `onDownloadProgress` | `(callback: (downloadProgress: number) => void): any`                                                              | Subscribe to the download progress event.                                                         |

<details>
<summary>Type definitions</summary>

```typescript
type ResourceSource = string | number | object;
```

</details>

## Loading the model

To load the model, use the `load` method. It accepts an object:

**`model`** - Object containing the model source.

- **`modelSource`** - A string that specifies the location of the model binary.

**`onDownloadProgressCallback`** - (Optional) Function called on download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

It accepts one argument, which is a URI/URL to an image you want to encode. The function returns a promise, which can resolve either to an error or an array of numbers representing the embedding.
