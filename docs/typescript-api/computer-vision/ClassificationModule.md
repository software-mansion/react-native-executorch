# ClassificationModule

TypeScript API implementation of the [useClassification](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useClassification.md) hook.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `ClassificationModule` see: [`ClassificationModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ClassificationModule).
* For all classification models available out-of-the-box in React Native ExecuTorch see: [Classification Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---classification).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

```typescript
import {
  ClassificationModule,
  EFFICIENTNET_V2_S,
} from 'react-native-executorch';

const imageUri = 'path/to/image.png';

// Creating and loading the module
const classificationModule =
  await ClassificationModule.fromModelName(EFFICIENTNET_V2_S);

// Running the model
const classesWithProbabilities = await classificationModule.forward(imageUri);

```

### Methods[​](#methods "Direct link to Methods")

All methods of `ClassificationModule` are explained in details here: [`ClassificationModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ClassificationModule)

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

Use the static [`fromModelName`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ClassificationModule#frommodelname) factory method. It accepts a model config object (e.g. `EFFICIENTNET_V2_S`) and an optional `onDownloadProgress` callback. It returns a promise resolving to a `ClassificationModule` instance.

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, use the [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ClassificationModule#forward) method. It accepts one argument — the image to classify. The image can be a remote URL, a local file URI, a base64-encoded image (whole URI or only raw base64), or a [`PixelData`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/PixelData) object (raw RGB pixel buffer). The method returns a promise resolving to an object mapping label keys to their probabilities.

For real-time frame processing, use [`runOnFrame`](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/visioncamera-integration.md) instead.

## Using a custom model[​](#using-a-custom-model "Direct link to Using a custom model")

Use [`fromCustomModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ClassificationModule#fromcustommodel) to load your own exported model binary instead of a built-in preset.

```typescript
import { ClassificationModule } from 'react-native-executorch';

const MyLabels = { CAT: 0, DOG: 1, BIRD: 2 } as const;

const classifier = await ClassificationModule.fromCustomModel(
  'https://example.com/custom_classifier.pte',
  { labelMap: MyLabels },
  (progress) => console.log(progress)
);

const result = await classifier.forward(imageUri);
// result is typed as Record<'CAT' | 'DOG' | 'BIRD', number>

```

### Required model contract[​](#required-model-contract "Direct link to Required model contract")

The `.pte` binary must expose a single `forward` method with the following interface:

**Input:** one `float32` tensor of shape `[1, 3, H, W]` — a single RGB image, values in `[0, 1]` after optional per-channel normalization `(pixel − mean) / std`. H and W are read from the model's declared input shape at load time.

**Output:** one `float32` tensor of shape `[1, C]` containing raw logits — one value per class, in the same order as the entries in your `labelMap`. Softmax is applied by the native runtime.

Preprocessing (resize → normalize) is handled by the native runtime — your model only needs to produce the raw logits.

## Managing memory[​](#managing-memory "Direct link to Managing memory")

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method [`delete`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ClassificationModule#delete) on the module object you will no longer use, and want to remove from the memory. Note that you cannot use [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ClassificationModule#forward) after [`delete`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/ClassificationModule#delete) unless you load the module again.
