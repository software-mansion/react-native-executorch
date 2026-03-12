---
title: useObjectDetection
---

Object detection is a computer vision technique that identifies and locates objects within images. Unlike image classification, which assigns a single label to the whole image, object detection returns a list of detected objects — each with a bounding box, a class label, and a confidence score. React Native ExecuTorch offers a dedicated hook `useObjectDetection` for this task.

:::warning
It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/object-detection-68d0ea936cd0906843cbba7d). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

## API Reference

- For detailed API Reference for `useObjectDetection` see: [`useObjectDetection` API Reference](../../06-api-reference/functions/useObjectDetection.md).
- For all object detection models available out-of-the-box in React Native ExecuTorch see: [Object Detection Models](../../06-api-reference/index.md#models---object-detection).

## High Level Overview

```typescript
import {
  useObjectDetection,
  SSDLITE_320_MOBILENET_V3_LARGE,
} from 'react-native-executorch';

const model = useObjectDetection({
  model: SSDLITE_320_MOBILENET_V3_LARGE,
});

const imageUri = 'file:///Users/.../photo.jpg';

try {
  const detections = await model.forward(imageUri);
  // detections is an array of Detection objects
} catch (error) {
  console.error(error);
}
```

### Arguments

`useObjectDetection` takes [`ObjectDetectionProps`](../../06-api-reference/interfaces/ObjectDetectionProps.md) that consists of:

- `model` - An object containing:
  - `modelName` - The name of a built-in model. See [`ObjectDetectionModelSources`](../../06-api-reference/interfaces/ObjectDetectionProps.md) for the list of supported models.
  - `modelSource` - The location of the model binary (a URL or a bundled resource).
- An optional flag [`preventLoad`](../../06-api-reference/interfaces/ObjectDetectionProps.md#preventload) which prevents auto-loading of the model.

The hook is generic over the model config — TypeScript automatically infers the correct label type based on the `modelName` you provide. No explicit generic parameter is needed.

You need more details? Check the following resources:

- For detailed information about `useObjectDetection` arguments check this section: [`useObjectDetection` arguments](../../06-api-reference/functions/useObjectDetection.md#parameters).
- For all object detection models available out-of-the-box in React Native ExecuTorch see: [Object Detection Models](../../06-api-reference/index.md#models---object-detection).
- For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

`useObjectDetection` returns an [`ObjectDetectionType`](../../06-api-reference/interfaces/ObjectDetectionType.md) object containing:

- `isReady` - Whether the model is loaded and ready to process images.
- `isGenerating` - Whether the model is currently processing an image.
- `error` - An error object if the model failed to load or encountered a runtime error.
- `downloadProgress` - A value between 0 and 1 representing the download progress of the model binary.
- `forward` - A function to run inference on an image.

## Running the model

To run the model, use the [`forward`](../../06-api-reference/interfaces/ObjectDetectionType.md#forward) method. It accepts two arguments:

- `input` (required) - The image to process. Can be a remote URL, a local file URI, a base64-encoded image (whole URI or only raw base64), or a [`PixelData`](../../06-api-reference/interfaces/PixelData.md) object (raw RGB pixel buffer).
- `detectionThreshold` (optional) - A number between 0 and 1 representing the minimum confidence score for a detection to be included in the results. Defaults to `0.7`.

`forward` returns a promise resolving to an array of [`Detection`](../../06-api-reference/interfaces/Detection.md) objects, each containing:

- `bbox` - A [`Bbox`](../../06-api-reference/interfaces/Bbox.md) object with `x1`, `y1` (top-left corner) and `x2`, `y2` (bottom-right corner) coordinates in the original image's pixel space.
- `label` - The class name of the detected object, typed to the label map of the chosen model.
- `score` - The confidence score of the detection, between 0 and 1.

## Example

```typescript
import { useObjectDetection, RF_DETR_NANO } from 'react-native-executorch';

function App() {
  const model = useObjectDetection({
    model: RF_DETR_NANO,
  });

  const handleDetect = async () => {
    if (!model.isReady) return;

    const imageUri = 'file:///Users/.../photo.jpg';

    try {
      const detections = await model.forward(imageUri, 0.5);

      for (const detection of detections) {
        console.log('Label:', detection.label);
        console.log('Score:', detection.score);
        console.log('Bounding box:', detection.bbox);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ...
}
```

## VisionCamera integration

For real-time object detection on camera frames, use `runOnFrame`. It runs synchronously on the JS worklet thread and returns `Detection[]`.

See the full guide: [VisionCamera Integration](./visioncamera-integration.md).

## Supported models

| Model                                                                                                                         | Number of classes | Class list                                               |
| ----------------------------------------------------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------- |
| [SSDLite320 MobileNetV3 Large](https://huggingface.co/software-mansion/react-native-executorch-ssdlite320-mobilenet-v3-large) | 91                | [COCO](../../06-api-reference/enumerations/CocoLabel.md) |
| [RF-DETR Nano](https://huggingface.co/software-mansion/react-native-executorch-rf-detr-nano)                                  | 80                | [COCO](../../06-api-reference/enumerations/CocoLabel.md) |
