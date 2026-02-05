# VADModule

TypeScript API implementation of the [useVAD](https://docs.swmansion.com/react-native-executorch/docs/hooks/natural-language-processing/useVAD.md) hook.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `VADModule` see: [`VADModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VADModule).
* For all VAD models available out-of-the-box in React Native ExecuTorch see: [VAD Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---voice-activity-detection).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

```typescript
import { VADModule, FSMN_VAD } from 'react-native-executorch';

const model = new VADModule();
await model.load(FSMN_VAD, (progress) => {
  console.log(progress);
});

await model.forward(waveform);

```

### Methods[​](#methods "Direct link to Methods")

All methods of `VADModule` are explained in details here: [`VADModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VADModule)

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

To initialize the module, create an instance and call the [`load`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VADModule#load) method with the following parameters:

* [`model`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VADModule#model) - Object containing:

  * [`modelSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VADModule#modelsource) - Location of the used model.

* [`onDownloadProgressCallback`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VADModule#ondownloadprogresscallback) - Callback to track download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, you can use the [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VADModule#forward) method on the module object. Before running the model's [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VADModule#forward) method, make sure to extract the audio waveform you want to process. You'll need to handle this step yourself, ensuring the audio is sampled at 16 kHz. Once you have the waveform, pass it as an argument to the forward method. The method returns a promise that resolves to the array of detected speech segments.

## Managing memory[​](#managing-memory "Direct link to Managing memory")

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method [`delete`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VADModule#delete) on the module object you will no longer use, and want to remove from the memory. Note that you cannot use [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VADModule#forward) after [`delete`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/VADModule#delete) unless you load the module again.
