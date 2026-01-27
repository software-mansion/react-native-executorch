# ImageEmbeddingsModule

TypeScript API implementation of the [useImageEmbeddings](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useImageEmbeddings.md) hook.

## Reference[​](#reference "Direct link to Reference")

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

### Methods[​](#methods "Direct link to Methods")

| Method               | Type                                                                                                               | Description                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `load`               | `(model: { modelSource: ResourceSource }, onDownloadProgressCallback?: (progress: number) => void): Promise<void>` | Loads the model, where `modelSource` is a string that specifies the location of the model binary.   |
| `forward`            | `(imageSource: string): Promise<Float32Array>`                                                                     | Executes the model's forward pass, where `imageSource` is a URI/URL to image that will be embedded. |
| `onDownloadProgress` | `(callback: (downloadProgress: number) => void): any`                                                              | Subscribe to the download progress event.                                                           |

![](/react-native-executorch/img/Arrow.svg)![](/react-native-executorch/img/Arrow-dark.svg)Type definitions

```typescript
type ResourceSource = string | number | object;

```

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

To load the model, use the `load` method. It accepts an object:

**`model`** - Object containing the model source.

* **`modelSource`** - A string that specifies the location of the model binary.

**`onDownloadProgressCallback`** - (Optional) Function called on download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

## Running the model[​](#running-the-model "Direct link to Running the model")

It accepts one argument, which is a URI/URL to an image you want to encode. The function returns a promise, which can resolve either to an error or an array of numbers representing the embedding.
