# VADModule

TypeScript API implementation of the [useVAD](https://docs.swmansion.com/react-native-executorch/docs/hooks/natural-language-processing/useVAD.md) hook.

## Reference[​](#reference "Direct link to Reference")

```typescript
import { VADModule, FSMN_VAD } from 'react-native-executorch';

const model = new VADModule();
await model.load(FSMN_VAD, (progress) => {
  console.log(progress);
});

await model.forward(waveform);

```

### Methods[​](#methods "Direct link to Methods")

| Method    | Type                                                                                                               | Description                                                                                                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `load`    | `(model: { modelSource: ResourceSource }, onDownloadProgressCallback?: (progress: number) => void): Promise<void>` | Loads the model, where `modelSource` is a string that specifies the location of the model binary. To track the download progress, supply a callback function `onDownloadProgressCallback`. |
| `forward` | `(waveform: Float32Array): Promise<{ [category: string]: number }>`                                                | Executes the model's forward pass, where `imageSource` can be a fetchable resource or a Base64-encoded string.                                                                             |
| `delete`  | `(): void`                                                                                                         | Release the memory held by the module. Calling `forward` afterwards is invalid.                                                                                                            |

![](/react-native-executorch/img/Arrow.svg)![](/react-native-executorch/img/Arrow-dark.svg)Type definitions

```typescript
type ResourceSource = string | number | object;

```

```typescript
interface Segment {
  start: number;
  end: number;
}

```

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

To load the model, create a new instance of the module and use the `load` method on it. It accepts an object:

**`model`** - Object containing the model source.

* **`modelSource`** - A string that specifies the location of the model binary.

**`onDownloadProgressCallback`** - (Optional) Function called on download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, you can use the `forward` method on the module object. Before running the model's `forward` method, make sure to extract the audio waveform you want to process. You'll need to handle this step yourself, ensuring the audio is sampled at 16 kHz. Once you have the waveform, pass it as an argument to the forward method. The method returns a promise that resolves to the array of detected speech segments.

## Managing memory[​](#managing-memory "Direct link to Managing memory")

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method `delete()` on the module object you will no longer use, and want to remove from the memory. Note that you cannot use `forward` after `delete` unless you load the module again.
