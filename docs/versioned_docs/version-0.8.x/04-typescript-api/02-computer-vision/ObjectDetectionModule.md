---
title: ObjectDetectionModule
---

TypeScript API implementation of the [useObjectDetection](../../03-hooks/02-computer-vision/useObjectDetection.md) hook.

## API Reference

- For detailed API Reference for `ObjectDetectionModule` see: [`ObjectDetectionModule` API Reference](../../06-api-reference/classes/ObjectDetectionModule.md).
- For all object detection models available out-of-the-box in React Native ExecuTorch see: [Object Detection Models](../../06-api-reference/index.md#models---object-detection).

## High Level Overview

```typescript
import {
  ObjectDetectionModule,
  SSDLITE_320_MOBILENET_V3_LARGE,
} from 'react-native-executorch';

const imageUri = 'path/to/image.png';

// Creating an instance and loading the model
const objectDetectionModule = await ObjectDetectionModule.fromModelName(
  SSDLITE_320_MOBILENET_V3_LARGE
);

// Running the model
const detections = await objectDetectionModule.forward(imageUri);
```

### Methods

All methods of `ObjectDetectionModule` are explained in details here: [`ObjectDetectionModule` API Reference](../../06-api-reference/classes/ObjectDetectionModule.md)

## Loading the model

Use the static [`fromModelName`](../../06-api-reference/classes/ObjectDetectionModule.md#frommodelname) factory method. It accepts a model config object (e.g. `SSDLITE_320_MOBILENET_V3_LARGE`) and an optional `onDownloadProgress` callback. It returns a promise resolving to an `ObjectDetectionModule` instance.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

To run the model, use the [`forward`](../../06-api-reference/classes/ObjectDetectionModule.md#forward) method. It accepts two arguments:

- `input` (required) - The image to process. Can be a remote URL, a local file URI, a base64-encoded image (whole URI or only raw base64), or a [`PixelData`](../../06-api-reference/interfaces/PixelData.md) object (raw RGB pixel buffer).
- `options` (optional) - An [`ObjectDetectionOptions`](../../06-api-reference/interfaces/ObjectDetectionOptions.md) object with:
  - `detectionThreshold` (optional) - Minimum confidence score (0-1). Defaults to model-specific value.
  - `iouThreshold` (optional) - IoU threshold for NMS (0-1). Defaults to model-specific value.
  - `inputSize` (optional) - For YOLO models: `384`, `512`, or `640`. Defaults to `384`.
  - `classesOfInterest` (optional) - Array of class labels to filter detections.

The method returns a promise resolving to an array of [`Detection`](../../06-api-reference/interfaces/Detection.md) objects, each containing the bounding box, label, and confidence score.

For real-time frame processing, use [`runOnFrame`](../../03-hooks/02-computer-vision/visioncamera-integration.md) instead.

### Example with Options

```typescript
const detections = await model.forward(imageUri, {
  detectionThreshold: 0.5,
  inputSize: 640, // YOLO models only
  classesOfInterest: ['PERSON', 'CAR'],
});
```

## Using a custom model

Use [`fromCustomModel`](../../06-api-reference/classes/ObjectDetectionModule.md#fromcustommodel) to load your own exported model binary instead of a built-in preset.

```typescript
import { ObjectDetectionModule } from 'react-native-executorch';

const MyLabels = { BACKGROUND: 0, CAT: 1, DOG: 2 } as const;

const detector = await ObjectDetectionModule.fromCustomModel(
  'https://example.com/custom_detector.pte',
  { labelMap: MyLabels },
  (progress) => console.log(progress)
);
```

### Required model contract

The `.pte` binary must expose a single `forward` method with the following interface:

**Input:** one `float32` tensor of shape `[1, 3, H, W]` — a single RGB image, values in `[0, 1]` after optional per-channel normalization `(pixel − mean) / std`. H and W are read from the model's declared input shape at load time.

**Outputs:** exactly three `float32` tensors, in this order:

1. **Bounding boxes** — flat `[4·N]` array of `(x1, y1, x2, y2)` coordinates in model-input pixel space.
2. **Confidence scores** — flat `[N]` array of values in `[0, 1]`.
3. **Class indices** — flat `[N]` array of `float32`-encoded integer class indices (0-based, matching the order of entries in your `labelMap`).

Preprocessing (resize → normalize) and postprocessing (coordinate rescaling, threshold filtering, NMS) are handled by the native runtime.

## Managing memory

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method [`delete`](../../06-api-reference/classes/ObjectDetectionModule.md#delete) on the module object you will no longer use, and want to remove from the memory. Note that you cannot use [`forward`](../../06-api-reference/classes/ObjectDetectionModule.md#forward) after [`delete`](../../06-api-reference/classes/ObjectDetectionModule.md#delete) unless you load the module again.
