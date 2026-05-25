# PoseEstimationModule

TypeScript API implementation of the [usePoseEstimation](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/usePoseEstimation.md) hook.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `PoseEstimationModule` see: [`PoseEstimationModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/PoseEstimationModule).
* For all pose estimation models available out-of-the-box in React Native ExecuTorch see: [Pose Estimation Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---pose-estimation).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

```typescript
import { models, PoseEstimationModule } from 'react-native-executorch';
const imageUri = 'path/to/image.png';

// Creating an instance and loading the model
const poseEstimationModule = await PoseEstimationModule.fromModelName(
  models.pose_estimation.yolo26n()
);

// Running the model
const detections = await poseEstimationModule.forward(imageUri);
detections[0].NOSE; // { x, y }

```

### Methods[​](#methods "Direct link to Methods")

All methods of `PoseEstimationModule` are explained in details here: [`PoseEstimationModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/PoseEstimationModule)

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

Use the static [`fromModelName`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/PoseEstimationModule#frommodelname) factory method. It accepts a model config object (with `modelName` and `modelSource`) and an optional `onDownloadProgress` callback. It returns a promise resolving to a `PoseEstimationModule` instance whose return type is statically tied to the model's keypoint map.

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, use the [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/PoseEstimationModule#forward) method. It accepts two arguments:

* `input` (required) - The image to process. Can be a remote URL, a local file URI, a base64-encoded image (whole URI or only raw base64), or a [`PixelData`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/PixelData) object (raw RGB pixel buffer).

* `options` (optional) - A [`PoseEstimationOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/PoseEstimationOptions) object with:

  <!-- -->

  * `detectionThreshold` (optional) - Minimum confidence score for a detected person (0-1). Defaults to model-specific value.
  * `keypointThreshold` (optional) - Per-keypoint visibility threshold (0-1). Keypoints whose model-reported visibility falls below this are reported as `(-1, -1)` so consumers can skip them. Defaults to model-specific value.
  * `inputSize` (optional) - For YOLO models: `384`, `512`, or `640`. Defaults to `384`.

The method returns a promise resolving to an array of [`PersonKeypoints`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/PersonKeypoints). Each entry is an object keyed by the model's keypoint names (e.g. `NOSE`, `LEFT_SHOULDER`), where each value is a [`Keypoint`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/Keypoint) with `x` and `y` coordinates in the original image's pixel space.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

Keypoints whose visibility falls below `keypointThreshold` (or that the model considers off-image) are returned as `{ x: -1, y: -1 }`. Filter them out before drawing — e.g. `if (kp.x < 0 || kp.y < 0) skip;`.

For real-time frame processing, use [`runOnFrame`](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/visioncamera-integration.md) instead.

### Example with Options[​](#example-with-options "Direct link to Example with Options")

```typescript
const detections = await model.forward(imageUri, {
  detectionThreshold: 0.5,
  inputSize: 640, // YOLO models only
});

for (const person of detections) {
  console.log('Nose at', person.NOSE.x, person.NOSE.y);
}

```

## Using a custom model[​](#using-a-custom-model "Direct link to Using a custom model")

Use [`fromCustomModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/PoseEstimationModule#fromcustommodel) to load your own exported model binary instead of a built-in preset. You provide the keypoint map; `forward`'s return type is automatically derived from it, so each detected person is typed as a record keyed by the names you defined.

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

### Required model contract[​](#required-model-contract "Direct link to Required model contract")

The `.pte` binary must expose a `forward` method (or per-input-size methods such as `forward_384`, `forward_512`, `forward_640` for multi-resolution models) with the following interface:

**Input:** one `float32` tensor of shape `[1, 3, H, W]` — a single RGB image, values in `[0, 1]` after optional per-channel normalization `(pixel − mean) / std`. H and W are read from the model's declared input shape at load time. The mean and std vectors are supplied via `preprocessorConfig.normMean` and `preprocessorConfig.normStd` on the [`PoseEstimationConfig`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/PoseEstimationConfig) you pass to `fromCustomModel`; if omitted, the runtime feeds the resized image without normalization.

**Outputs:** exactly three `float32` tensors, in this order:

1. **Bounding boxes** — shape `[Q, 4]`, `(x1, y1, x2, y2)` per detection in model-input pixel space, where `Q` is the number of candidate detections.
2. **Confidence scores** — shape `[Q]`, person confidence in `[0, 1]`.
3. **Keypoints** — shape `[Q, K, 3]`, where `K` is the number of keypoints (must match the size of your `keypointMap`) and the last dimension is `(x, y, visibility)` per keypoint, in model-input pixel space.

Preprocessing (resize → normalize) and postprocessing (coordinate rescaling, threshold filtering, mapping keypoints to your named keypoint map) are handled by the native runtime — your model only needs to produce the raw detections above.

## Managing memory[​](#managing-memory "Direct link to Managing memory")

The module is a regular JavaScript object, and as such its lifespan will be managed by the garbage collector. In most cases this should be enough, and you should not worry about freeing the memory of the module yourself, but in some cases you may want to release the memory occupied by the module before the garbage collector steps in. In this case use the method [`delete`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/PoseEstimationModule#delete) on the module object you will no longer use, and want to remove from the memory. Note that you cannot use [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/PoseEstimationModule#forward) after [`delete`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/PoseEstimationModule#delete) unless you load the module again.
