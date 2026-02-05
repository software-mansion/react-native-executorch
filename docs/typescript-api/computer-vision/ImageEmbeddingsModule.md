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

All methods of `ImageEmbeddingsModule` are explained in details here: [`ImageEmbeddingsModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ImageEmbeddingsModule)

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

To initialize the module, create an instance and call the [`load`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ImageEmbeddingsModule#load) method with the following parameters:

* [`model`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ImageEmbeddingsModule#model) - Object containing:

  * [`modelSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ImageEmbeddingsModule#modelsource) - Location of the used model.

* [`onDownloadProgressCallback`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ImageEmbeddingsModule#ondownloadprogresscallback) - Callback to track download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

## Running the model[​](#running-the-model "Direct link to Running the model")

[`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ImageEmbeddingsModule#forward) accepts one argument, which is a URI/URL to an image you want to encode. The function returns a promise, which can resolve either to an error or an array of numbers representing the embedding.
