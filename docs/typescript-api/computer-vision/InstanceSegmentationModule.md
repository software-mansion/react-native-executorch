# InstanceSegmentationModule

TypeScript API implementation of the [useInstanceSegmentation](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useInstanceSegmentation.md) hook.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `InstanceSegmentationModule` see: [`InstanceSegmentationModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/InstanceSegmentationModule).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

```typescript
import {
  InstanceSegmentationModule,
  YOLO26N_SEG,
} from 'react-native-executorch';

const imageUri = 'path/to/image.png';

// Creating an instance from a built-in model
const segmentation =
  await InstanceSegmentationModule.fromModelName(YOLO26N_SEG);

// Running the model
const instances = await segmentation.forward(imageUri);

```

### Methods[​](#methods "Direct link to Methods")

All methods of `InstanceSegmentationModule` are explained in details here: [`InstanceSegmentationModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/InstanceSegmentationModule)

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

There are two ways to create an `InstanceSegmentationModule`:

### From a built-in model[​](#from-a-built-in-model "Direct link to From a built-in model")

Use [`fromModelName`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/InstanceSegmentationModule#frommodelname) for pre-configured models. It accepts:

* `config` - A model configuration object (e.g. `YOLO26N_SEG`, `YOLO26S_SEG`) imported from the library, containing:

  <!-- -->

  * `modelName` - The name of a built-in model.
  * `modelSource` - Location of the model binary (a URL or a bundled resource).

* `onDownloadProgress` (optional) - Callback to track download progress, receiving a value between 0 and 1.

```typescript
import {
  InstanceSegmentationModule,
  YOLO26N_SEG,
} from 'react-native-executorch';

const segmentation =
  await InstanceSegmentationModule.fromModelName(YOLO26N_SEG);

```

### From a custom config[​](#from-a-custom-config "Direct link to From a custom config")

Use [`fromCustomConfig`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/InstanceSegmentationModule#fromcustomconfig) for custom-exported models with your own label map. It accepts:

* `modelSource` - Location of the model binary.

* `config` - An [`InstanceSegmentationConfig`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/InstanceSegmentationConfig) object with:

  <!-- -->

  * `labelMap` - An enum-like object mapping class names to indices.
  * `preprocessorConfig` (optional) - Normalization parameters (`normMean`, `normStd`).
  * `postprocessorConfig` (optional) - Postprocessing settings (`applyNMS`).
  * `defaultConfidenceThreshold` (optional) - Default confidence threshold.
  * `defaultIouThreshold` (optional) - Default IoU threshold.
  * `availableInputSizes` (optional) - Array of supported input sizes (e.g., `[384, 512, 640]`). **Required** if your model exports multiple forward methods.
  * `defaultInputSize` (optional) - The input size to use when `options.inputSize` is not provided. **Required** if `availableInputSizes` is specified.

* `onDownloadProgress` (optional) - Callback to track download progress.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)tip

If your model supports **multiple input sizes**, you must specify both `availableInputSizes` (an array of supported sizes) and `defaultInputSize` (the default size to use when no `inputSize` is provided in options). The model must expose separate methods named `forward_{inputSize}` for each size.

If your model supports only **one input size**, omit both fields and export a single `forward` method.

```typescript
const MyLabels = { GRAPE_GREEN: 0, GRAPE_RED: 1, LEAF: 2 } as const;

const segmentation = await InstanceSegmentationModule.fromCustomConfig(
  'https://huggingface.co/.../grape_seg.pte',
  {
    labelMap: MyLabels,
    availableInputSizes: [640],
    defaultInputSize: 640,
    defaultConfidenceThreshold: 0.4,
    postprocessorConfig: { applyNMS: true },
  }
);

```

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

## Custom model output contract[​](#custom-model-output-contract "Direct link to Custom model output contract")

If you want to use a custom-exported model, it must conform to the following output contract:

The model must produce **3 output tensors**:

| Tensor       | Shape          | Description                                                     |
| ------------ | -------------- | --------------------------------------------------------------- |
| bboxes       | `[1, N, 4]`    | Bounding boxes as `[x1, y1, x2, y2]` in model input coordinates |
| scores       | `[1, N, 2]`    | `[max_score, class_id]` — scores must be post-sigmoid           |
| mask\_logits | `[1, N, H, W]` | Per-detection binary mask logits — pre-sigmoid                  |

### Method naming convention[​](#method-naming-convention "Direct link to Method naming convention")

* If the model supports **multiple input sizes**, it must expose separate methods named `forward_{inputSize}` (e.g. `forward_384`, `forward_512`, `forward_640`).
* If the model supports **only one input size**, it should expose a single `forward` method.

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, use the [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/InstanceSegmentationModule#forward) method. It accepts two arguments:

* `imageSource` (required) - The image to process. Can be a remote URL, a local file URI, a base64-encoded image (whole URI or only raw base64), or a [`PixelData`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/PixelData) object (raw RGB pixel buffer).
* `options` (optional) - An [`InstanceSegmentationOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/InstanceSegmentationOptions) object for configuring the segmentation (confidence threshold, IoU threshold, input size, classes of interest, etc.).

The method returns a promise resolving to an array of [`SegmentedInstance`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/SegmentedInstance) objects. Each object contains bounding box coordinates, a binary segmentation mask, a string `label` (resolved from the model's label enum), and the confidence score.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

Built-in YOLO models use [`CocoLabelYolo`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/CocoLabelYolo) (80 classes, 0-indexed), not [`CocoLabel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/CocoLabel) (91 classes, 1-indexed, used by RF-DETR / SSDLite). When filtering with `classesOfInterest`, use the key names from `CocoLabelYolo`.

## Managing memory[​](#managing-memory "Direct link to Managing memory")

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method [`delete`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/InstanceSegmentationModule#delete) on the module object you will no longer use, and want to remove from the memory. Note that you cannot use [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/InstanceSegmentationModule#forward) after [`delete`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/InstanceSegmentationModule#delete) unless you load the module again.
