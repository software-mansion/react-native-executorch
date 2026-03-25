# ImageEmbeddingsModule

TypeScript API implementation of the [useImageEmbeddings](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useImageEmbeddings.md) hook.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `ImageEmbeddingsModule` see: [`ImageEmbeddingsModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ImageEmbeddingsModule).
* For all image embeddings models available out-of-the-box in React Native ExecuTorch see: [Image Embeddings Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---image-embeddings).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

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

### Methods[​](#methods "Direct link to Methods")

All methods of `ImageEmbeddingsModule` are explained in details here: [`ImageEmbeddingsModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ImageEmbeddingsModule)

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

To create a ready-to-use instance, call the static [`fromModelName`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ImageEmbeddingsModule#frommodelname) factory with the following parameters:

* `namedSources` - Object containing:

  * `modelName` - Model name identifier.
  * `modelSource` - Location of the model binary.

* `onDownloadProgress` - Optional callback to track download progress (value between 0 and 1).

The factory returns a promise that resolves to a loaded `ImageEmbeddingsModule` instance.

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

## Running the model[​](#running-the-model "Direct link to Running the model")

[`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ImageEmbeddingsModule#forward) accepts one argument — the image to embed. The image can be a remote URL, a local file URI, a base64-encoded image (whole URI or only raw base64), or a [`PixelData`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/PixelData) object (raw RGB pixel buffer). The method returns a promise resolving to a `Float32Array` representing the embedding.

For real-time frame processing, use [`runOnFrame`](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/visioncamera-integration.md) instead.
