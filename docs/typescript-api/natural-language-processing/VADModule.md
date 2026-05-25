# VADModule

TypeScript API implementation of the [useVAD](https://docs.swmansion.com/react-native-executorch/docs/hooks/natural-language-processing/useVAD.md) hook.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `VADModule` see: [`VADModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VADModule).
* For all VAD models available out-of-the-box in React Native ExecuTorch see: [VAD Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---voice-activity-detection).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

```typescript
import { models, VADModule } from 'react-native-executorch';
const model = await VADModule.fromModelName(models.vad.fsmn_vad(), (progress) =>
  console.log(progress)
);

await model.forward(waveform);

```

### Methods[​](#methods "Direct link to Methods")

All methods of `VADModule` are explained in detail here: [`VADModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VADModule)

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

To create a ready-to-use instance, call the static [`fromModelName`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VADModule#frommodelname) factory with the following parameters:

* `namedSources` - Object containing:

  * `modelName` - Model name identifier.
  * `modelSource` - Location of the model binary.

* `onDownloadProgress` - Optional callback to track download progress (value between 0 and 1).

The factory returns a promise that resolves to a loaded `VADModule` instance.

For more information on loading resources, take a look at the [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

## Running the model[​](#running-the-model "Direct link to Running the model")

### File Processing[​](#file-processing "Direct link to File Processing")

To process a full audio buffer at once, use the [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VADModule#forward) method. Before calling [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VADModule#forward), ensure you have the audio waveform sampled at 16 kHz. Pass the waveform as an argument; the method returns a promise that resolves to an array of detected speech segments.

### Live Streaming[​](#live-streaming "Direct link to Live Streaming")

For real-time applications, `VADModule` supports a streaming mode that identifies speech events as audio arrives.

1. **Initialize the stream**: Call [`stream`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VADModule#stream) with `onSpeechBegin` and `onSpeechEnd` callbacks.
2. **Insert audio**: Use [`streamInsert`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VADModule#streaminsert) to push new audio chunks into the internal buffer.
3. **Stop the stream**: Use [`streamStop`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VADModule#streamstop) to finish detection and release resources.

Refer to the [`useVAD`](https://docs.swmansion.com/react-native-executorch/docs/hooks/natural-language-processing/useVAD.md#live-streaming-real-time-detection) hook documentation for a detailed example of the streaming architecture.

## Managing memory[​](#managing-memory "Direct link to Managing memory")

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method [`delete`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VADModule#delete) on the module object you will no longer use, and want to remove from the memory. Note that you cannot use [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VADModule#forward) after [`delete`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VADModule#delete) unless you load the module again.
