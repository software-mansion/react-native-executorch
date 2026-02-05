# useObjectDetection

Object detection is a computer vision technique that identifies and locates objects within images or video. It’s commonly used in applications like image recognition, video surveillance or autonomous driving. `useObjectDetection` is a hook that allows you to seamlessly integrate object detection into your React Native applications.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)warning

It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/object-detection-68d0ea936cd0906843cbba7d). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `useObjectDetection` see: [`useObjectDetection` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useObjectDetection).
* For all object detection models available out-of-the-box in React Native ExecuTorch see: [Object Detection Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---object-detection).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

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

### Arguments[​](#arguments "Direct link to Arguments")

`useObjectDetection` takes [`ObjectDetectionProps`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ObjectDetectionProps) that consists of:

* `model` containing [`modelSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ObjectDetectionProps#modelsource).
* An optional flag [`preventLoad`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ObjectDetectionProps#preventload) which prevents auto-loading of the model.

You need more details? Check the following resources:

* For detailed information about `useObjectDetection` arguments check this section: [`useObjectDetection` arguments](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useObjectDetection#parameters).
* For all object detection models available out-of-the-box in React Native ExecuTorch see: [Object Detection Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---object-detection).
* For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

### Returns[​](#returns "Direct link to Returns")

`useObjectDetection` returns an object called `ObjectDetectionType` containing bunch of functions to interact with object detection models. To get more details please read: [`ObjectDetectionType` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ObjectDetectionType).

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, you can use the [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ObjectDetectionType#forward) method. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The function returns an array of [`Detection`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/Detection) objects. Each object contains coordinates of the bounding box, the label of the detected object, and the confidence score. For more information, please refer to the reference or type definitions.

## Detection object[​](#detection-object "Direct link to Detection object")

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

The `bbox` property contains information about the bounding box of detected objects. It is represented as two points: one at the bottom-left corner of the bounding box (`x1`, `y1`) and the other at the top-right corner (`x2`, `y2`). The `label` property contains the name of the detected object, which corresponds to one of the [`CocoLabels`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/CocoLabel). The `score` represents the confidence score of the detected object.

## Example[​](#example "Direct link to Example")

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

## Supported models[​](#supported-models "Direct link to Supported models")

| Model                                                                                                                         | Number of classes | Class list                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------- |
| [SSDLite320 MobileNetV3 Large](https://huggingface.co/software-mansion/react-native-executorch-ssdlite320-mobilenet-v3-large) | 91                | [COCO](https://docs.swmansion.com/react-native-executorch/docs/api-reference/enumerations/CocoLabel) |
