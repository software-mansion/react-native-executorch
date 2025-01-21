---
title: ObjectDetectionModule
sidebar_position: 2
---

Hookless implementation of the [useObjectDetection](../computer-vision/useObjectDetection.mdx) hook.

## Reference

```typescript
import {
  ObjectDetectionModule,
  SSDLITE_320_MOBILENET_V3_LARGE,
} from 'react-native-executorch';

const imageUri = 'path/to/image.png';

// Loading the model
await ObjectDetectionModule.load(SSDLITE_320_MOBILENET_V3_LARGE);

// Running the model
const detections = await ObjectDetectionModule.forward(imageUri);
```

### Methods

| Method    | Parameters                                     | Returns                                   | Description                                                                                              |
| --------- | ---------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `load`    | <code>modelSource: string &#124; number</code> | `Promise<void>`                           | Loads the model, where `modelSource` is a string that specifies the location of the model binary.        |
| `forward` | `input: string`                                | `Promise<{ [category: string]: number }>` | Executes the model's forward pass, where `input` can be a fetchable resource or a Base64-encoded string. |

## Loading the model

To load the model, use the `load` method. It accepts the `modelSource` which is a string that specifies the location of the model binary. For more information, take a look at [loading models](../fundamentals/loading-models.md) page. This function returns a promise, which can resolve to an error or void.

## Running the model

To run the model, you can use the `forward` method. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The function returns an array of `Detection` objects. Each object contains coordinates of the bounding box, the label of the detected object, and the confidence score. For more information, please refer to the reference or type definitions.

## Example

```typescript
import {
  ObjectDetectionModule,
  SSDLITE_320_MOBILENET_V3_LARGE,
} from 'react-native-executorch';

const imageUri = 'path/to/image.png';

try {
  // Loading the model
  await ObjectDetectionModule.load(SSDLITE_320_MOBILENET_V3_LARGE);
} catch (e) {
  console.error(e);
}

try {
  // Running the model
  const detections = await ObjectDetectionModule.forward(imageUri);
} catch (e) {
  console.error(e);
}
```
