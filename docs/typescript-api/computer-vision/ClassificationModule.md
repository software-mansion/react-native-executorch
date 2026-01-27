# ClassificationModule

TypeScript API implementation of the [useClassification](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useClassification.md) hook.

## Reference[​](#reference "Direct link to Reference")

```typescript
import {
  ClassificationModule,
  EFFICIENTNET_V2_S,
} from 'react-native-executorch';

const imageUri = 'path/to/image.png';

// Creating an instance
const classificationModule = new ClassificationModule();

// Loading the model
await classificationModule.load(EFFICIENTNET_V2_S);

// Running the model
const classesWithProbabilities = await classificationModule.forward(imageUri);

```

### Methods[​](#methods "Direct link to Methods")

| Method    | Type                                                                                                               | Description                                                                                                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `load`    | `(model: { modelSource: ResourceSource }, onDownloadProgressCallback?: (progress: number) => void): Promise<void>` | Loads the model, where `modelSource` is a string that specifies the location of the model binary. To track the download progress, supply a callback function `onDownloadProgressCallback`. |
| `forward` | `(imageSource: string): Promise<{ [category: string]: number }>`                                                   | Executes the model's forward pass, where `imageSource` can be a fetchable resource or a Base64-encoded string.                                                                             |
| `delete`  | `(): void`                                                                                                         | Release the memory held by the module. Calling `forward` afterwards is invalid.                                                                                                            |

![](/react-native-executorch/img/Arrow.svg)![](/react-native-executorch/img/Arrow-dark.svg)Type definitions

```typescript
type ResourceSource = string | number | object;

```

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

To load the model, create a new instance of the module and use the `load` method on it. It accepts an object:

**`model`** - Object containing the model source.

* **`modelSource`** - A string that specifies the location of the model binary.

**`onDownloadProgressCallback`** - (Optional) Function called on download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, you can use the `forward` method on the module object. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The method returns a promise, which can resolve either to an error or an object containing categories with their probabilities.

## Managing memory[​](#managing-memory "Direct link to Managing memory")

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method `delete()` on the module object you will no longer use, and want to remove from the memory. Note that you cannot use `forward` after `delete` unless you load the module again.
