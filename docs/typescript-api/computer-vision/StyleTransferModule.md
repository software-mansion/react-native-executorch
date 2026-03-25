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

// Creating and loading the module
const styleTransferModule =
  await StyleTransferModule.fromModelName(STYLE_TRANSFER_CANDY);

// Running the model
const generatedImageUrl = await styleTransferModule.forward(imageUri);

```

### Methods[​](#methods "Direct link to Methods")

All methods of `StyleTransferModule` are explained in details here: [`StyleTransferModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/StyleTransferModule)

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

To create a ready-to-use instance, call the static [`fromModelName`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/StyleTransferModule#frommodelname) factory with the following parameters:

* `namedSources` - Object containing:

  * `modelName` - Model name identifier.
  * `modelSource` - Location of the model binary.

* `onDownloadProgress` - Optional callback to track download progress (value between 0 and 1).

The factory returns a promise that resolves to a loaded `StyleTransferModule` instance.

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, use the [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/StyleTransferModule#forward) method. It accepts two arguments:

* `input` (required) — The image to stylize. Can be a remote URL, a local file URI, a base64-encoded image (whole URI or only raw base64), or a [`PixelData`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/PixelData) object (raw RGB pixel buffer).

* `outputType` (optional) — Controls the return format:

  <!-- -->

  * `'pixelData'` (default) — Returns a `PixelData` object with raw RGB pixels. No file is written.
  * `'url'` — Saves the result to a temp file and returns its URI as a `string`.

For real-time frame processing, use [`runOnFrame`](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/visioncamera-integration.md) instead.

## Managing memory[​](#managing-memory "Direct link to Managing memory")

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method [`delete`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/StyleTransferModule#delete) on the module object you will no longer use, and want to remove from the memory. Note that you cannot use [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/StyleTransferModule#forward) after [`delete`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/StyleTransferModule#delete) unless you load the module again.
