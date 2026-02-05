# StyleTransferModule

TypeScript API implementation of the [useStyleTransfer](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useStyleTransfer.md) hook.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `StyleTransferModule` see: [`StyleTransferModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/StyleTransferModule).
* For all style transfer models available out-of-the-box in React Native ExecuTorch see: [Style Transfer Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---style-transfer).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

```typescript
import {
  StyleTransferModule,
  STYLE_TRANSFER_CANDY,
} from 'react-native-executorch';

const imageUri = 'path/to/image.png';

// Creating an instance
const styleTransferModule = new StyleTransferModule();

// Loading the model
await styleTransferModule.load(STYLE_TRANSFER_CANDY);

// Running the model
const generatedImageUrl = await styleTransferModule.forward(imageUri);

```

### Methods[​](#methods "Direct link to Methods")

All methods of `StyleTransferModule` are explained in details here: [`StyleTransferModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/StyleTransferModule)

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

To load the model, create a new instance of the module and use the [`load`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/StyleTransferModule#load) method on it. It accepts an object:

* [`model`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/StyleTransferModule#model) - Object containing:

  * [`modelSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/StyleTransferModule#modelsource) - Location of the used model.

* [`onDownloadProgressCallback`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/StyleTransferModule#ondownloadprogresscallback) - Callback to track download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, you can use the [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/StyleTransferModule#forward) method on the module object. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The method returns a promise, which can resolve either to an error or a URL to generated image.

## Managing memory[​](#managing-memory "Direct link to Managing memory")

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method [`delete`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/StyleTransferModule#delete) on the module object you will no longer use, and want to remove from the memory. Note that you cannot use [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/StyleTransferModule#forward) after [`delete`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/StyleTransferModule#delete) unless you load the module again.
