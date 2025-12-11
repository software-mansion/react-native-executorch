---
title: TextToImageModule
---

TypeScript API implementation of the [useTextToImage](../../02-hooks/02-computer-vision/useTextToImage.md) hook.

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

| Method        | Type                                                                                                                                                                                                                                            | Description                                                                                                                                                                                                                              |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `constructor` | `(inferenceCallback?: (stepIdx: number) => void)`                                                                                                                                                                                               | Creates a new instance of TextToImageModule with optional callback on inference step.                                                                                                                                                    |
| `load`        | `(model: {tokenizerSource: ResourceSource; schedulerSource: ResourceSource; encoderSource: ResourceSource; unetSource: ResourceSource; decoderSource: ResourceSource;}, onDownloadProgressCallback: (progress: number) => void): Promise<void>` | Loads the model.                                                                                                                                                                                                                         |
| `forward`     | `(input: string, imageSize: number, numSteps: number, seed?: number) => Promise<string>`                                                                                                                                                        | Runs the model to generate an image described by `input`, and conditioned by `seed`, performing `numSteps` inference steps. The resulting image, with dimensions `imageSize`×`imageSize` pixels, is returned as a base64-encoded string. |
| `delete`      | `() => void`                                                                                                                                                                                                                                    | Deletes the model from memory. Note you cannot delete model while it's generating. You need to interrupt it first and make sure model stopped generation.                                                                                |
| `interrupt`   | `() => void`                                                                                                                                                                                                                                    | Interrupts model generation. The model is stopped in the nearest step.                                                                                                                                                                   |

<details>
<summary>Type definitions</summary>

```typescript
type ResourceSource = string | number | object;
```

</details>

## Loading the model

To load the model, use the `load` method. It accepts an object:

**`model`** - Object containing the model source.

- **`schedulerSource`** - A string that specifies the location of the scheduler config.

- **`tokenizerSource`** - A string that specifies the location of the tokenizer config.

- **`encoderSource`** - A string that specifies the location of the text encoder binary.

- **`unetSource`** - A string that specifies the location of the U-Net binary.

- **`decoderSource`** - A string that specifies the location of the VAE decoder binary.

**`onDownloadProgressCallback`** - (Optional) Function called on download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

To run the model, you can use the `forward` method. It accepts four arguments: a text prompt describing the requested image, a size of the image in pixels, a number of denoising steps, and an optional seed value, which enables reproducibility of the results.

The image size must fall within the range from 128 to 512 unless specified differently, and be a multiple of 32 due to the architecture of the U-Net and VAE models.

The seed value should be a positive integer.

## Listening for inference steps

To monitor the progress of image generation, you can pass an `inferenceCallback` function to the constructor. The callback is invoked at each denoising step (for a total of `numSteps + 1` times), yielding the current step index that can be used, for example, to display a progress bar.

## Deleting the model from memory

To delete the model from memory, you can use the `delete` method.
