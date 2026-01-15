---
title: useObjectDetection
---

Object detection is a computer vision technique that identifies and locates objects within images or video. It’s commonly used in applications like image recognition, video surveillance or autonomous driving.
`useObjectDetection` is a hook that allows you to seamlessly integrate object detection into your React Native applications.

:::caution
It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/software-mansion/react-native-executorch-ssdlite320-mobilenet-v3-large). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

## Reference

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

<details>
<summary>Type definitions</summary>

```typescript
interface Bbox {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

interface Detection {
  bbox: Bbox;
  label: keyof typeof CocoLabel;
  score: number;
}
```

</details>

### Arguments

**`model`** - Object containing the model source.

- **`modelSource`** - A string that specifies the path to the model file. You can download the model from our [HuggingFace repository](https://huggingface.co/software-mansion/react-native-executorch-ssdlite320-mobilenet-v3-large/tree/main).

**`preventLoad?`** - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

The hook returns an object with the following properties:

| Field              | Type                                                                              | Description                                                                                                                                                              |
| ------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `forward`          | `(imageSource: string, detectionThreshold: number = 0.7) => Promise<Detection[]>` | A function that accepts an image (url, b64) and returns an array of `Detection` objects. `detectionThreshold` can be supplied to alter the sensitivity of the detection. |
| `error`            | <code>string &#124; null</code>                                                   | Contains the error message if the model loading failed.                                                                                                                  |
| `isGenerating`     | `boolean`                                                                         | Indicates whether the model is currently processing an inference.                                                                                                        |
| `isReady`          | `boolean`                                                                         | Indicates whether the model has successfully loaded and is ready for inference.                                                                                          |
| `downloadProgress` | `number`                                                                          | Represents the download progress as a value between 0 and 1.                                                                                                             |

## Running the model

To run the model, you can use the `forward` method. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The function returns an array of `Detection` objects. Each object contains coordinates of the bounding box, the label of the detected object, and the confidence score. For more information, please refer to the reference or type definitions.

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
The `label` property contains the name of the detected object, which corresponds to one of the `CocoLabels`. The `score` represents the confidence score of the detected object.

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

| Model                                                                                                                                                                                                                 | Number of classes | Class list                                                                                                                                                             |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [SSDLite320 MobileNetV3 Large](https://pytorch.org/vision/stable/models/generated/torchvision.models.detection.ssdlite320_mobilenet_v3_large.html#torchvision.models.detection.SSDLite320_MobileNet_V3_Large_Weights) | 91                | [COCO](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/common/rnexecutorch/models/object_detection/Constants.h) |

## Benchmarks

### Model size

| Model                          | XNNPACK [MB] |
| ------------------------------ | :----------: |
| SSDLITE_320_MOBILENET_V3_LARGE |     13.9     |

### Memory usage

| Model                          | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| ------------------------------ | :--------------------: | :----------------: |
| SSDLITE_320_MOBILENET_V3_LARGE |          164           |        132         |

### Inference time

:::warning warning
Times presented in the tables are measured as consecutive runs of the model. Initial run times may be up to 2x longer due to model loading and initialization.
:::

| Model                          | iPhone 17 Pro (XNNPACK) [ms] | iPhone 16 Pro (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | Samsung Galaxy S24 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| ------------------------------ | :--------------------------: | :--------------------------: | :------------------------: | :-------------------------------: | :-----------------------: |
| SSDLITE_320_MOBILENET_V3_LARGE |              71              |              74              |            257             |                115                |            109            |
