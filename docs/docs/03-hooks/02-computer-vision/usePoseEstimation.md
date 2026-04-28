---
title: usePoseEstimation
---

Pose estimation is a computer vision technique that detects human bodies in an image and locates a fixed set of keypoints (e.g. nose, shoulders, knees) for each detected person. Unlike object detection, which produces a class label and a bounding box, pose estimation produces a structured set of named keypoints per person. React Native ExecuTorch offers a dedicated hook `usePoseEstimation` for this task.

:::info
It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/pose-estimation-68d0ea936cd0906843cbba7d). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

## API Reference

- For detailed API Reference for `usePoseEstimation` see: [`usePoseEstimation` API Reference](../../06-api-reference/functions/usePoseEstimation.md).
- For all pose estimation models available out-of-the-box in React Native ExecuTorch see: [Pose Estimation Models](../../06-api-reference/index.md#models---pose-estimation).

## High Level Overview

```typescript
import { usePoseEstimation } from 'react-native-executorch';

const model = usePoseEstimation({
  model: {
    modelName: 'yolo26n-pose',
    modelSource: require('./assets/yolo26n-pose_xnnpack.pte'),
  },
});

const imageUri = 'file:///Users/.../photo.jpg';

try {
  const detections = await model.forward(imageUri);
  // detections is an array of PersonKeypoints, keyed by name (e.g. detections[0].NOSE)
} catch (error) {
  console.error(error);
}
```

### Arguments

`usePoseEstimation` takes [`PoseEstimationProps`](../../06-api-reference/interfaces/PoseEstimationProps.md) that consists of:

- `model` - An object containing:
  - `modelName` - The name of a built-in model. See [`PoseEstimationModelSources`](../../06-api-reference/interfaces/PoseEstimationProps.md) for the list of supported models.
  - `modelSource` - The location of the model binary (a URL or a bundled resource).
- An optional flag [`preventLoad`](../../06-api-reference/interfaces/PoseEstimationProps.md#preventload) which prevents auto-loading of the model.

The hook is generic over the model config — TypeScript automatically infers the correct keypoint type based on the `modelName` you provide. No explicit generic parameter is needed.

You need more details? Check the following resources:

- For detailed information about `usePoseEstimation` arguments check this section: [`usePoseEstimation` arguments](../../06-api-reference/functions/usePoseEstimation.md#parameters).
- For all pose estimation models available out-of-the-box in React Native ExecuTorch see: [Pose Estimation Models](../../06-api-reference/index.md#models---pose-estimation).
- For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

`usePoseEstimation` returns a [`PoseEstimationType`](../../06-api-reference/interfaces/PoseEstimationType.md) object containing:

- `isReady` - Whether the model is loaded and ready to process images.
- `isGenerating` - Whether the model is currently processing an image.
- `error` - An error object if the model failed to load or encountered a runtime error.
- `downloadProgress` - A value between 0 and 1 representing the download progress of the model binary.
- `forward` - A function to run inference on an image.
- `getAvailableInputSizes` - A function that returns available input sizes for multi-method models (YOLO). Returns `undefined` for single-method models.
- `runOnFrame` - A synchronous worklet function for real-time VisionCamera frame processing. See [VisionCamera Integration](./visioncamera-integration.md) for usage.

## Running the model

To run the model, use the [`forward`](../../06-api-reference/interfaces/PoseEstimationType.md#forward) method. It accepts two arguments:

- `input` (required) - The image to process. Can be a remote URL, a local file URI, a base64-encoded image (whole URI or only raw base64), or a [`PixelData`](../../06-api-reference/interfaces/PixelData.md) object (raw RGB pixel buffer).
- `options` (optional) - A [`PoseEstimationOptions`](../../06-api-reference/interfaces/PoseEstimationOptions.md) object with the following properties:
  - `detectionThreshold` (optional) - A number between 0 and 1 representing the minimum confidence score for a detected person. Defaults to model-specific value (typically `0.5`).
  - `iouThreshold` (optional) - IoU threshold for non-maximum suppression (0-1). Defaults to model-specific value (typically `0.5`).
  - `inputSize` (optional) - For multi-method models like YOLO, specify the input resolution (`384`, `512`, or `640`). Defaults to `384` for YOLO models.

`forward` returns a promise resolving to an array of [`PersonKeypoints`](../../06-api-reference/type-aliases/PersonKeypoints.md) — one entry per detected person. Each entry is an object keyed by the model's keypoint names (typed against the model's keypoint map), where each value is a [`Keypoint`](../../06-api-reference/interfaces/Keypoint.md) with:

- `x` - The x coordinate in the original image's pixel space.
- `y` - The y coordinate in the original image's pixel space.

For example, with a COCO-keypoint model:

```typescript
const detections = await model.forward(imageUri);
const firstPerson = detections[0];
firstPerson.NOSE; // { x, y }
firstPerson.LEFT_SHOULDER; // { x, y }
```

The keypoint names available on each person are determined by the model's keypoint map and are checked at compile time.

## Example

```typescript
import { usePoseEstimation } from 'react-native-executorch';

function App() {
  const model = usePoseEstimation({
    model: {
      modelName: 'yolo26n-pose',
      modelSource: require('./assets/yolo26n-pose_xnnpack.pte'),
    },
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

## VisionCamera integration

See the full guide: [VisionCamera Integration](./visioncamera-integration.md).

## Supported models

| Model                                                                                       | Number of keypoints | Keypoint list                                               | Multi-size Support |
| ------------------------------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------- | ------------------ |
| [YOLO11N-Pose](https://huggingface.co/software-mansion/react-native-executorch-yolo11-pose) | 17                  | [COCO](../../06-api-reference/enumerations/CocoKeypoint.md) | Yes (384/512/640)  |
| [YOLO26N-Pose](https://huggingface.co/software-mansion/react-native-executorch-yolo26-pose) | 17                  | [COCO](../../06-api-reference/enumerations/CocoKeypoint.md) | Yes (384/512/640)  |

:::tip
YOLO models support multiple input sizes (384px, 512px, 640px). Smaller sizes are faster but less accurate, while larger sizes are more accurate but slower. Choose based on your speed/accuracy requirements.
:::
