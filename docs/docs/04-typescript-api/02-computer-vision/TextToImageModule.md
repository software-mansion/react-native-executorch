---
title: TextToImageModule
---

TypeScript API implementation of the [useTextToImage](../../03-hooks/02-computer-vision/useTextToImage.md) hook.

## API Reference

* For detailed API Reference for `TextToImageModule` see: [`TextToImageModule` API Reference](../../06-api-reference/classes/TextToImageModule.md).
* For all text to image models available out-of-the-box in React Native ExecuTorch see: [Text to Image Models](../../06-api-reference/index.md#models---image-generation).

## Reference

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

### Methods

All methods of `TextToImageModule` are explained in details here: [`TextToImageModule` API Reference](../../06-api-reference/classes/TextToImageModule.md)

## Loading the model

To load the model, use the [`load`](../../06-api-reference/classes/TextToImageModule.md#load) method. It accepts an object:

* [`model`](../../06-api-reference/classes/TextToImageModule.md#model) - Object containing:

    * [`schedulerSource`](../../06-api-reference/classes/TextToImageModule.md#schedulersource) - Location of the used scheduler.

    * [`tokenizerSource`](../../06-api-reference/classes/TextToImageModule.md#tokenizersource) - Location of the used tokenizer.

    * [`encoderSource`](../../06-api-reference/classes/TextToImageModule.md#encodersource) - Location of the used encoder.

    * [`unetSource`](../../06-api-reference/classes/TextToImageModule.md#unetsource) - Location of the used unet.

    * [`decoderSource`](../../06-api-reference/classes/TextToImageModule.md#decodersource) - Location of the used decoder.

* [`onDownloadProgressCallback`](../../06-api-reference/classes/TextToImageModule.md#ondownloadprogresscallback) - Callback to track download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

To run the model, you can use the [`forward`](../../06-api-reference/classes/TextToImageModule.md#forward) method. It accepts four arguments: a text prompt describing the requested image, a size of the image in pixels, a number of denoising steps, and an optional seed value, which enables reproducibility of the results.

The image size must fall within the range from 128 to 512 unless specified differently, and be a multiple of 32 due to the architecture of the U-Net and VAE models.

The seed value should be a positive integer.

## Listening for inference steps

To monitor the progress of image generation, you can pass an [`inferenceCallback`](../../06-api-reference/classes/TextToImageModule.md#inferencecallback) function to the [constructor](../../06-api-reference/classes/TextToImageModule.md#constructor). The callback is invoked at each denoising step (for a total of `numSteps + 1` times), yielding the current step index that can be used, for example, to display a progress bar.

## Deleting the model from memory

To delete the model from memory, you can use the [`delete`](../../06-api-reference/classes/TextToImageModule.md#delete) method.
