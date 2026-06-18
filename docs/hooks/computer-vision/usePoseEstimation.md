# usePoseEstimation

Pose estimation is a computer vision technique that detects human bodies in an image and locates a fixed set of keypoints (e.g. nose, shoulders, knees) for each detected person. Unlike object detection, which produces a class label and a bounding box, pose estimation produces a structured set of named keypoints per person. React Native ExecuTorch offers a dedicated hook `usePoseEstimation` for this task.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/software-mansion/react-native-executorch-yolo26-pose). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `usePoseEstimation` see: [`usePoseEstimation` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/usePoseEstimation).
* For all pose estimation models available out-of-the-box in React Native ExecuTorch see: [Pose Estimation Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---pose-estimation).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

```typescript
import { models, usePoseEstimation } from 'react-native-executorch';
const model = usePoseEstimation({
  model: models.pose_estimation.yolo26n(),
});

const imageUri = 'file:///Users/.../photo.jpg';

try {
  const detections = await model.forward(imageUri);
  // detections is an array of PersonKeypoints, keyed by name (e.g. detections[0].NOSE)
} catch (error) {
  console.error(error);
}

```

### Arguments[​](#arguments "Direct link to Arguments")

`usePoseEstimation` takes [`PoseEstimationProps`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/PoseEstimationProps) that consists of:

* `model` - An object containing:

  <!-- -->

  * `modelName` - The name of a built-in model. See [`PoseEstimationModelSources`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/PoseEstimationProps) for the list of supported models.
  * `modelSource` - The location of the model binary (a URL or a bundled resource).

* An optional flag [`preventLoad`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/PoseEstimationProps#preventload) which prevents auto-loading of the model.

The hook is generic over the model config — TypeScript automatically infers the correct keypoint type based on the `modelName` you provide. No explicit generic parameter is needed.

You need more details? Check the following resources:

* For detailed information about `usePoseEstimation` arguments check this section: [`usePoseEstimation` arguments](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/usePoseEstimation#parameters).
* For all pose estimation models available out-of-the-box in React Native ExecuTorch see: [Pose Estimation Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---pose-estimation).
* For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

### Returns[​](#returns "Direct link to Returns")

`usePoseEstimation` returns a [`PoseEstimationType`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/PoseEstimationType) object containing:

* `isReady` - Whether the model is loaded and ready to process images.
* `isGenerating` - Whether the model is currently processing an image.
* `error` - An error object if the model failed to load or encountered a runtime error.
* `downloadProgress` - A value between 0 and 1 representing the download progress of the model binary.
* `forward` - A function to run inference on an image.
* `getAvailableInputSizes` - A function that returns available input sizes for multi-method models (YOLO). Returns `undefined` for single-method models.
* `runOnFrame` - A synchronous worklet function for real-time VisionCamera frame processing. See [VisionCamera Integration](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/visioncamera-integration.md) for usage.

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, use the [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/PoseEstimationType#forward) method. It accepts two arguments:

* `input` (required) - The image to process. Can be a remote URL, a local file URI, a base64-encoded image (whole URI or only raw base64), or a [`PixelData`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/PixelData) object (raw RGB pixel buffer).

* `options` (optional) - A [`PoseEstimationOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/PoseEstimationOptions) object with the following properties:

  <!-- -->

  * `detectionThreshold` (optional) - A number between 0 and 1 representing the minimum confidence score for a detected person. Defaults to model-specific value (typically `0.5`).
  * `keypointThreshold` (optional) - Per-keypoint visibility threshold (0-1). Keypoints whose model-reported visibility falls below this are emitted as `(-1, -1)` so consumers can skip them. Defaults to model-specific value.
  * `inputSize` (optional) - For multi-method models like YOLO, specify the input resolution (`384`, `512`, or `640`). Defaults to `384` for YOLO models.

`forward` returns a promise resolving to an array of [`PersonKeypoints`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/PersonKeypoints) — one entry per detected person. Each entry is an object keyed by the model's keypoint names (typed against the model's keypoint map), where each value is a [`Keypoint`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/Keypoint) with:

* `x` - The x coordinate in the original image's pixel space.
* `y` - The y coordinate in the original image's pixel space.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

Keypoints whose visibility falls below `keypointThreshold` (or that the model considers off-image) are returned as `{ x: -1, y: -1 }`. Filter them out before drawing — e.g. `if (kp.x < 0 || kp.y < 0) skip;`.

For example, with a COCO-keypoint model:

```typescript
const detections = await model.forward(imageUri);
const firstPerson = detections[0];
firstPerson.NOSE; // { x, y }
firstPerson.LEFT_SHOULDER; // { x, y }

```

The keypoint names available on each person are determined by the model's keypoint map and are checked at compile time.

## Example[​](#example "Direct link to Example")

```typescript
import { models, usePoseEstimation } from 'react-native-executorch';
function App() {
  const model = usePoseEstimation({
    model: models.pose_estimation.yolo26n(),
  });

  const handleDetect = async () => {
    if (!model.isReady) return;

    const imageUri = 'file:///Users/.../photo.jpg';

    try {
      const detections = await model.forward(imageUri, {
        detectionThreshold: 0.5,
        inputSize: 640,
      });

      console.log('Detected:', detections.length, 'people');
      for (const person of detections) {
        console.log('Nose at', person.NOSE.x, person.NOSE.y);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ...
}

```

## VisionCamera integration[​](#visioncamera-integration "Direct link to VisionCamera integration")

See the full guide: [VisionCamera Integration](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/visioncamera-integration.md).

## Supported models[​](#supported-models "Direct link to Supported models")

| Model                                                                                                         | Number of keypoints | Keypoint list                                                                                           | Multi-size Support |
| ------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------- | ------------------ |
| [YOLO26N-Pose](https://huggingface.co/software-mansion/react-native-executorch-yolo26-pose)                   | 17                  | [COCO](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/CocoKeypoint) | Yes (384/512/640)  |
| [RF-DETR Keypoint (preview)](https://huggingface.co/software-mansion/react-native-executorch-rfdetr-keypoint) | 17                  | [COCO](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/CocoKeypoint) | No                 |

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)tip

YOLO models support multiple input sizes (384px, 512px, 640px). Smaller sizes are faster but less accurate, while larger sizes are more accurate but slower. Choose based on your speed/accuracy requirements.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)warning

`rfdetr_keypoint_preview` is a **preview weights** export and may be re-exported under a different constant once a stable version ships. It is a single-input-size model (no `inputSize` option) and ships `xnnpack`, `coreml`, and `mlx` backends — pass `{ backend }` to override the platform default, e.g. `models.pose_estimation.rfdetr_keypoint_preview({ backend: 'mlx' })`.
