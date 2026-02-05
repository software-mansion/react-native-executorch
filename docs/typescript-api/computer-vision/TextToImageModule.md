# TextToImageModule

TypeScript API implementation of the [useTextToImage](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useTextToImage.md) hook.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `TextToImageModule` see: [`TextToImageModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToImageModule).
* For all text to image models available out-of-the-box in React Native ExecuTorch see: [Text to Image Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---image-generation).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

```typescript
import {
  TextToImageModule,
  BK_SDM_TINY_VPRED_256,
} from 'react-native-executorch';

const input = 'a castle';

// Creating an instance
const textToImageModule = new TextToImageModule();

// Loading the model
await textToImageModule.load(BK_SDM_TINY_VPRED_256);

// Running the model
const image = await textToImageModule.forward(input);

```

### Methods[​](#methods "Direct link to Methods")

All methods of `TextToImageModule` are explained in details here: [`TextToImageModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToImageModule)

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

To load the model, use the [`load`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToImageModule#load) method. It accepts an object:

* [`model`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToImageModule#model) - Object containing:

  * [`schedulerSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToImageModule#schedulersource) - Location of the used scheduler.

  * [`tokenizerSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToImageModule#tokenizersource) - Location of the used tokenizer.

  * [`encoderSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToImageModule#encodersource) - Location of the used encoder.

  * [`unetSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToImageModule#unetsource) - Location of the used unet.

  * [`decoderSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToImageModule#decodersource) - Location of the used decoder.

* [`onDownloadProgressCallback`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToImageModule#ondownloadprogresscallback) - Callback to track download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, you can use the [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToImageModule#forward) method. It accepts four arguments: a text prompt describing the requested image, a size of the image in pixels, a number of denoising steps, and an optional seed value, which enables reproducibility of the results.

The image size must fall within the range from 128 to 512 unless specified differently, and be a multiple of 32 due to the architecture of the U-Net and VAE models.

The seed value should be a positive integer.

## Listening for inference steps[​](#listening-for-inference-steps "Direct link to Listening for inference steps")

To monitor the progress of image generation, you can pass an [`inferenceCallback`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToImageModule#inferencecallback) function to the [constructor](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToImageModule#constructor). The callback is invoked at each denoising step (for a total of `numSteps + 1` times), yielding the current step index that can be used, for example, to display a progress bar.

## Deleting the model from memory[​](#deleting-the-model-from-memory "Direct link to Deleting the model from memory")

To delete the model from memory, you can use the [`delete`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/TextToImageModule#delete) method.
