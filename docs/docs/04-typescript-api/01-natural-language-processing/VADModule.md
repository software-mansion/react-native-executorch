---
title: VADModule
---

TypeScript API implementation of the [useVAD](../../03-hooks/01-natural-language-processing/useVAD.md) hook.

## API Reference

- For detailed API Reference for `VADModule` see: [`VADModule` API Reference](../../06-api-reference/classes/VADModule.md).
- For all VAD models available out-of-the-box in React Native ExecuTorch see: [VAD Models](../../06-api-reference/index.md#models---voice-activity-detection).

## High Level Overview

```typescript
import { VADModule, FSMN_VAD } from 'react-native-executorch';

const model = await VADModule.fromModelName(
  { modelSource: FSMN_VAD },
  (progress) => console.log(progress)
);

await model.forward(waveform);
```

### Methods

All methods of `VADModule` are explained in details here: [`VADModule` API Reference](../../06-api-reference/classes/VADModule.md)

## Loading the model

To create a ready-to-use instance, call the static [`fromModelName`](../../06-api-reference/classes/VADModule.md#frommodelname) factory with the following parameters:

- `model` - Object containing:
  - `modelSource` - Location of the model binary.

- `onDownloadProgress` - Optional callback to track download progress (value between 0 and 1).

The factory returns a promise that resolves to a loaded `VADModule` instance.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

To run the model, you can use the [`forward`](../../06-api-reference/classes/VADModule.md#forward) method on the module object. Before running the model's [`forward`](../../06-api-reference/classes/VADModule.md#forward) method, make sure to extract the audio waveform you want to process. You'll need to handle this step yourself, ensuring the audio is sampled at 16 kHz. Once you have the waveform, pass it as an argument to the forward method. The method returns a promise that resolves to the array of detected speech segments.

## Managing memory

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method [`delete`](../../06-api-reference/classes/VADModule.md#delete) on the module object you will no longer use, and want to remove from the memory. Note that you cannot use [`forward`](../../06-api-reference/classes/VADModule.md#forward) after [`delete`](../../06-api-reference/classes/VADModule.md#delete) unless you load the module again.
