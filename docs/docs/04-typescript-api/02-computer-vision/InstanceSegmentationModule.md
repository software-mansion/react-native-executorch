---
title: InstanceSegmentationModule
---

TypeScript API implementation of the [useInstanceSegmentation](../../03-hooks/02-computer-vision/useInstanceSegmentation.md) hook.

## API Reference

- For detailed API Reference for `InstanceSegmentationModule` see: [`InstanceSegmentationModule` API Reference](../../06-api-reference/classes/InstanceSegmentationModule.md).

## High Level Overview

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

### Methods

All methods of `InstanceSegmentationModule` are explained in details here: [`InstanceSegmentationModule` API Reference](../../06-api-reference/classes/InstanceSegmentationModule.md)

## Loading the model

There are two ways to create an `InstanceSegmentationModule`:

### From a built-in model

Use [`fromModelName`](../../06-api-reference/classes/InstanceSegmentationModule.md#frommodelname) for pre-configured models. It accepts:

- `config` - A model configuration object (e.g. `YOLO26N_SEG`, `YOLO26S_SEG`) imported from the library, containing:
  - `modelName` - The name of a built-in model.
  - `modelSource` - Location of the model binary (a URL or a bundled resource).
- `onDownloadProgress` (optional) - Callback to track download progress, receiving a value between 0 and 1.

```typescript
import {
  InstanceSegmentationModule,
  YOLO26N_SEG,
} from 'react-native-executorch';

const segmentation =
  await InstanceSegmentationModule.fromModelName(YOLO26N_SEG);
```

### From a custom config

Use [`fromCustomConfig`](../../06-api-reference/classes/InstanceSegmentationModule.md#fromcustomconfig) for custom-exported models with your own label map. It accepts:

- `modelSource` - Location of the model binary.
- `config` - An [`InstanceSegmentationConfig`](../../06-api-reference/type-aliases/InstanceSegmentationConfig.md) object with:
  - `labelMap` - An enum-like object mapping class names to indices.
  - `preprocessorConfig` (optional) - Normalization parameters (`normMean`, `normStd`).
  - `postprocessorConfig` (optional) - Postprocessing settings (`applyNMS`).
  - `defaultConfidenceThreshold` (optional) - Default confidence threshold.
  - `defaultIouThreshold` (optional) - Default IoU threshold.
  - `availableInputSizes` (optional) - Array of supported input sizes (e.g., `[384, 512, 640]`). **Required** if your model exports multiple forward methods.
  - `defaultInputSize` (optional) - The input size to use when `options.inputSize` is not provided. **Required** if `availableInputSizes` is specified.
- `onDownloadProgress` (optional) - Callback to track download progress.

:::tip
If your model supports **multiple input sizes**, you must specify both `availableInputSizes` (an array of supported sizes) and `defaultInputSize` (the default size to use when no `inputSize` is provided in options). The model must expose separate methods named `forward_{inputSize}` for each size.

If your model supports only **one input size**, omit both fields and export a single `forward` method.
:::

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

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Custom model output contract

If you want to use a custom-exported model, it must conform to the following output contract:

The model must produce **3 output tensors**:

| Tensor      | Shape          | Description                                                     |
| ----------- | -------------- | --------------------------------------------------------------- |
| bboxes      | `[1, N, 4]`    | Bounding boxes as `[x1, y1, x2, y2]` in model input coordinates |
| scores      | `[1, N, 2]`    | `[max_score, class_id]` — scores must be post-sigmoid           |
| mask_logits | `[1, N, H, W]` | Per-detection binary mask logits — pre-sigmoid                  |

### Method naming convention

- If the model supports **multiple input sizes**, it must expose separate methods named `forward_{inputSize}` (e.g. `forward_384`, `forward_512`, `forward_640`).
- If the model supports **only one input size**, it should expose a single `forward` method.

## Running the model

To run the model, use the [`forward`](../../06-api-reference/classes/InstanceSegmentationModule.md#forward) method. It accepts two arguments:

- `imageSource` (required) - The image to process. Can be a remote URL, a local file URI, or a base64-encoded image (whole URI or only raw base64).
- `options` (optional) - An [`InstanceSegmentationOptions`](../../06-api-reference/interfaces/InstanceSegmentationOptions.md) object for configuring the segmentation (confidence threshold, IoU threshold, input size, classes of interest, etc.).

The method returns a promise resolving to an array of [`SegmentedInstance`](../../06-api-reference/interfaces/SegmentedInstance.md) objects. Each object contains bounding box coordinates, a binary segmentation mask, a string `label` (resolved from the model's label enum), and the confidence score.

:::info
Built-in YOLO models use [`CocoLabelYolo`](../../06-api-reference/enumerations/CocoLabelYolo.md) (80 classes, 0-indexed), not [`CocoLabel`](../../06-api-reference/enumerations/CocoLabel.md) (91 classes, 1-indexed, used by RF-DETR / SSDLite). When filtering with `classesOfInterest`, use the key names from `CocoLabelYolo`.
:::

## Managing memory

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method [`delete`](../../06-api-reference/classes/InstanceSegmentationModule.md#delete) on the module object you will no longer use, and want to remove from the memory. Note that you cannot use [`forward`](../../06-api-reference/classes/InstanceSegmentationModule.md#forward) after [`delete`](../../06-api-reference/classes/InstanceSegmentationModule.md#delete) unless you load the module again.
