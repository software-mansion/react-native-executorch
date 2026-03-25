# SemanticSegmentationModule

TypeScript API implementation of the [useSemanticSegmentation](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useSemanticSegmentation.md) hook.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `SemanticSegmentationModule` see: [`SemanticSegmentationModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SemanticSegmentationModule).
* For all semantic segmentation models available out-of-the-box in React Native ExecuTorch see: [Semantic Segmentation Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---semantic-segmentation).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

```typescript
import {
  SemanticSegmentationModule,
  DEEPLAB_V3_RESNET50,
} from 'react-native-executorch';

const imageUri = 'path/to/image.png';

// Creating an instance from a built-in model
const segmentation =
  await SemanticSegmentationModule.fromModelName(DEEPLAB_V3_RESNET50);

// Running the model
const result = await segmentation.forward(imageUri);
// result.ARGMAX — Int32Array of per-pixel class indices

```

### Methods[​](#methods "Direct link to Methods")

All methods of `SemanticSegmentationModule` are explained in details here: [`SemanticSegmentationModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SemanticSegmentationModule)

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

`SemanticSegmentationModule` uses static factory methods instead of `new()` + `load()`. There are two ways to create an instance:

### Built-in models — `fromModelName`[​](#built-in-models--frommodelname "Direct link to built-in-models--frommodelname")

Use [`fromModelName`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SemanticSegmentationModule#frommodelname) for models that ship with built-in label maps and preprocessing configs:

```typescript
const segmentation = await SemanticSegmentationModule.fromModelName(
  DEEPLAB_V3_RESNET50,
  (progress) => console.log(`Download: ${Math.round(progress * 100)}%`)
);

```

The `config` parameter is a discriminated union — TypeScript ensures you provide the correct fields for each model name. Available built-in models: `'deeplab-v3-resnet50'`, `'deeplab-v3-resnet50-quantized'`, `'deeplab-v3-resnet101'`, `'deeplab-v3-resnet101-quantized'`, `'deeplab-v3-mobilenet-v3-large'`, `'deeplab-v3-mobilenet-v3-large-quantized'`, `'lraspp-mobilenet-v3-large'`, `'lraspp-mobilenet-v3-large-quantized'`, `'fcn-resnet50'`, `'fcn-resnet50-quantized'`, `'fcn-resnet101'`, `'fcn-resnet101-quantized'`, and `'selfie-segmentation'`.

### Custom models — `fromCustomModel`[​](#custom-models--fromcustommodel "Direct link to custom-models--fromcustommodel")

Use [`fromCustomModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SemanticSegmentationModule#fromcustommodel) for custom-exported segmentation models with your own label map:

```typescript
const MyLabels = { BACKGROUND: 0, FOREGROUND: 1 } as const;

const segmentation = await SemanticSegmentationModule.fromCustomModel(
  'https://example.com/custom_model.pte',
  {
    labelMap: MyLabels,
    preprocessorConfig: {
      normMean: [0.485, 0.456, 0.406],
      normStd: [0.229, 0.224, 0.225],
    },
  }
);

```

The `preprocessorConfig` is optional. If omitted, no input normalization is applied. The module instance will be typed to your custom label map — `forward` will accept and return keys from `MyLabels`.

### Required model contract[​](#required-model-contract "Direct link to Required model contract")

The `.pte` binary must expose a single `forward` method with the following interface:

**Input:** one `float32` tensor of shape `[1, 3, H, W]` — a single RGB image, values in `[0, 1]` after optional per-channel normalization `(pixel − mean) / std`. H and W are read from the model's declared input shape at load time.

**Output:** one `float32` tensor of shape `[1, C, H_out, W_out]` (NCHW) containing raw logits — one channel per class, in the same order as the entries in your `labelMap`. For binary segmentation a single-channel output is also supported: channel 0 is treated as the foreground probability and a synthetic background channel is added automatically.

Preprocessing (resize → normalize) and postprocessing (softmax, argmax, resize back to original dimensions) are handled by the native runtime.

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, use the [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SemanticSegmentationModule#forward) method. It accepts three arguments:

* [`input`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SemanticSegmentationModule#forward) (required) - The image to segment. Can be a remote URL, a local file URI, a base64-encoded image (whole URI or only raw base64), or a [`PixelData`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/PixelData) object (raw RGB pixel buffer).
* [`classesOfInterest`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SemanticSegmentationModule#forward) (optional) - An array of label keys indicating which per-class probability masks to include in the output. Defaults to `[]`. The `ARGMAX` map is always returned regardless.
* [`resizeToInput`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SemanticSegmentationModule#forward) (optional) - Whether to resize the output masks to the original input image dimensions. Defaults to `true`. If `false`, returns the raw model output dimensions.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)warning

Setting `resizeToInput` to `false` will make `forward` faster.

`forward` returns a promise resolving to an object containing:

* `ARGMAX` - An `Int32Array` where each element is the class index with the highest probability for that pixel.
* For each label included in `classesOfInterest`, a `Float32Array` of per-pixel probabilities for that class.

The return type narrows based on the labels passed in `classesOfInterest`:

```typescript
// Only ARGMAX in the result
const result = await segmentation.forward(imageUri);
result.ARGMAX; // Int32Array

// ARGMAX + requested class masks
const result = await segmentation.forward(imageUri, ['CAT', 'DOG']);
result.ARGMAX; // Int32Array
result.CAT; // Float32Array
result.DOG; // Float32Array

```

For real-time frame processing, use [`runOnFrame`](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/visioncamera-integration.md) instead.

## Managing memory[​](#managing-memory "Direct link to Managing memory")

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method [`delete`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SemanticSegmentationModule#delete) on the module object you will no longer use, and want to remove from the memory. Note that you cannot use [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SemanticSegmentationModule#forward) after [`delete`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SemanticSegmentationModule#delete) unless you create a new instance.
