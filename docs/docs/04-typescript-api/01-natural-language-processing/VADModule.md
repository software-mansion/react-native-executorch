---
title: VADModule
---

TypeScript API implementation of the [useVAD](../../03-hooks/01-natural-language-processing/useVAD.md) hook.

## API Reference

- For detailed API Reference for `VADModule` see: [`VADModule` API Reference](../../06-api-reference/classes/VADModule.md).
- For all VAD models available out-of-the-box in React Native ExecuTorch see: [VAD Models](../../06-api-reference/index.md#models---voice-activity-detection).

## High Level Overview

```typescript
import { models, VADModule } from 'react-native-executorch';
const model = await VADModule.fromModelName(models.vad.fsmn_vad(), (progress) =>
  console.log(progress)
);

await model.forward(waveform);
```

### Methods

All methods of `VADModule` are explained in detail here: [`VADModule` API Reference](../../06-api-reference/classes/VADModule.md)

## Loading the model

To create a ready-to-use instance, call the static [`fromModelName`](../../06-api-reference/classes/VADModule.md#frommodelname) factory with the following parameters:

- `namedSources` - Object containing:
  - `modelName` - Model name identifier.
  - `modelSource` - Location of the model binary.

- `onDownloadProgress` - Optional callback to track download progress (value between 0 and 1).

The factory returns a promise that resolves to a loaded `VADModule` instance.

For more information on loading resources, take a look at the [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

### Batch Processing

To process a full audio buffer at once, use the [`forward`](../../06-api-reference/classes/VADModule.md#forward) method. Before calling [`forward`](../../06-api-reference/classes/VADModule.md#forward), ensure you have the audio waveform sampled at 16 kHz. Pass the waveform as an argument; the method returns a promise that resolves to an array of detected speech segments.

### Live Streaming

For real-time applications, `VADModule` supports a streaming mode that identifies speech events as audio arrives.

1.  **Initialize the stream**: Call [`stream`](../../06-api-reference/classes/VADModule.md#stream) with `onSpeechBegin` and `onSpeechEnd` callbacks.
2.  **Insert audio**: Use [`streamInsert`](../../06-api-reference/classes/VADModule.md#streaminsert) to push new audio chunks into the internal buffer.
3.  **Stop the stream**: Use [`streamStop`](../../06-api-reference/classes/VADModule.md#streamstop) to finish detection and release resources.

Refer to the [`useVAD`](../../03-hooks/01-natural-language-processing/useVAD.md#live-streaming-real-time-detection) hook documentation for a detailed example of the streaming architecture.

## Managing memory

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method [`delete`](../../06-api-reference/classes/VADModule.md#delete) on the module object you will no longer use, and want to remove from the memory. Note that you cannot use [`forward`](../../06-api-reference/classes/VADModule.md#forward) after [`delete`](../../06-api-reference/classes/VADModule.md#delete) unless you load the module again.
