---
title: PoseEstimationModule
---

TypeScript API implementation of the [usePoseEstimation](../../03-hooks/02-computer-vision/usePoseEstimation.md) hook.

## API Reference

- For detailed API Reference for `PoseEstimationModule` see: [`PoseEstimationModule` API Reference](../../06-api-reference/classes/PoseEstimationModule.md).
- For all pose estimation models available out-of-the-box in React Native ExecuTorch see: [Pose Estimation Models](../../06-api-reference/index.md#models---pose-estimation).

## High Level Overview

```typescript
import { PoseEstimationModule } from 'react-native-executorch';

const imageUri = 'path/to/image.png';

// Creating an instance and loading the model
const poseEstimationModule = await PoseEstimationModule.fromModelName({
  modelName: 'yolo26n-pose',
  modelSource: require('./assets/yolo26n-pose_xnnpack.pte'),
});

// Running the model
const detections = await poseEstimationModule.forward(imageUri);
detections[0].NOSE; // { x, y }
```

### Methods

All methods of `PoseEstimationModule` are explained in details here: [`PoseEstimationModule` API Reference](../../06-api-reference/classes/PoseEstimationModule.md)

## Loading the model

Use the static [`fromModelName`](../../06-api-reference/classes/PoseEstimationModule.md#frommodelname) factory method. It accepts a model config object (with `modelName` and `modelSource`) and an optional `onDownloadProgress` callback. It returns a promise resolving to a `PoseEstimationModule` instance whose return type is statically tied to the model's keypoint map.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Running the model

To run the model, use the [`forward`](../../06-api-reference/classes/PoseEstimationModule.md#forward) method. It accepts two arguments:

- `input` (required) - The image to process. Can be a remote URL, a local file URI, a base64-encoded image (whole URI or only raw base64), or a [`PixelData`](../../06-api-reference/interfaces/PixelData.md) object (raw RGB pixel buffer).
- `options` (optional) - A [`PoseEstimationOptions`](../../06-api-reference/interfaces/PoseEstimationOptions.md) object with:
  - `detectionThreshold` (optional) - Minimum confidence score for a detected person (0-1). Defaults to model-specific value.
  - `iouThreshold` (optional) - IoU threshold for NMS (0-1). Defaults to model-specific value.
  - `inputSize` (optional) - For YOLO models: `384`, `512`, or `640`. Defaults to `384`.

The method returns a promise resolving to an array of [`PersonKeypoints`](../../06-api-reference/type-aliases/PersonKeypoints.md). Each entry is an object keyed by the model's keypoint names (e.g. `NOSE`, `LEFT_SHOULDER`), where each value is a [`Keypoint`](../../06-api-reference/interfaces/Keypoint.md) with `x` and `y` coordinates in the original image's pixel space.

For real-time frame processing, use [`runOnFrame`](../../03-hooks/02-computer-vision/visioncamera-integration.md) instead.

### Example with Options

```typescript
const detections = await model.forward(imageUri, {
  detectionThreshold: 0.5,
  inputSize: 640, // YOLO models only
});

for (const person of detections) {
  console.log('Nose at', person.NOSE.x, person.NOSE.y);
}
```

## Using a custom model

Use [`fromCustomModel`](../../06-api-reference/classes/PoseEstimationModule.md#fromcustommodel) to load your own exported model binary instead of a built-in preset. You provide the keypoint map; `forward`'s return type is automatically derived from it, so each detected person is typed as a record keyed by the names you defined.

```typescript
import { PoseEstimationModule } from 'react-native-executorch';

const HandKeypoints = {
  WRIST: 0,
  THUMB_TIP: 1,
  INDEX_TIP: 2,
  MIDDLE_TIP: 3,
  RING_TIP: 4,
  PINKY_TIP: 5,
} as const;

const detector = await PoseEstimationModule.fromCustomModel(
  'https://example.com/custom_pose.pte',
  { keypointMap: HandKeypoints },
  (progress) => console.log(progress)
);

const detections = await detector.forward(imageUri);
detections[0].THUMB_TIP; // { x, y }
```

### Required model contract

The `.pte` binary must expose a `forward` method (or per-input-size methods such as `forward_384`, `forward_512`, `forward_640` for multi-resolution models) with the following interface:

**Input:** one `float32` tensor of shape `[1, 3, H, W]` — a single RGB image, values in `[0, 1]` after optional per-channel normalization `(pixel − mean) / std`. H and W are read from the model's declared input shape at load time.

**Outputs:** exactly three `float32` tensors, in this order:

1. **Bounding boxes** — shape `[Q, 4]`, `(x1, y1, x2, y2)` per detection in model-input pixel space, where `Q` is the number of candidate detections.
2. **Confidence scores** — shape `[Q]`, person confidence in `[0, 1]`.
3. **Keypoints** — shape `[Q, K, 3]`, where `K` is the number of keypoints (must match the size of your `keypointMap`) and the last dimension is `(x, y, visibility)` per keypoint, in model-input pixel space.

Preprocessing (resize → normalize) and postprocessing (coordinate rescaling, threshold filtering, mapping keypoints to your named keypoint map) are handled by the native runtime — your model only needs to produce the raw detections above.

## Managing memory

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method [`delete`](../../06-api-reference/classes/PoseEstimationModule.md#delete) on the module object you will no longer use, and want to remove from the memory. Note that you cannot use [`forward`](../../06-api-reference/classes/PoseEstimationModule.md#forward) after [`delete`](../../06-api-reference/classes/PoseEstimationModule.md#delete) unless you load the module again.
