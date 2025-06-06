---
title: ObjectDetectionModule
---

TypeScript API implementation of the [useObjectDetection](../computer-vision/useObjectDetection.md) hook.

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

| Method               | Type                                                  | Description                                                                                              |
| -------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `load`               | `(modelSource: ResourceSource): Promise<void>`        | Loads the model, where `modelSource` is a string that specifies the location of the model binary.        |
| `forward`            | `(input: string): Promise<Detection[]>`               | Executes the model's forward pass, where `input` can be a fetchable resource or a Base64-encoded string. |
| `onDownloadProgress` | `(callback: (downloadProgress: number) => void): any` | Subscribe to the download progress event.                                                                |

<details>
<summary>Type definitions</summary>

```typescript
type ResourceSource = string | number | object;

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

## Loading the model

To load the model, use the `load` method. It accepts the `modelSource` which is a string that specifies the location of the model binary. For more information, take a look at [loading models](../fundamentals/loading-models.md) page. This method returns a promise, which can resolve to an error or void.

## Running the model

To run the model, you can use the `forward` method. It accepts one argument, which is the image. The image can be a remote URL, a local file URI, or a base64-encoded image. The method returns a promise, which can resolve either to an error or an array of `Detection` objects. Each object contains coordinates of the bounding box, the label of the detected object, and the confidence score.
