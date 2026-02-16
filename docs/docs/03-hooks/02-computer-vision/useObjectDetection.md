---
title: useObjectDetection
---

Object detection is a computer vision technique that identifies and locates objects within images or video. It’s commonly used in applications like image recognition, video surveillance or autonomous driving.
`useObjectDetection` is a hook that allows you to seamlessly integrate object detection into your React Native applications.

:::warning
It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/object-detection-68d0ea936cd0906843cbba7d). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

## API Reference

- For detailed API Reference for `useObjectDetection` see: [`useObjectDetection` API Reference](../../06-api-reference/functions/useObjectDetection.md).
- For all object detection models available out-of-the-box in React Native ExecuTorch see: [Object Detection Models](../../06-api-reference/index.md#models---object-detection).

## High Level Overview

```tsx
import {
  useObjectDetection,
  SSDLITE_320_MOBILENET_V3_LARGE,
} from 'react-native-executorch';

function App() {
  const ssdlite = useObjectDetection({ model: SSDLITE_320_MOBILENET_V3_LARGE });

  // ...
  for (const detection of await ssdlite.forward('https://url-to-image.jpg')) {
    console.log('Bounding box: ', detection.bbox);
    console.log('Bounding label: ', detection.label);
    console.log('Bounding score: ', detection.score);
  }
  // ...
}
```

### Arguments

`useObjectDetection` takes [`ObjectDetectionProps`](../../06-api-reference/interfaces/ObjectDetectionProps.md) that consists of:

- `model` containing [`modelSource`](../../06-api-reference/interfaces/ObjectDetectionProps.md#modelsource).
- An optional flag [`preventLoad`](../../06-api-reference/interfaces/ObjectDetectionProps.md#preventload) which prevents auto-loading of the model.

You need more details? Check the following resources:

- For detailed information about `useObjectDetection` arguments check this section: [`useObjectDetection` arguments](../../06-api-reference/functions/useObjectDetection.md#parameters).
- For all object detection models available out-of-the-box in React Native ExecuTorch see: [Object Detection Models](../../06-api-reference/index.md#models---object-detection).
- For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

`useObjectDetection` returns an object called `ObjectDetectionType` containing bunch of functions to interact with object detection models. To get more details please read: [`ObjectDetectionType` API Reference](../../06-api-reference/interfaces/ObjectDetectionType.md).

## Running the model

To run the model, you can use the [`forward`](../../06-api-reference/interfaces/ObjectDetectionType.md#forward) method. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image (whole URI or only raw base64). The function returns an array of [`Detection`](../../06-api-reference/interfaces/Detection.md) objects. Each object contains coordinates of the bounding box, the label of the detected object, and the confidence score. For more information, please refer to the reference or type definitions.

## Detection object

The detection object is specified as follows:

```typescript
interface Bbox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface Detection {
  bbox: Bbox;
  label: keyof typeof CocoLabels;
  score: number;
}
```

The `bbox` property contains information about the bounding box of detected objects. It is represented as two points: one at the bottom-left corner of the bounding box (`x1`, `y1`) and the other at the top-right corner (`x2`, `y2`).
The `label` property contains the name of the detected object, which corresponds to one of the [`CocoLabels`](../../06-api-reference/enumerations/CocoLabel.md). The `score` represents the confidence score of the detected object.

## Example

```tsx
import {
  useObjectDetection,
  SSDLITE_320_MOBILENET_V3_LARGE,
} from 'react-native-executorch';

function App() {
  const ssdlite = useObjectDetection({ model: SSDLITE_320_MOBILENET_V3_LARGE });

  const runModel = async () => {
    const detections = await ssdlite.forward('https://url-to-image.jpg');

    for (const detection of detections) {
      console.log('Bounding box: ', detection.bbox);
      console.log('Bounding label: ', detection.label);
      console.log('Bounding score: ', detection.score);
    }
  };
}
```

## Supported models

| Model                                                                                                                         | Number of classes | Class list                                               |
| ----------------------------------------------------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------- |
| [SSDLite320 MobileNetV3 Large](https://huggingface.co/software-mansion/react-native-executorch-ssdlite320-mobilenet-v3-large) | 91                | [COCO](../../06-api-reference/enumerations/CocoLabel.md) |
